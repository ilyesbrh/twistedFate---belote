/**
 * Forward-only migration runner.
 *
 * Migrations live as `<n>_<name>.sql` next to this file, with `<n>`
 * a 4-digit zero-padded version (so string sort = numeric sort).
 * Applied versions are tracked in `_migrations(version, applied_at)`.
 *
 * Per-migration application happens inside a transaction so a partial
 * failure leaves the DB at the previous version, not half-applied.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Db } from "../openDb.js";

const MIGRATIONS_DIR = dirname(fileURLToPath(import.meta.url));
const FILE_PATTERN = /^(\d{4})_([a-z0-9_]+)\.sql$/;

interface MigrationFile {
  readonly version: number;
  readonly filename: string;
  readonly path: string;
}

export function runMigrations(db: Db): void {
  ensureBookkeepingTable(db);
  const applied = readAppliedVersions(db);
  const files = discoverMigrationFiles();

  for (const m of files) {
    if (applied.has(m.version)) continue;
    applyOne(db, m);
  }
}

function ensureBookkeepingTable(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version    INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);
}

function readAppliedVersions(db: Db): Set<number> {
  const rows = db.prepare("SELECT version FROM _migrations").all() as { version: number }[];
  return new Set(rows.map((r) => r.version));
}

function discoverMigrationFiles(): MigrationFile[] {
  const entries = readdirSync(MIGRATIONS_DIR, { withFileTypes: true });
  const files: MigrationFile[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = FILE_PATTERN.exec(entry.name);
    if (!match) continue;
    const versionRaw = match[1];
    if (versionRaw === undefined) continue;
    files.push({
      version: Number(versionRaw),
      filename: entry.name,
      path: join(MIGRATIONS_DIR, entry.name),
    });
  }
  files.sort((a, b) => a.version - b.version);
  return files;
}

function applyOne(db: Db, m: MigrationFile): void {
  const sql = readFileSync(m.path, "utf-8");
  db.exec("BEGIN");
  try {
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (version, applied_at) VALUES (?, ?)").run(
      m.version,
      Date.now(),
    );
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw new Error(
      `migration ${m.filename} failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
