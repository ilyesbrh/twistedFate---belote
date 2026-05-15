import type { ReactElement } from "react";
import styles from "./GameOver.module.css";

// NS = positions 0 (ElenaP) & 2 (DilyanaBl)
// EW = positions 1 (Villy) & 3 (Vane_Bane)
const NS_PLAYERS = "ElenaP & DilyanaBl";
const EW_PLAYERS = "Villy & Vane_Bane";

export type GameOverMode =
  | { readonly kind: "ai"; readonly gameVariant: "belote" | "coinche" }
  | { readonly kind: "online-friends" }
  | { readonly kind: "online-random" };

interface GameOverProps {
  /** 0 = NS wins, 1 = EW wins */
  winnerTeamIndex: 0 | 1;
  nsTotal: number;
  ewTotal: number;
  targetScore: number;
  mode: GameOverMode;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onFindNewOpponents?: () => void;
}

export function GameOver({
  winnerTeamIndex,
  nsTotal,
  ewTotal,
  targetScore,
  mode,
  onPlayAgain,
  onBackToMenu,
  onFindNewOpponents,
}: GameOverProps): ReactElement {
  const nsWins = winnerTeamIndex === 0;
  const winner = nsWins ? "NS" : "EW";
  const winnerPlayers = nsWins ? NS_PLAYERS : EW_PLAYERS;
  const youWon = nsWins; // human is always position 0 = NS team

  // Progress bar widths (cap at 100%)
  const nsWidth = Math.min(100, Math.round((nsTotal / targetScore) * 100));
  const ewWidth = Math.min(100, Math.round((ewTotal / targetScore) * 100));

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.panel}>
        {/* ── Game Over label ── */}
        <div className={styles.gameOverLabel}>GAME OVER</div>

        {/* ── Winner announcement ── */}
        <div className={styles.winnerSection}>
          <div className={`${styles.trophy} ${youWon ? styles.trophyGold : styles.trophySilver}`}>
            {youWon ? "🏆" : "🥈"}
          </div>
          <div className={`${styles.winnerTeam} ${nsWins ? styles.nsColor : styles.ewColor}`}>
            {winner} WINS!
          </div>
          <div className={styles.winnerNames}>{winnerPlayers}</div>
          <div className={`${styles.youResult} ${youWon ? styles.youWon : styles.youLost}`}>
            {youWon ? "You won this game!" : "Better luck next time!"}
          </div>
        </div>

        {/* ── Score bars ── */}
        <div className={styles.scoreBars}>
          <ScoreBar
            label="NS (You)"
            score={nsTotal}
            target={targetScore}
            widthPct={nsWidth}
            isWinner={nsWins}
            colorClass={styles.barNS}
          />

          <ScoreBar
            label="EW"
            score={ewTotal}
            target={targetScore}
            widthPct={ewWidth}
            isWinner={!nsWins}
            colorClass={styles.barEW}
          />

          <div className={styles.targetLine}>
            <span className={styles.targetLabel}>Goal: {String(targetScore)} pts</span>
          </div>
        </div>

        {/* ── CTAs — mode-aware ── */}
        <div className={styles.ctaGroup}>
          <CtaSet
            mode={mode}
            onPlayAgain={onPlayAgain}
            onBackToMenu={onBackToMenu}
            onFindNewOpponents={onFindNewOpponents}
          />
        </div>
      </div>
    </div>
  );
}

// ── CTA set ──────────────────────────────────────────────────────────────────

interface CtaSetProps {
  mode: GameOverMode;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onFindNewOpponents?: () => void;
}

function CtaSet({
  mode,
  onPlayAgain,
  onBackToMenu,
  onFindNewOpponents,
}: CtaSetProps): ReactElement {
  if (mode.kind === "ai") {
    return (
      <>
        <button
          type="button"
          className={styles.playAgainBtn}
          onClick={onPlayAgain}
          aria-label="Play again"
          data-touch="primary"
        >
          PLAY AGAIN
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onBackToMenu}
          aria-label="Back to Menu"
          data-touch="primary"
        >
          Back to Menu
        </button>
      </>
    );
  }
  if (mode.kind === "online-friends") {
    return (
      <>
        <button
          type="button"
          className={styles.playAgainBtn}
          onClick={onPlayAgain}
          aria-label="Leave room"
          data-touch="primary"
        >
          LEAVE ROOM
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onBackToMenu}
          aria-label="Back to Menu"
          data-touch="primary"
        >
          Back to Menu
        </button>
      </>
    );
  }
  // online-random
  return (
    <>
      <button
        type="button"
        className={styles.playAgainBtn}
        onClick={() => {
          onFindNewOpponents?.();
        }}
        aria-label="Find new opponents"
        data-touch="primary"
      >
        FIND NEW OPPONENTS
      </button>
      <button
        type="button"
        className={styles.secondaryBtn}
        onClick={onPlayAgain}
        aria-label="Leave"
        data-touch="primary"
      >
        LEAVE
      </button>
      <button
        type="button"
        className={styles.tertiaryBtn}
        onClick={onBackToMenu}
        aria-label="Back to Menu"
      >
        Back to Menu
      </button>
    </>
  );
}

// ── ScoreBar ─────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  label: string;
  score: number;
  target: number;
  widthPct: number;
  isWinner: boolean;
  colorClass: string;
}

function ScoreBar({
  label,
  score,
  target,
  widthPct,
  isWinner,
  colorClass,
}: ScoreBarProps): ReactElement {
  return (
    <div className={styles.barRow}>
      <span className={`${styles.barLabel} ${isWinner ? styles.barLabelWinner : ""}`}>{label}</span>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${colorClass}`}
          style={{ width: `${String(widthPct)}%` }}
        />
      </div>
      <span className={`${styles.barScore} ${isWinner ? styles.barScoreWinner : ""}`}>
        {String(score)}
        {score >= target && <span className={styles.checkMark}> ✓</span>}
      </span>
    </div>
  );
}
