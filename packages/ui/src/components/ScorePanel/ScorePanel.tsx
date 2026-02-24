import type { Suit } from '../../data/mockGame.js';
import styles from './ScorePanel.module.css';

interface ScorePanelProps {
  target: number;
  usScore: number;
  themScore: number;
  usTotalScore: number;
  themTotalScore: number;
  trumpSuit: Suit;
  dealerName: string;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  clubs: '♣',
  hearts: '♥',
  diamonds: '♦',
  spades: '♠',
};

const RED_SUITS: Suit[] = ['hearts', 'diamonds'];

export function ScorePanel({
  target,
  usScore,
  themScore,
  usTotalScore,
  themTotalScore,
  trumpSuit,
}: ScorePanelProps) {
  const isRedSuit = RED_SUITS.includes(trumpSuit);

  return (
    <div className={styles.panel} data-testid="score-panel">

      {/* Target */}
      <span className={styles.target}>{target}</span>

      <span className={styles.sep} aria-hidden="true" />

      {/* NS */}
      <div className={styles.team}>
        <span className={styles.teamLabel}>NS</span>
        <span className={styles.teamScore}>{usScore}</span>
        <span className={styles.teamTotal}>{usTotalScore}</span>
      </div>

      <span className={styles.dot} aria-hidden="true">·</span>

      {/* EW */}
      <div className={styles.team}>
        <span className={styles.teamLabel}>EW</span>
        <span className={styles.teamScore}>{themScore}</span>
        <span className={styles.teamTotal}>{themTotalScore}</span>
      </div>

      <span className={styles.sep} aria-hidden="true" />

      {/* Trump suit icon */}
      <span className={`${styles.trump} ${isRedSuit ? styles.trumpRed : styles.trumpBlack}`}>
        {SUIT_SYMBOLS[trumpSuit]}
      </span>

    </div>
  );
}
