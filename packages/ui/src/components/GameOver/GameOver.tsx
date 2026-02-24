import type { ReactElement } from 'react';
import styles from './GameOver.module.css';

// NS = positions 0 (ElenaP) & 2 (DilyanaBl)
// EW = positions 1 (Villy) & 3 (Vane_Bane)
const NS_PLAYERS = 'ElenaP & DilyanaBl';
const EW_PLAYERS = 'Villy & Vane_Bane';

interface GameOverProps {
  /** 0 = NS wins, 1 = EW wins */
  winnerTeamIndex: 0 | 1;
  nsTotal: number;
  ewTotal: number;
  targetScore: number;
  onPlayAgain: () => void;
}

export function GameOver({
  winnerTeamIndex,
  nsTotal,
  ewTotal,
  targetScore,
  onPlayAgain,
}: GameOverProps): ReactElement {
  const nsWins = winnerTeamIndex === 0;
  const winner = nsWins ? 'NS' : 'EW';
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
            {youWon ? '🏆' : '🥈'}
          </div>
          <div className={`${styles.winnerTeam} ${nsWins ? styles.nsColor : styles.ewColor}`}>
            {winner} WINS!
          </div>
          <div className={styles.winnerNames}>{winnerPlayers}</div>
          <div className={`${styles.youResult} ${youWon ? styles.youWon : styles.youLost}`}>
            {youWon ? 'You won this game!' : 'Better luck next time!'}
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

        {/* ── Play again ── */}
        <button className={styles.playAgainBtn} onClick={onPlayAgain}>
          PLAY AGAIN
        </button>

      </div>
    </div>
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

function ScoreBar({ label, score, target, widthPct, isWinner, colorClass }: ScoreBarProps): ReactElement {
  return (
    <div className={styles.barRow}>
      <span className={`${styles.barLabel} ${isWinner ? styles.barLabelWinner : ''}`}>
        {label}
      </span>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${colorClass}`}
          style={{ width: `${String(widthPct)}%` }}
        />
      </div>
      <span className={`${styles.barScore} ${isWinner ? styles.barScoreWinner : ''}`}>
        {String(score)}
        {score >= target && <span className={styles.checkMark}> ✓</span>}
      </span>
    </div>
  );
}
