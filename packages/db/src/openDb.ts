/**
 * Open a SQLite database via Node's built-in `node:sqlite`.
 *
 * Pragmas:
 *   - foreign_keys = ON   (off by default in SQLite for legacy reasons)
 *   - journal_mode = WAL  (concurrent reads + a single writer; ignored for :memory:)
 *   - synchronous  = NORMAL (WAL-safe, durable enough; faster than FULL)
 */
import { DatabaseSync } from "node:sqlite";

export interface OpenDbOptions {
  /** Filesystem path or `:memory:` for ephemeral in-test DBs. */
  readonly filename: string;
}

export type Db = DatabaseSync;

export function openDb(opts: OpenDbOptions): Db {
  const db = new DatabaseSync(opts.filename);
  db.exec("PRAGMA foreign_keys = ON;");
  if (opts.filename !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
  }
  return db;
}
