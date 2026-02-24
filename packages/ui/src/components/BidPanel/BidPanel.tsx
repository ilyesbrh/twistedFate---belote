import { useState } from 'react';
import type { BiddingRound, BidValue, Suit } from '@belote/core';
import styles from './BidPanel.module.css';

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades:   '♠',
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
};
const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RED_SUITS: Suit[] = ['hearts', 'diamonds'];

interface BidPanelProps {
  biddingRound: BiddingRound;
  validBidValues: readonly BidValue[];
  onBid: (type: 'pass' | 'suit' | 'coinche', value?: BidValue, suit?: Suit) => void;
}

export function BidPanel({ biddingRound, validBidValues, onBid }: BidPanelProps) {
  const [selectedSuit,  setSelectedSuit]  = useState<Suit | null>(null);
  const [selectedValue, setSelectedValue] = useState<BidValue | null>(null);

  const canCoinche =
    biddingRound.highestBid !== null &&
    !biddingRound.coinched &&
    !biddingRound.surcoinched;

  const canBid = selectedSuit !== null && selectedValue !== null;

  function handleBid() {
    if (!canBid) return;
    onBid('suit', selectedValue!, selectedSuit!);
    setSelectedSuit(null);
    setSelectedValue(null);
  }

  return (
    <div className={styles.panel} data-testid="bid-panel">

      {/* ── Row 1: suit selectors ── */}
      <div className={styles.suitRow}>
        {SUITS.map((s) => (
          <button
            key={s}
            className={`${styles.btn} ${styles.suitBtn} ${RED_SUITS.includes(s) ? styles.redSuit : ''} ${selectedSuit === s ? styles.suitSelected : ''}`}
            onClick={() => setSelectedSuit((prev) => (prev === s ? null : s))}
            aria-pressed={selectedSuit === s}
          >
            {SUIT_SYMBOLS[s]}
          </button>
        ))}
      </div>

      <div className={styles.sep} aria-hidden="true" />

      {/* ── Row 2: value grid 3 × N ── */}
      <div className={styles.valueGrid}>
        {validBidValues.map((v) => (
          <button
            key={v}
            className={`${styles.btn} ${styles.valueBtn} ${selectedValue === v ? styles.valueSelected : ''}`}
            onClick={() => setSelectedValue((prev) => (prev === v ? null : v))}
            aria-pressed={selectedValue === v}
          >
            {String(v)}
          </button>
        ))}
      </div>

      <div className={styles.sep} aria-hidden="true" />

      {/* ── Row 3: actions ── */}
      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.passBtn}`}
          onClick={() => onBid('pass')}
        >
          Pass
        </button>

        <button
          className={`${styles.btn} ${styles.bidBtn}`}
          disabled={!canBid}
          onClick={handleBid}
        >
          {canBid ? `${SUIT_SYMBOLS[selectedSuit!]} ${String(selectedValue!)}` : 'Bid'}
        </button>

        {canCoinche && (
          <button
            className={`${styles.btn} ${styles.coincheBtn} ${styles.fullWidth}`}
            onClick={() => onBid('coinche')}
          >
            Coinche
          </button>
        )}
      </div>

    </div>
  );
}
