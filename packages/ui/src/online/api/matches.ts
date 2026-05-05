/**
 * Match-history API client. Single endpoint:
 *   GET /api/matches  — current user's match history.
 *
 * 401 (no session, or guest) is surfaced via `AuthApiError` so the
 * caller can route the user to /login. All other failures throw.
 */
import { AuthApiError } from "../../auth/api.js";

export type Seat = 0 | 1 | 2 | 3;
export type Team = 0 | 1;

export interface MatchSummarySeat {
  readonly seat: Seat;
  readonly userId: string | null;
  readonly guestId: string | null;
  readonly nickname: string;
}

export interface MatchSummary {
  readonly id: string;
  readonly code: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly targetScore: number;
  readonly finalScoreNs: number;
  readonly finalScoreEw: number;
  readonly winnerTeam: Team;
  readonly seats: readonly MatchSummarySeat[];
}

export async function apiListMatches(): Promise<readonly MatchSummary[]> {
  let res: Response;
  try {
    res = await fetch("/api/matches", { credentials: "include" });
  } catch (e) {
    throw new AuthApiError("network", 0, e instanceof Error ? e.message : String(e));
  }
  if (res.status === 401) {
    throw new AuthApiError("unauthenticated", 401);
  }
  if (!res.ok) {
    let code = `http_${String(res.status)}`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === "string") code = body.error;
    } catch {
      // ignore
    }
    throw new AuthApiError(code, res.status);
  }
  const body = (await res.json()) as { matches: readonly MatchSummary[] };
  return body.matches;
}
