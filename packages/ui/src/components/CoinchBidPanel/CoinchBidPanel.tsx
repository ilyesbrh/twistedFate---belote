import { useState } from "react";
import { isOnSameTeam } from "@belote/core";
import type { BiddingRound, BidValue, PlayerPosition, Suit } from "@belote/core";
import styles from "./CoinchBidPanel.module.css";

type ContractTab = "suit" | "sans-atout" | "tout-atout" | "capot";

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};
const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RED_SUITS: Suit[] = ["hearts", "diamonds"];

interface CoinchBidPanelProps {
  biddingRound: BiddingRound;
  validBidValues: readonly BidValue[];
  onBid: (
    type: "pass" | "suit" | "sans-atout" | "tout-atout" | "capot" | "coinche" | "surcoinche",
    value?: BidValue,
    suit?: Suit,
  ) => void;
}

export function CoinchBidPanel({ biddingRound, validBidValues, onBid }: CoinchBidPanelProps) {
  const [tab, setTab] = useState<ContractTab>("suit");
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const [selectedValue, setSelectedValue] = useState<BidValue | null>(null);

  const postCoinche = biddingRound.coinched && !biddingRound.surcoinched;

  const canCoinche = !postCoinche && biddingRound.highestBid !== null;

  const canSurcoinche =
    postCoinche &&
    biddingRound.highestBid !== null &&
    isOnSameTeam(
      biddingRound.currentPlayerPosition,
      biddingRound.highestBid.playerPosition as PlayerPosition,
    );

  const canBid =
    !postCoinche && selectedValue !== null && (tab !== "suit" || selectedSuit !== null);

  const canCapot = !postCoinche && tab === "capot" && selectedSuit !== null;

  function handleBid() {
    if (!canBid || selectedValue === null) return;
    if (tab === "suit") {
      if (selectedSuit === null) return;
      onBid("suit", selectedValue, selectedSuit);
    } else {
      onBid(tab, selectedValue);
    }
    setSelectedSuit(null);
    setSelectedValue(null);
  }

  function handleCapot() {
    if (!canCapot || selectedSuit === null) return;
    onBid("capot", undefined, selectedSuit);
    setSelectedSuit(null);
  }

  function bidLabel(): string {
    if (!canBid || selectedValue === null) return "Bid";
    if (tab === "suit" && selectedSuit !== null) {
      return `${SUIT_SYMBOLS[selectedSuit]} ${String(selectedValue)}`;
    }
    if (tab === "sans-atout") return `SA ${String(selectedValue)}`;
    if (tab === "tout-atout") return `TA ${String(selectedValue)}`;
    return "Bid";
  }

  function switchTab(newTab: ContractTab) {
    setTab(newTab);
    setSelectedSuit(null);
    setSelectedValue(null);
  }

  return (
    <div className={styles.panel} data-testid="bid-panel">
      {/* ── Contract-type selector (4 equal buttons, same style as suit/value pickers) ── */}
      {!postCoinche && (
        <>
          <div className={styles.contractRow}>
            {(
              [
                { id: "suit", label: "Suit", icon: "♠♥" },
                { id: "sans-atout", label: "SA", icon: "—" },
                { id: "tout-atout", label: "TA", icon: "★" },
                { id: "capot", label: "Capot", icon: "∞" },
              ] as const
            ).map(({ id, label, icon }) => (
              <button
                key={id}
                className={`${styles.btn} ${styles.contractBtn} ${tab === id ? styles.contractBtnSelected : ""}`}
                onClick={() => switchTab(id)}
                aria-pressed={tab === id}
                aria-label={
                  id === "sans-atout"
                    ? "Sans-Atout contract"
                    : id === "tout-atout"
                      ? "Tout-Atout contract"
                      : `${label} contract`
                }
                data-touch="primary"
              >
                <span className={styles.contractIcon}>{icon}</span>
                <span className={styles.contractLabel}>{label}</span>
              </button>
            ))}
          </div>
          <div className={styles.sep} aria-hidden="true" />
        </>
      )}

      {/* ── Suit picker (suit and capot tabs) ── */}
      {!postCoinche && (tab === "suit" || tab === "capot") && (
        <>
          <div className={styles.suitRow}>
            {SUITS.map((s) => (
              <button
                key={s}
                className={`${styles.btn} ${styles.suitBtn} ${RED_SUITS.includes(s) ? styles.redSuit : ""} ${selectedSuit === s ? styles.suitBtnSelected : ""}`}
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
        </>
      )}

      {/* ── Value picker (not shown for capot) ── */}
      {!postCoinche && tab !== "capot" && (
        <>
          <div className={styles.valueGrid}>
            {validBidValues.map((v) => (
              <button
                key={v}
                className={`${styles.btn} ${styles.valueBtn} ${selectedValue === v ? styles.valueBtnSelected : ""}`}
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

      {/* ── Action buttons ── */}
      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.passBtn}`}
          onClick={() => onBid("pass")}
          aria-label="Pass"
          data-touch="primary"
        >
          Pass
        </button>

        {!postCoinche && tab !== "capot" && (
          <button
            className={`${styles.btn} ${styles.bidBtn}`}
            disabled={!canBid}
            onClick={handleBid}
            aria-label={canBid ? `Place bid ${bidLabel()}` : "Place bid"}
            data-touch="primary"
          >
            {bidLabel()}
          </button>
        )}

        {!postCoinche && tab === "capot" && (
          <button
            className={`${styles.btn} ${styles.bidBtn}`}
            disabled={!canCapot}
            onClick={handleCapot}
            aria-label="Announce Capot"
            data-touch="primary"
          >
            Capot !
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
