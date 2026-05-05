import { beforeEach, describe, it, expect } from "vitest";
import { openDb, type Db } from "../src/openDb.js";
import { runMigrations } from "../src/migrations/runMigrations.js";
import { createUser } from "../src/queries/users.js";
import { createGuest } from "../src/queries/guests.js";
import {
  createSession,
  findSessionByToken,
  deleteSession,
  sweepExpiredSessions,
} from "../src/queries/sessions.js";

let db: Db;

beforeEach(() => {
  db = openDb({ filename: ":memory:" });
  runMigrations(db);
});

describe("createSession (user)", () => {
  it("returns a raw token + the resolved session shape", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "p1234567", nickname: "A" });
    const { token, session } = createSession(db, { userId: u.id, ttlMs: 60_000 });
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(session.userId).toBe(u.id);
    expect(session.guestId).toBeNull();
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it("never stores the raw token (only its sha256)", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "p1234567", nickname: "A" });
    const { token } = createSession(db, { userId: u.id, ttlMs: 60_000 });
    const rows = db.prepare("SELECT token_hash FROM sessions").all() as { token_hash: string }[];
    expect(rows.length).toBe(1);
    expect(rows[0]?.token_hash).not.toBe(token);
    expect(rows[0]?.token_hash).not.toContain(token);
  });
});

describe("createSession (guest)", () => {
  it("creates a guest-bound session", () => {
    const g = createGuest(db);
    const { session } = createSession(db, { guestId: g.id, ttlMs: 60_000 });
    expect(session.guestId).toBe(g.id);
    expect(session.userId).toBeNull();
  });
});

describe("findSessionByToken", () => {
  it("resolves to the session when given the raw token", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "p1234567", nickname: "A" });
    const { token, session } = createSession(db, { userId: u.id, ttlMs: 60_000 });
    const found = findSessionByToken(db, token);
    expect(found?.userId).toBe(session.userId);
  });

  it("returns null for a tampered token", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "p1234567", nickname: "A" });
    const { token } = createSession(db, { userId: u.id, ttlMs: 60_000 });
    expect(findSessionByToken(db, token + "x")).toBeNull();
    expect(findSessionByToken(db, "")).toBeNull();
  });

  it("returns null for an expired session and deletes the row", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "p1234567", nickname: "A" });
    const { token } = createSession(db, { userId: u.id, ttlMs: -1 }); // already expired
    expect(findSessionByToken(db, token)).toBeNull();
    const remaining = (db.prepare("SELECT COUNT(*) AS c FROM sessions").get() as { c: number }).c;
    expect(remaining).toBe(0);
  });
});

describe("deleteSession", () => {
  it("removes the session row by raw token", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "p1234567", nickname: "A" });
    const { token } = createSession(db, { userId: u.id, ttlMs: 60_000 });
    deleteSession(db, token);
    const remaining = (db.prepare("SELECT COUNT(*) AS c FROM sessions").get() as { c: number }).c;
    expect(remaining).toBe(0);
  });

  it("is a no-op when the token doesn't match", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "p1234567", nickname: "A" });
    createSession(db, { userId: u.id, ttlMs: 60_000 });
    deleteSession(db, "no-such");
    const remaining = (db.prepare("SELECT COUNT(*) AS c FROM sessions").get() as { c: number }).c;
    expect(remaining).toBe(1);
  });
});

describe("sweepExpiredSessions", () => {
  it("deletes only past-expiry rows", async () => {
    const u = await createUser(db, { email: "a@b.c", password: "p1234567", nickname: "A" });
    createSession(db, { userId: u.id, ttlMs: 60_000 }); // alive
    createSession(db, { userId: u.id, ttlMs: -1 }); // expired
    createSession(db, { userId: u.id, ttlMs: -1 }); // expired
    const removed = sweepExpiredSessions(db);
    expect(removed).toBe(2);
    const remaining = (db.prepare("SELECT COUNT(*) AS c FROM sessions").get() as { c: number }).c;
    expect(remaining).toBe(1);
  });
});
