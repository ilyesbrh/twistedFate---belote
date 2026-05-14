import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import styles from "./BidLog.module.css";

export type LogBidType =
  | "pass"
  | "suit"
  | "coinche"
  | "surcoinche"
  | "sans-atout"
  | "tout-atout"
  | "capot";

export type LogBidSuit = "spades" | "hearts" | "diamonds" | "clubs";

export interface LogBid {
  readonly id: string;
  readonly type: LogBidType;
  readonly playerPosition: 0 | 1 | 2 | 3;
  readonly value: number | null;
  readonly suit: LogBidSuit | null;
}

export interface BidLogProfile {
  readonly name: string;
}

export interface BidLogProps {
  readonly bids: readonly LogBid[];
  readonly profiles: Partial<Record<number, BidLogProfile>>;
}

const SUIT_GLYPH: Record<LogBidSuit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const SEAT_LABEL: Record<0 | 1 | 2 | 3, string> = {
  0: "South",
  1: "West",
  2: "North",
  3: "East",
};

export function formatBidText(bid: LogBid): string {
  switch (bid.type) {
    case "pass":
      return "Pass";
    case "suit":
      return `${bid.suit !== null ? SUIT_GLYPH[bid.suit] : ""} ${String(bid.value ?? "")}`.trim();
    case "sans-atout":
      return `SA ${String(bid.value ?? "")}`.trim();
    case "tout-atout":
      return `TA ${String(bid.value ?? "")}`.trim();
    case "capot":
      return `Capot ${bid.suit !== null ? SUIT_GLYPH[bid.suit] : ""}`.trim();
    case "coinche":
      return "Contre !";
    case "surcoinche":
      return "Surcontre !";
  }
}

function resolveName(
  position: 0 | 1 | 2 | 3,
  profiles: Partial<Record<number, BidLogProfile>>,
): string {
  return profiles[position]?.name ?? SEAT_LABEL[position];
}

function entryClass(type: LogBidType): string {
  if (type === "pass") return `${styles.entry} ${styles.passEntry}`;
  if (type === "coinche" || type === "surcoinche") return `${styles.entry} ${styles.coincheEntry}`;
  return styles.entry;
}

export function BidLog({ bids, profiles }: BidLogProps): ReactElement | null {
  const ref = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [bids.length]);

  if (bids.length === 0) return null;

  return (
    <ul
      ref={ref}
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Bid history"
      className={styles.log}
    >
      {bids.map((bid) => (
        <li key={bid.id} className={entryClass(bid.type)}>
          <span className={styles.name}>{resolveName(bid.playerPosition, profiles)}</span>
          <span className={styles.sep}>—</span>
          <span className={styles.text}>{formatBidText(bid)}</span>
        </li>
      ))}
    </ul>
  );
}
