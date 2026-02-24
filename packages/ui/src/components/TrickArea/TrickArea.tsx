import type { CSSProperties } from 'react';
import type { TrickCardData, Position } from '../../data/mockGame.js';
import { CardFace } from '../CardFace/CardFace.js';
import styles from './TrickArea.module.css';

interface TrickAreaProps {
  cards: TrickCardData[];
  /** Set when a trick just completed — animates cards toward winner's side */
  winnerPosition?: Position | null;
}

const FLY_IN_CLASS: Record<Position, string> = {
  south: styles.fromSouth,
  north: styles.fromNorth,
  west:  styles.fromWest,
  east:  styles.fromEast,
};

const SWEEP_CLASS: Record<Position, string> = {
  south: styles.sweepSouth,
  north: styles.sweepNorth,
  west:  styles.sweepWest,
  east:  styles.sweepEast,
};

export function TrickArea({ cards, winnerPosition }: TrickAreaProps) {
  const sweepClass = winnerPosition ? SWEEP_CLASS[winnerPosition] : '';

  return (
    <div className={`${styles.area} ${sweepClass}`} data-testid="trick-area">
      {cards.map((card, i) => {
        const style: CSSProperties = {
          transform: `translate(calc(-50% + ${card.offsetX}px), calc(-50% + ${card.offsetY}px)) rotate(${card.rotation}deg)`,
          zIndex: i,
        };
        return (
          <div
            key={`trick-${card.position}-${card.rank}-${card.suit}`}
            className={`${styles.cardSlot} ${FLY_IN_CLASS[card.position]}`}
            style={style}
          >
            <CardFace suit={card.suit} rank={card.rank} />
          </div>
        );
      })}
    </div>
  );
}
