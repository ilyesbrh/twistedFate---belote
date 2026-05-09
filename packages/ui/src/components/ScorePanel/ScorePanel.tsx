import type { Suit } from "../../data/mockGame.js";
import styles from "./ScorePanel.module.css";

interface ScorePanelProps {
  target: number;
  usScore: number;
  themScore: number;
  usTotalScore: number;
  themTotalScore: number;
  trumpSuit: Suit;
  dealerName: string;
  /** Current contract value (null when no contract yet, e.g. still bidding). */
  contractValue?: number | null;
  /** 1 = normal, 2 = contré, 4 = surcontré. */
  contractCoincheLevel?: 1 | 2 | 4;
  /** Coinche contract type — overrides trump suit display. */
  contractType?: "suit" | "sans-atout" | "tout-atout";
  /** True when the contract is an announced capot — hides the sentinel value 160. */
  isCapot?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  clubs: "♣",
  hearts: "♥",
  diamonds: "♦",
  spades: "♠",
};

const RED_SUITS: Suit[] = ["hearts", "diamonds"];

export function ScorePanel({
  target,
  usScore,
  themScore,
  usTotalScore,
  themTotalScore,
  trumpSuit,
  contractValue = null,
  contractCoincheLevel = 1,
  contractType,
  isCapot = false,
}: ScorePanelProps) {
  const isRedSuit = RED_SUITS.includes(trumpSuit);
  const isSA = contractType === "sans-atout";
  const isTA = contractType === "tout-atout";
  const levelLabel =
    contractCoincheLevel === 4 ? "SURCONTRE" : contractCoincheLevel === 2 ? "CONTRE" : null;

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

      <span className={styles.dot} aria-hidden="true">
        ·
      </span>

      {/* EW */}
      <div className={styles.team}>
        <span className={styles.teamLabel}>EW</span>
        <span className={styles.teamScore}>{themScore}</span>
        <span className={styles.teamTotal}>{themTotalScore}</span>
      </div>

      <span className={styles.sep} aria-hidden="true" />

      {/* Contract value — hidden for capot (sentinel 160) */}
      {contractValue !== null && !isCapot && (
        <span className={styles.contractValue}>{contractValue}</span>
      )}

      {/* Trump suit icon — replaced with SA/TA/Cap for Coinche special contracts */}
      <span className={`${styles.trump} ${isRedSuit && !isSA && !isTA ? styles.trumpRed : styles.trumpBlack}`}>
        {isCapot ? "Cap" : isSA ? "SA" : isTA ? "TA" : SUIT_SYMBOLS[trumpSuit]}
      </span>

      {/* Coinche level badge */}
      {levelLabel !== null && (
        <span
          className={`${styles.contractLevel} ${
            contractCoincheLevel === 4 ? styles.contractLevelSurcontre : styles.contractLevelContre
          }`}
        >
          ×{contractCoincheLevel} {levelLabel}
        </span>
      )}
    </div>
  );
}
