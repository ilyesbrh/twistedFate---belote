import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { Suit } from "@belote/core";
import type { Position } from "../../data/mockGame.js";
import styles from "./BidWinReveal.module.css";

const SUIT_GLYPH: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_RED: Record<Suit, boolean> = {
  hearts: true,
  diamonds: true,
  clubs: false,
  spades: false,
};

interface BidWinRevealProps {
  contractValue: number;
  contractSuit: Suit;
  contractCoincheLevel: number;
  /** Coinche contract type — overrides suit glyph display. */
  contractType?: "suit" | "sans-atout" | "tout-atout";
  /** True when the contract is an announced capot (shows "Capot" instead of value). */
  isCapot?: boolean;
  winnerPosition: Position;
  winnerName: string;
  onComplete: () => void;
}

/**
 * Full-screen reveal that fires when bidding closes.
 *
 * Stages:
 *   1. Wax-seal medallion pops in at screen centre (≈600 ms).
 *   2. Medallion translates + scales to the winner's avatar quadrant
 *      (≈700 ms travel).
 *   3. Fades out, leaving the persistent contract stamp behind on the
 *      avatar.
 *
 * Visually replaces the previous "tiny ★ stamp appears silently" feedback.
 */
export function BidWinReveal({
  contractValue,
  contractSuit,
  contractCoincheLevel,
  contractType,
  isCapot = false,
  winnerPosition,
  winnerName,
  onComplete,
}: BidWinRevealProps): ReactElement {
  const [stage, setStage] = useState<"pop" | "travel" | "gone">("pop");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("travel"), 650);
    const t2 = setTimeout(() => setStage("gone"), 1500);
    const t3 = setTimeout(() => onComplete(), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const isSA = contractType === "sans-atout";
  const isTA = contractType === "tout-atout";
  const glyph = SUIT_GLYPH[contractSuit];
  const isRed = SUIT_RED[contractSuit];
  const coincheLabel =
    contractCoincheLevel === 2 ? "Coinche!" : contractCoincheLevel >= 3 ? "Surcoinche!" : null;

  return (
    <div
      className={`${styles.root} ${styles[`stage_${stage}`]} ${styles[`pos_${winnerPosition}`]}`}
      data-testid="bid-win-reveal"
      aria-hidden={stage === "gone"}
    >
      <div className={styles.medallion}>
        {isCapot ? (
          <>
            <span className={styles.suit}>Capot</span>
            <span className={`${styles.suit} ${isRed ? styles.suitRed : ""}`}>{glyph}</span>
          </>
        ) : isSA ? (
          <span className={styles.suit}>SA</span>
        ) : isTA ? (
          <span className={styles.suit}>TA</span>
        ) : (
          <span className={`${styles.suit} ${isRed ? styles.suitRed : ""}`}>{glyph}</span>
        )}
        {!isCapot && <span className={styles.value}>{contractValue}</span>}
      </div>
      <div className={styles.label}>
        {coincheLabel ? <span className={styles.coinche}>{coincheLabel}</span> : null}
        <span className={styles.winner}>{winnerName}</span>
      </div>
    </div>
  );
}
