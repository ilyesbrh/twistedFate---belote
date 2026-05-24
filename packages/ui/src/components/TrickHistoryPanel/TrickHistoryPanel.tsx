import type { ReactElement, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { CardFace } from "../CardFace/CardFace.js";
import type { Position, TrickCardData } from "../../data/mockGame.js";
import styles from "./TrickHistoryPanel.module.css";

export interface TrickHistoryRecord {
  readonly trickNumber: number;
  readonly cards: readonly TrickCardData[];
  readonly winnerPosition: Position;
  readonly winnerName: string;
  readonly points: number;
}

export interface TrickHistoryPanelProps {
  readonly tricks: readonly TrickHistoryRecord[];
  readonly open: boolean;
  readonly onClose: () => void;
}

const POSITION_CLASS: Record<Position, string> = {
  south: styles.south,
  west: styles.west,
  north: styles.north,
  east: styles.east,
};

export function TrickHistoryPanel({
  tricks,
  open,
  onClose,
}: TrickHistoryPanelProps): ReactElement | null {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (n: number): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const stopProp = (e: MouseEvent): void => {
    e.stopPropagation();
  };

  // Most recent trick first.
  const ordered = [...tricks].reverse();

  return (
    <div
      className={styles.backdrop}
      data-testid="trick-history-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.drawer}
        role="dialog"
        aria-label="Trick history"
        aria-modal="true"
        onClick={stopProp}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Trick history</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close trick history"
            data-touch="primary"
          >
            ✕
          </button>
        </header>

        <ul className={styles.list}>
          {ordered.map((t) => {
            const isOpen = expanded.has(t.trickNumber);
            return (
              <li key={t.trickNumber} className={styles.item}>
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => {
                    toggle(t.trickNumber);
                  }}
                  aria-expanded={isOpen}
                  aria-label={`Trick ${String(t.trickNumber)} — ${t.winnerName} took ${String(t.points)} points`}
                >
                  <span className={styles.rowNumber}>Trick {t.trickNumber}</span>
                  <span className={styles.rowMiddle}>
                    <span className={styles.rowWinner}>{t.winnerName}</span>
                    <span className={styles.rowSep}>·</span>
                    <span className={styles.rowPoints}>{t.points} pts</span>
                  </span>
                  <span className={styles.caret} aria-hidden="true">
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>
                {isOpen && (
                  <div className={styles.cards} aria-hidden="true">
                    {t.cards.map((c) => (
                      <div
                        key={`${c.position}-${c.suit}-${c.rank}`}
                        className={`${styles.cardSlot} ${POSITION_CLASS[c.position]}`}
                        data-winner={c.position === t.winnerPosition ? "true" : undefined}
                      >
                        <CardFace suit={c.suit} rank={c.rank} />
                        <span className={styles.cardSeat}>{c.position}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
