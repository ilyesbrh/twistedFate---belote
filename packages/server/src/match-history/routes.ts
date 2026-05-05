/**
 * Match history HTTP routes. Mounted at /api/matches.
 *
 * Currently only one endpoint:
 *   GET /api/matches  → the current user's history (401 for guests)
 *
 * Guests are excluded for now: their cookie can be reset any time
 * and showing a list that won't survive a sign-out is worse than no
 * list. Once the account-upgrade UX exists they'll see retroactive
 * history via `users.upgraded_to_user_id`.
 */
import type { FastifyInstance } from "fastify";
import { listUserMatches, type Db, type MatchRow } from "@belote/db";

export interface MatchRoutesOptions {
  readonly db: Db;
}

interface MatchSummaryWire {
  readonly id: string;
  readonly code: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly targetScore: number;
  readonly finalScoreNs: number;
  readonly finalScoreEw: number;
  readonly winnerTeam: 0 | 1;
  readonly seats: readonly {
    readonly seat: 0 | 1 | 2 | 3;
    readonly userId: string | null;
    readonly guestId: string | null;
    readonly nickname: string;
  }[];
}

function rowToWire(m: MatchRow): MatchSummaryWire {
  return {
    id: m.id,
    code: m.code,
    startedAt: m.startedAt,
    endedAt: m.endedAt,
    targetScore: m.targetScore,
    finalScoreNs: m.finalScoreNs,
    finalScoreEw: m.finalScoreEw,
    winnerTeam: m.winnerTeam,
    seats: m.seats.map((s) => ({
      seat: s.seat,
      userId: s.userId,
      guestId: s.guestId,
      nickname: s.nickname,
    })),
  };
}

export function registerMatchRoutes(fastify: FastifyInstance, opts: MatchRoutesOptions): void {
  const db = opts.db;

  fastify.get("/api/matches", (req, reply) => {
    const session = req.session;
    if (!session || session.kind !== "user") {
      return reply.code(401).send({ error: "unauthenticated" });
    }
    const matches = listUserMatches(db, session.user.id).map(rowToWire);
    return reply.code(200).send({ matches });
  });
}
