/**
 * guests table queries.
 *
 * Anonymous players. A guest can later be "upgraded" to a user, which
 * keeps the same `guests.id` so any existing references (e.g. match
 * history rows recorded under the guest id) stay valid.
 */
import { randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import type { Db } from "../openDb.js";

export interface Guest {
  readonly id: string;
  readonly nickname: string;
  readonly createdAt: number;
  readonly upgradedToUserId: string | null;
}

interface GuestRow {
  readonly id: string;
  readonly nickname: string;
  readonly created_at: number;
  readonly upgraded_to_user_id: string | null;
}

function rowToGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    nickname: row.nickname,
    createdAt: row.created_at,
    upgradedToUserId: row.upgraded_to_user_id,
  };
}

function defaultNickname(): string {
  return `Guest-${randomBytes(2).toString("hex")}`;
}

export interface CreateGuestInput {
  readonly nickname?: string;
}

export function createGuest(db: Db, input: CreateGuestInput = {}): Guest {
  const id = nanoid();
  const nickname = input.nickname ?? defaultNickname();
  const now = Date.now();
  db.prepare(
    "INSERT INTO guests (id, nickname, created_at, upgraded_to_user_id) VALUES (?, ?, ?, NULL)",
  ).run(id, nickname, now);
  return { id, nickname, createdAt: now, upgradedToUserId: null };
}

export function findGuestById(db: Db, id: string): Guest | null {
  const row = db.prepare("SELECT * FROM guests WHERE id = ?").get(id) as GuestRow | undefined;
  return row ? rowToGuest(row) : null;
}

export function upgradeGuestToUser(db: Db, guestId: string, userId: string): void {
  // Validate the guest exists; the FK on upgraded_to_user_id will reject a bad userId.
  const existing = db.prepare("SELECT id FROM guests WHERE id = ?").get(guestId) as
    | { id: string }
    | undefined;
  if (!existing) {
    throw new Error(`upgradeGuestToUser: guest not found: ${guestId}`);
  }
  db.prepare("UPDATE guests SET upgraded_to_user_id = ? WHERE id = ?").run(userId, guestId);
}
