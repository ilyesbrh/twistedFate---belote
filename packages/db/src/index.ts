/**
 * @belote/db — SQLite persistence layer.
 *
 * Built on Node's built-in `node:sqlite`. Public surface:
 *   - openDb({ filename })            → DatabaseSync, configured for our use
 *   - runMigrations(db)               → applies any pending SQL migrations
 *   - hashPassword / verifyPassword   → scrypt PHC
 *   - createUser / findUserByEmail / findUserById / verifyUserPassword
 *   - createGuest / findGuestById / upgradeGuestToUser
 *   - createSession / findSessionByToken / deleteSession / sweepExpiredSessions
 */

export { openDb } from "./openDb.js";
export type { Db } from "./openDb.js";
export { runMigrations } from "./migrations/runMigrations.js";

export { hashPassword, verifyPassword } from "./hash.js";

export {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUserPassword,
  updateUser,
  getUserStats,
} from "./queries/users.js";
export type { User, NewUser, UserPatch, UserStats } from "./queries/users.js";

export { createGuest, findGuestById, upgradeGuestToUser } from "./queries/guests.js";
export type { Guest } from "./queries/guests.js";

export {
  createSession,
  findSessionByToken,
  deleteSession,
  sweepExpiredSessions,
} from "./queries/sessions.js";
export type { Session, ResolvedSession } from "./queries/sessions.js";

export { recordMatch, listUserMatches, listGuestMatches } from "./queries/matches.js";
export type { MatchRow, MatchSeat, RecordMatchInput, Team } from "./queries/matches.js";

export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
} from "./queries/friends.js";
export type { FriendSummary, FriendRequestSummary } from "./queries/friends.js";
