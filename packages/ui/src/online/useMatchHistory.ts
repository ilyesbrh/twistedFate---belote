/**
 * Match-history fetcher hook. Calls /api/matches on mount and exposes
 * the result + loading/error states.
 *
 * Caller should only mount this when they want a fresh fetch; e.g.
 * App mounts it conditionally when `screen === "history"`. Re-mounting
 * triggers a refetch.
 */
import { useEffect, useState } from "react";
import { AuthApiError } from "../auth/api.js";
import { authErrorMessage } from "../auth/messages.js";
import { apiListMatches, type MatchSummary } from "./api/matches.js";

export interface MatchHistoryState {
  readonly matches: readonly MatchSummary[];
  readonly loading: boolean;
  readonly error: string | null;
}

export function useMatchHistory(): MatchHistoryState {
  const [matches, setMatches] = useState<readonly MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiListMatches()
      .then((data) => {
        if (cancelled) return;
        setMatches(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const code = e instanceof AuthApiError ? e.code : "unknown";
        setError(authErrorMessage(code));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { matches, loading, error };
}
