/**
 * Friend graph queries.
 *
 * Single asymmetric `friendships` row per pair, with a status:
 *   - 'pending'   : addressee hasn't responded yet
 *   - 'accepted'  : both sides see each other in their friends list
 *
 * Reject + cancel both DELETE the row. Re-sending after a reject is
 * therefore allowed and creates a fresh row.
 *
 * Listing accepted friends unions both directions in SQL, then joins
 * `users` so the caller gets the friend's nickname + email.
 */
import { nanoid } from "nanoid";
import type { Db } from "../openDb.js";

export interface FriendSummary {
  readonly userId: string;
  readonly email: string;
  readonly nickname: string;
  readonly avatarUrl: string | null;
}

export interface FriendRequestSummary {
  readonly id: string;
  readonly otherUserId: string;
  readonly otherEmail: string;
  readonly otherNickname: string;
  readonly createdAt: number;
}

interface RawFriendRow {
  readonly id: string;
  readonly requester_user_id: string;
  readonly addressee_user_id: string;
  readonly status: "pending" | "accepted";
  readonly created_at: number;
  readonly updated_at: number;
}

export function sendFriendRequest(db: Db, requesterId: string, addresseeId: string): string {
  if (requesterId === addresseeId) {
    throw new Error("sendFriendRequest: cannot friend yourself");
  }
  // Check for any existing row in either direction (UNIQUE only covers one direction).
  const existing = db
    .prepare(
      `SELECT id, status FROM friendships
       WHERE (requester_user_id = ? AND addressee_user_id = ?)
          OR (requester_user_id = ? AND addressee_user_id = ?)`,
    )
    .get(requesterId, addresseeId, addresseeId, requesterId) as
    | { id: string; status: string }
    | undefined;
  if (existing) {
    throw new Error(
      existing.status === "accepted"
        ? "sendFriendRequest: already friends"
        : "sendFriendRequest: a request between these users already exists",
    );
  }
  const id = nanoid();
  const now = Date.now();
  db.prepare(
    `INSERT INTO friendships
       (id, requester_user_id, addressee_user_id, status, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`,
  ).run(id, requesterId, addresseeId, now, now);
  return id;
}

export function acceptFriendRequest(db: Db, requestId: string, actorUserId: string): void {
  const row = db.prepare("SELECT * FROM friendships WHERE id = ?").get(requestId) as
    | RawFriendRow
    | undefined;
  if (!row) throw new Error("acceptFriendRequest: not found");
  if (row.addressee_user_id !== actorUserId) {
    throw new Error("acceptFriendRequest: only the addressee can accept");
  }
  if (row.status === "accepted") return; // idempotent
  db.prepare("UPDATE friendships SET status = 'accepted', updated_at = ? WHERE id = ?").run(
    Date.now(),
    requestId,
  );
}

export function rejectFriendRequest(db: Db, requestId: string, actorUserId: string): void {
  const row = db.prepare("SELECT * FROM friendships WHERE id = ?").get(requestId) as
    | RawFriendRow
    | undefined;
  if (!row) return; // already gone
  if (row.addressee_user_id !== actorUserId) {
    throw new Error("rejectFriendRequest: only the addressee can reject");
  }
  if (row.status !== "pending") {
    throw new Error("rejectFriendRequest: not pending");
  }
  db.prepare("DELETE FROM friendships WHERE id = ?").run(requestId);
}

export function cancelFriendRequest(db: Db, requestId: string, actorUserId: string): void {
  const row = db.prepare("SELECT * FROM friendships WHERE id = ?").get(requestId) as
    | RawFriendRow
    | undefined;
  if (!row) return;
  if (row.requester_user_id !== actorUserId) return; // silent no-op for non-requester
  if (row.status !== "pending") return;
  db.prepare("DELETE FROM friendships WHERE id = ?").run(requestId);
}

export function removeFriend(db: Db, actorUserId: string, otherUserId: string): void {
  db.prepare(
    `DELETE FROM friendships
     WHERE status = 'accepted'
       AND ((requester_user_id = ? AND addressee_user_id = ?)
         OR (requester_user_id = ? AND addressee_user_id = ?))`,
  ).run(actorUserId, otherUserId, otherUserId, actorUserId);
}

interface FriendJoinRow {
  readonly id: string;
  readonly email: string;
  readonly nickname: string;
  readonly avatar_url: string | null;
}

export function listFriends(db: Db, userId: string): readonly FriendSummary[] {
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.nickname, u.avatar_url
       FROM friendships f
       JOIN users u ON u.id = CASE
         WHEN f.requester_user_id = ? THEN f.addressee_user_id
         ELSE f.requester_user_id
       END
       WHERE f.status = 'accepted'
         AND (f.requester_user_id = ? OR f.addressee_user_id = ?)
       ORDER BY u.nickname COLLATE NOCASE`,
    )
    .all(userId, userId, userId) as FriendJoinRow[];
  return rows.map((r) => ({
    userId: r.id,
    email: r.email,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
  }));
}

interface PendingJoinRow {
  readonly id: string;
  readonly created_at: number;
  readonly other_id: string;
  readonly other_email: string;
  readonly other_nickname: string;
}

export function listIncomingRequests(db: Db, userId: string): readonly FriendRequestSummary[] {
  const rows = db
    .prepare(
      `SELECT f.id, f.created_at,
              u.id        AS other_id,
              u.email     AS other_email,
              u.nickname  AS other_nickname
       FROM friendships f
       JOIN users u ON u.id = f.requester_user_id
       WHERE f.status = 'pending' AND f.addressee_user_id = ?
       ORDER BY f.created_at DESC`,
    )
    .all(userId) as PendingJoinRow[];
  return rows.map((r) => ({
    id: r.id,
    otherUserId: r.other_id,
    otherEmail: r.other_email,
    otherNickname: r.other_nickname,
    createdAt: r.created_at,
  }));
}

export function listOutgoingRequests(db: Db, userId: string): readonly FriendRequestSummary[] {
  const rows = db
    .prepare(
      `SELECT f.id, f.created_at,
              u.id        AS other_id,
              u.email     AS other_email,
              u.nickname  AS other_nickname
       FROM friendships f
       JOIN users u ON u.id = f.addressee_user_id
       WHERE f.status = 'pending' AND f.requester_user_id = ?
       ORDER BY f.created_at DESC`,
    )
    .all(userId) as PendingJoinRow[];
  return rows.map((r) => ({
    id: r.id,
    otherUserId: r.other_id,
    otherEmail: r.other_email,
    otherNickname: r.other_nickname,
    createdAt: r.created_at,
  }));
}
