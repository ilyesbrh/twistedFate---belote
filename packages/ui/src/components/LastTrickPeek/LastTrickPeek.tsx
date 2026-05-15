import type { ReactElement, MouseEvent } from "react";
import { CardFace } from "../CardFace/CardFace.js";
import type { Position, TrickCardData } from "../../data/mockGame.js";
import styles from "./LastTrickPeek.module.css";

export interface LastTrickPeekProps {
  readonly cards: readonly TrickCardData[];
  readonly winnerPosition: Position;
  readonly winnerName: string;
  readonly onClose: () => void;
}

const POSITION_CLASS: Record<Position, string> = {
  south: styles.south,
  west: styles.west,
  north: styles.north,
  east: styles.east,
};

export function LastTrickPeek({
  cards,
  winnerPosition,
  winnerName,
  onClose,
}: LastTrickPeekProps): ReactElement {
  const stopProp = (e: MouseEvent): void => {
    e.stopPropagation();
  };

  return (
    <div
      className={styles.backdrop}
      data-testid="last-trick-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-label="Last trick"
        aria-modal="true"
        onClick={stopProp}
      >
        <h2 className={styles.heading}>Last trick — {winnerName} won</h2>
        <div className={styles.compass} aria-hidden="true">
          {cards.map((c) => (
            <div
              key={`${c.position}-${c.suit}-${c.rank}`}
              className={`${styles.cardSlot} ${POSITION_CLASS[c.position]}`}
              data-winner={c.position === winnerPosition ? "true" : undefined}
            >
              <CardFace suit={c.suit} rank={c.rank} />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close last trick"
          data-touch="primary"
        >
          Close
        </button>
      </div>
    </div>
  );
}
