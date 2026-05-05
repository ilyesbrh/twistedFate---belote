import type { ReactElement } from "react";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import type { MatchSummary } from "../../online/api/matches.js";
import styles from "./HistoryScreen.module.css";

export interface HistoryScreenProps {
  readonly matches: readonly MatchSummary[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly currentUserId: string;
  readonly onBack: () => void;
}

export function HistoryScreen(props: HistoryScreenProps): ReactElement {
  const { matches, loading, error, currentUserId, onBack } = props;
  return (
    <MenuFelt className={styles.root}>
      <div data-testid="history-screen" className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Match history</h1>
          <button
            type="button"
            className={styles.backBtn}
            data-testid="history-back"
            onClick={onBack}
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className={styles.error} data-testid="history-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading} data-testid="history-loading">
            Loading…
          </div>
        ) : matches.length === 0 ? (
          <div className={styles.empty} data-testid="history-empty">
            No games yet — your first match will appear here.
          </div>
        ) : (
          <div className={styles.list}>
            {matches.map((m) => (
              <MatchRow key={m.id} match={m} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </MenuFelt>
  );
}

interface MatchRowProps {
  readonly match: MatchSummary;
  readonly currentUserId: string;
}

function MatchRow({ match, currentUserId }: MatchRowProps): ReactElement {
  const userSeat = match.seats.find((s) => s.userId === currentUserId);
  const userTeam: 0 | 1 | null = userSeat === undefined ? null : userSeat.seat % 2 === 0 ? 0 : 1;
  const won = userTeam !== null && userTeam === match.winnerTeam;
  const partners = match.seats.filter((s) => s.userId !== currentUserId);
  const namesLine = partners.map((s) => s.nickname).join(", ");
  const date = new Date(match.endedAt).toLocaleDateString();
  const myScore = userTeam === 0 ? match.finalScoreNs : match.finalScoreEw;
  const theirScore = userTeam === 0 ? match.finalScoreEw : match.finalScoreNs;
  return (
    <div className={styles.row} data-testid={`history-row-${match.id}`}>
      <div className={styles.code}>{match.code}</div>
      <div className={styles.meta}>
        <div className={styles.partners}>vs {namesLine}</div>
        <div className={styles.score}>
          {String(myScore)} – {String(theirScore)}
        </div>
        <div className={styles.date}>{date}</div>
      </div>
      <div
        className={`${styles.badge} ${won ? styles.badgeWin : styles.badgeLoss}`}
        data-testid={`history-badge-${match.id}`}
      >
        {won ? "Win" : "Loss"}
      </div>
    </div>
  );
}
