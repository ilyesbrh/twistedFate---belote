import { describe, it, expect } from "vitest";
import { openDb } from "../src/openDb.js";
import { runMigrations } from "../src/migrations/runMigrations.js";

describe("runMigrations", () => {
  it("creates the _migrations bookkeeping table on first run", () => {
    const db = openDb({ filename: ":memory:" });
    runMigrations(db);
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_migrations'")
      .get() as { name?: string } | undefined;
    expect(row?.name).toBe("_migrations");
  });

  it("records each applied migration version with an applied_at timestamp", () => {
    const db = openDb({ filename: ":memory:" });
    runMigrations(db);
    const rows = db
      .prepare("SELECT version, applied_at FROM _migrations ORDER BY version")
      .all() as { version: number; applied_at: number }[];
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]?.version).toBe(1);
    expect(typeof rows[0]?.applied_at).toBe("number");
    expect(rows[0]!.applied_at).toBeGreaterThan(0);
  });

  it("creates the users / guests / sessions tables (0001_init schema)", () => {
    const db = openDb({ filename: ":memory:" });
    runMigrations(db);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain("users");
    expect(names).toContain("guests");
    expect(names).toContain("sessions");
  });

  it("is idempotent — second invocation is a no-op", () => {
    const db = openDb({ filename: ":memory:" });
    runMigrations(db);
    const before = (db.prepare("SELECT COUNT(*) AS c FROM _migrations").get() as { c: number }).c;
    runMigrations(db);
    const after = (db.prepare("SELECT COUNT(*) AS c FROM _migrations").get() as { c: number }).c;
    expect(after).toBe(before);
  });

  it("applies migrations in numeric order (sorted by file prefix)", () => {
    // Smoke check on the file naming contract: every migration we ship
    // must start with a 4-digit zero-padded version. The runner relies on
    // string sort matching numeric sort because of this padding.
    const db = openDb({ filename: ":memory:" });
    runMigrations(db);
    const versions = (
      db.prepare("SELECT version FROM _migrations ORDER BY version").all() as {
        version: number;
      }[]
    ).map((r) => r.version);
    // Versions must be a strictly-increasing sequence starting at 1.
    for (let i = 0; i < versions.length; i++) {
      expect(versions[i]).toBe(i + 1);
    }
  });

  it("enforces foreign keys (sessions.user_id FK is real)", () => {
    const db = openDb({ filename: ":memory:" });
    runMigrations(db);
    expect(() =>
      db
        .prepare(
          `INSERT INTO sessions (token_hash, user_id, guest_id, created_at, expires_at)
           VALUES ('h', 'no-such-user', NULL, 0, 0)`,
        )
        .run(),
    ).toThrow();
  });

  it("CHECK constraint: exactly one of user_id / guest_id must be set", () => {
    const db = openDb({ filename: ":memory:" });
    runMigrations(db);
    // Both null → fail
    expect(() =>
      db
        .prepare(
          `INSERT INTO sessions (token_hash, user_id, guest_id, created_at, expires_at)
           VALUES ('h', NULL, NULL, 0, 0)`,
        )
        .run(),
    ).toThrow();
  });
});
