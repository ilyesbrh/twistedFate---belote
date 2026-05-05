/**
 * matches + match_seats queries.
 *
 * `recordMatch` is the only mutating call; both inserts run inside a
 * transaction so a partial write can never leak. Listing queries
 * always return matches with their full seat roster, ordered by most
 * recent first.
 */
import { nanoid } from "nanoid";
import type { Db } from "../openDb.js";

export type Seat = 0 | 1 | 2 | 3;
export type Team = 0 | 1;

export interface MatchSeat {
  readonly seat: Seat;
  readonly userId: string | null;
  readonly guestId: string | null;
  readonly nickname: string;
}

export interface RecordMatchInput {
  readonly code: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly targetScore: number;
  readonly finalScoreNs: number;
  readonly finalScoreEw: number;
  readonly winnerTeam: Team;
  readonly seats: readonly MatchSeat[];
}

export interface MatchRow {
  readonly id: string;
  readonly code: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly targetScore: number;
  readonly finalScoreNs: number;
  readonly finalScoreEw: number;
  readonly winnerTeam: Team;
  readonly seats: readonly MatchSeat[];
}

interface RawMatchRow {
  readonly id: string;
  readonly code: string;
  readonly started_at: number;
  readonly ended_at: number;
  readonly target_score: number;
  readonly final_score_ns: number;
  readonly final_score_ew: number;
  readonly winner_team: Team;
}

interface RawSeatRow {
  readonly match_id: string;
  readonly seat: Seat;
  readonly user_id: string | null;
  readonly guest_id: string | null;
  readonly nickname: string;
}

function rowToMatch(m: RawMatchRow, seats: readonly MatchSeat[]): MatchRow {
  return {
    id: m.id,
    code: m.code,
    startedAt: m.started_at,
    endedAt: m.ended_at,
    targetScore: m.target_score,
    finalScoreNs: m.final_score_ns,
    finalScoreEw: m.final_score_ew,
    winnerTeam: m.winner_team,
    seats,
  };
}

function seatRowToSeat(r: RawSeatRow): MatchSeat {
  return { seat: r.seat, userId: r.user_id, guestId: r.guest_id, nickname: r.nickname };
}

export function recordMatch(db: Db, input: RecordMatchInput): string {
  if (input.seats.length !== 4) {
    throw new Error(`recordMatch: expected 4 seats, got ${String(input.seats.length)}`);
  }
  const id = nanoid();
  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO matches
         (id, code, started_at, ended_at, target_score, final_score_ns, final_score_ew, winner_team)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.code,
      input.startedAt,
      input.endedAt,
      input.targetScore,
      input.finalScoreNs,
      input.finalScoreEw,
      input.winnerTeam,
    );
    const insertSeat = db.prepare(
      `INSERT INTO match_seats (match_id, seat, user_id, guest_id, nickname)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const s of input.seats) {
      insertSeat.run(id, s.seat, s.userId, s.guestId, s.nickname);
    }
    db.exec("COMMIT");
    return id;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function listSeatsForMatch(db: Db, matchId: string): readonly MatchSeat[] {
  const rows = db
    .prepare("SELECT * FROM match_seats WHERE match_id = ? ORDER BY seat")
    .all(matchId) as RawSeatRow[];
  return rows.map(seatRowToSeat);
}

export function listUserMatches(db: Db, userId: string): readonly MatchRow[] {
  const rows = db
    .prepare(
      `SELECT m.* FROM matches m
       JOIN match_seats s ON s.match_id = m.id
       WHERE s.user_id = ?
       GROUP BY m.id
       ORDER BY m.ended_at DESC`,
    )
    .all(userId) as RawMatchRow[];
  return rows.map((m) => rowToMatch(m, listSeatsForMatch(db, m.id)));
}

export function listGuestMatches(db: Db, guestId: string): readonly MatchRow[] {
  const rows = db
    .prepare(
      `SELECT m.* FROM matches m
       JOIN match_seats s ON s.match_id = m.id
       WHERE s.guest_id = ?
       GROUP BY m.id
       ORDER BY m.ended_at DESC`,
    )
    .all(guestId) as RawMatchRow[];
  return rows.map((m) => rowToMatch(m, listSeatsForMatch(db, m.id)));
}
