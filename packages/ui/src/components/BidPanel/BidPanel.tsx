import { useState } from "react";
import { isOnSameTeam } from "@belote/core";
import type { BiddingRound, BidValue, PlayerPosition, Suit } from "@belote/core";
import styles from "./BidPanel.module.css";

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};
const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RED_SUITS: Suit[] = ["hearts", "diamonds"];

interface BidPanelProps {
  biddingRound: BiddingRound;
  validBidValues: readonly BidValue[];
  onBid: (type: "pass" | "suit" | "coinche" | "surcoinche", value?: BidValue, suit?: Suit) => void;
}

export function BidPanel({ biddingRound, validBidValues, onBid }: BidPanelProps) {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const [selectedValue, setSelectedValue] = useState<BidValue | null>(null);

  // After a coinche, the only legal actions are pass (anyone) and surcoinche
  // (bidding team only). Suit bids and another coinche are not allowed.
  const postCoinche = biddingRound.coinched && !biddingRound.surcoinched;

  const canCoinche = !postCoinche && biddingRound.highestBid !== null;

  const canSurcoinche =
    postCoinche &&
    biddingRound.highestBid !== null &&
    isOnSameTeam(
      biddingRound.currentPlayerPosition,
      biddingRound.highestBid.playerPosition as PlayerPosition,
    );

  const canBid = !postCoinche && selectedSuit !== null && selectedValue !== null;

  function handleBid() {
    if (!canBid) return;
    onBid("suit", selectedValue!, selectedSuit!);
    setSelectedSuit(null);
    setSelectedValue(null);
  }

  return (
    <div className={styles.panel} data-testid="bid-panel">
      {/* Suit + value pickers are hidden once a coinche is on the table — the
          only valid actions are Pass and (for the bidding team) Surcontre. */}
      {!postCoinche && (
        <>
          <div className={styles.suitRow}>
            {SUITS.map((s) => (
              <button
                key={s}
                className={`${styles.btn} ${styles.suitBtn} ${RED_SUITS.includes(s) ? styles.redSuit : ""} ${selectedSuit === s ? styles.suitSelected : ""}`}
                onClick={() => setSelectedSuit((prev) => (prev === s ? null : s))}
                aria-pressed={selectedSuit === s}
                aria-label={`Pick ${s}`}
                data-touch="primary"
              >
                {SUIT_SYMBOLS[s]}
              </button>
            ))}
          </div>

          <div className={styles.sep} aria-hidden="true" />

          <div className={styles.valueGrid}>
            {validBidValues.map((v) => (
              <button
                key={v}
                className={`${styles.btn} ${styles.valueBtn} ${selectedValue === v ? styles.valueSelected : ""}`}
                onClick={() => setSelectedValue((prev) => (prev === v ? null : v))}
                aria-pressed={selectedValue === v}
                aria-label={`Bid ${String(v)} points`}
                data-touch="primary"
              >
                {String(v)}
              </button>
            ))}
          </div>

          <div className={styles.sep} aria-hidden="true" />
        </>
      )}

      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.passBtn}`}
          onClick={() => onBid("pass")}
          aria-label="Pass"
          data-touch="primary"
        >
          Pass
        </button>

        {!postCoinche && (
          <button
            className={`${styles.btn} ${styles.bidBtn}`}
            disabled={!canBid}
            onClick={handleBid}
            aria-label={
              canBid
                ? `Place bid ${SUIT_SYMBOLS[selectedSuit!]} ${String(selectedValue!)}`
                : "Place bid"
            }
            data-touch="primary"
          >
            {canBid ? `${SUIT_SYMBOLS[selectedSuit!]} ${String(selectedValue!)}` : "Bid"}
          </button>
        )}

        {canCoinche && (
          <button
            className={`${styles.btn} ${styles.coincheBtn} ${styles.fullWidth}`}
            onClick={() => onBid("coinche")}
            aria-label="Contrer"
            data-touch="primary"
          >
            Contrer
          </button>
        )}

        {canSurcoinche && (
          <button
            className={`${styles.btn} ${styles.coincheBtn} ${styles.fullWidth}`}
            onClick={() => onBid("surcoinche")}
            aria-label="Surcontrer"
            data-touch="primary"
          >
            Surcontrer
          </button>
        )}
      </div>
    </div>
  );
}
