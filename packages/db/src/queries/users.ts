/**
 * users table queries.
 *
 * Email is normalized to lowercase on write and on lookup so the
 * UNIQUE constraint and equality checks behave case-insensitively.
 */
import { nanoid } from "nanoid";
import type { Db } from "../openDb.js";
import { hashPassword, verifyPassword } from "../hash.js";

export interface User {
  readonly id: string;
  readonly email: string;
  readonly nickname: string;
  readonly avatarUrl: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface NewUser {
  readonly email: string;
  readonly password: string;
  readonly nickname: string;
}

interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly password_hash: string;
  readonly nickname: string;
  readonly avatar_url: string | null;
  readonly created_at: number;
  readonly updated_at: number;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(db: Db, input: NewUser): Promise<User> {
  const id = nanoid();
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const now = Date.now();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, nickname, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?)`,
  ).run(id, email, passwordHash, input.nickname, now, now);
  return {
    id,
    email,
    nickname: input.nickname,
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function findUserByEmail(db: Db, email: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(email)) as
    | UserRow
    | undefined;
  return row ? rowToUser(row) : null;
}

export function findUserById(db: Db, id: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export async function verifyUserPassword(
  db: Db,
  email: string,
  password: string,
): Promise<User | null> {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(email)) as
    | UserRow
    | undefined;
  if (!row) return null;
  const ok = await verifyPassword(password, row.password_hash);
  return ok ? rowToUser(row) : null;
}
