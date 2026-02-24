import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CardData } from '../../data/mockGame.js';
import { CardFace } from '../CardFace/CardFace.js';
import styles from './HandDisplay.module.css';

interface HandDisplayProps {
  cards: CardData[];
  /** Indices (into cards[]) the human is allowed to play. Non-empty = restriction is active. */
  legalCardIndices?: ReadonlySet<number>;
  /** Called when human taps a card (passes the card index). */
  onPlayCard?: (index: number) => void;
  /** When true, cards animate in from below (deal animation). */
  isDealing?: boolean;
}

export function HandDisplay({ cards, legalCardIndices, onPlayCard, isDealing = false }: HandDisplayProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // 'dealt' class triggers the CSS transition animation
  const [dealt, setDealt] = useState(!isDealing);
  const n = cards.length;
  // Fan angle scales with card count: tight (few cards) → wide (full hand of 8)
  const maxAngle = n > 1 ? Math.min(22, (n - 1) * 3.5) : 0;

  // When isDealing becomes true: reset to pre-deal state, then animate in
  useEffect(() => {
    if (isDealing) {
      setDealt(false);
      const id = requestAnimationFrame(() => { setDealt(true); });
      return () => { cancelAnimationFrame(id); };
    }
    return undefined;
  }, [isDealing]);

  // Clear selection when hand size changes (new round dealt)
  useEffect(() => {
    setSelectedIndex(null);
  }, [n]);

  const hasRestriction = (legalCardIndices?.size ?? 0) > 0;

  function handleClick(i: number) {
    if (hasRestriction && !legalCardIndices!.has(i)) return; // illegal card — ignore tap
    setSelectedIndex((prev) => (prev === i ? null : i));
    onPlayCard?.(i);
  }

  return (
    <div
      className={`${styles.container} ${dealt ? styles.dealt : ''}`}
      data-testid="hand-display"
    >
      {cards.map((card, i) => {
        const angle = n > 1 ? -maxAngle + (i / (n - 1)) * maxAngle * 2 : 0;
        const isSelected = selectedIndex === i;
        const isIllegal  = hasRestriction && !legalCardIndices!.has(i);

        const slotStyle: CSSProperties = {
          transform: `translateX(-50%) rotate(${angle}deg)`,
          zIndex: i,
          '--card-i': String(i), // used by CSS for stagger delay
        } as CSSProperties;

        return (
          <div
            key={`${card.rank}-${card.suit}`}
            className={`${styles.fanSlot} ${isSelected ? styles.selected : ''} ${isIllegal ? styles.illegal : ''}`}
            style={slotStyle}
            onClick={() => handleClick(i)}
            data-testid={`hand-card-${i}`}
          >
            <div className={styles.cardHover}>
              <CardFace
                suit={card.suit}
                rank={card.rank}
                isSelected={isSelected}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
