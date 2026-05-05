/**
 * sessions table queries.
 *
 * The cookie carries a raw 32-byte token (base64url). We store only
 * `sha256(token)`, so a DB leak is not directly impersonatable —
 * an attacker would still need the cookie. Lookups hash the input
 * the same way before the WHERE.
 *
 * Each session is bound to exactly one of (user_id, guest_id), enforced
 * by a CHECK constraint in the schema.
 */
import { createHash, randomBytes } from "node:crypto";
import type { Db } from "../openDb.js";

export interface Session {
  readonly userId: string | null;
  readonly guestId: string | null;
  readonly createdAt: number;
  readonly expiresAt: number;
}

/**
 * Resolved session — what `findSessionByToken` returns. Same shape as
 * Session for now; kept distinct so future fields (eg. last_seen) only
 * land on the resolved view, not the create-time return.
 */
export type ResolvedSession = Session;

export interface CreateSessionInput {
  /** Exactly one of userId / guestId must be set. */
  readonly userId?: string;
  readonly guestId?: string;
  /** Time-to-live in milliseconds. Negative values produce already-expired sessions (used in tests). */
  readonly ttlMs: number;
}

export interface CreatedSession {
  /** The raw cookie token. The client must store this; we don't hand it back later. */
  readonly token: string;
  readonly session: Session;
}

interface SessionRow {
  readonly token_hash: string;
  readonly user_id: string | null;
  readonly guest_id: string | null;
  readonly created_at: number;
  readonly expires_at: number;
}

function rowToSession(row: SessionRow): Session {
  return {
    userId: row.user_id,
    guestId: row.guest_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createSession(db: Db, input: CreateSessionInput): CreatedSession {
  const userId = input.userId ?? null;
  const guestId = input.guestId ?? null;
  if ((userId === null) === (guestId === null)) {
    throw new Error("createSession: pass exactly one of userId or guestId");
  }
  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = Date.now();
  const expiresAt = now + input.ttlMs;
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, guest_id, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(tokenHash, userId, guestId, now, expiresAt);
  return {
    token,
    session: { userId, guestId, createdAt: now, expiresAt },
  };
}

export function findSessionByToken(db: Db, rawToken: string): ResolvedSession | null {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const row = db.prepare("SELECT * FROM sessions WHERE token_hash = ?").get(tokenHash) as
    | SessionRow
    | undefined;
  if (!row) return null;
  if (row.expires_at <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }
  return rowToSession(row);
}

export function deleteSession(db: Db, rawToken: string): void {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function sweepExpiredSessions(db: Db): number {
  const result = db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  return Number(result.changes);
}
