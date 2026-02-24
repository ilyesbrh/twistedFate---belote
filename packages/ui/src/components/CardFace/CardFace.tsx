import type { CSSProperties } from 'react';
import type { Suit } from '../../data/mockGame.js';
import styles from './CardFace.module.css';

interface CardFaceProps {
  suit: Suit;
  rank: string;
  isSelected?: boolean;
  width?: number;
  height?: number;
  style?: CSSProperties;
}

function getImageFilename(suit: Suit, rank: string): string {
  const rankMap: Record<string, string> = {
    ace: 'ace',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    jack: 'jack',
    queen: 'queen',
    king: 'king',
  };
  const r = rankMap[rank] ?? rank;
  return `${import.meta.env.BASE_URL}cards/${r}_of_${suit}.png`;
}

export function CardFace({ suit, rank, isSelected, width, height, style }: CardFaceProps) {
  const src = getImageFilename(suit, rank);
  const cssVars = {
    '--cw': width ? `${width}px` : undefined,
    '--ch': height ? `${height}px` : undefined,
  } as CSSProperties;

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      style={{ ...cssVars, ...style }}
      data-testid={`card-face-${rank}-${suit}`}
    >
      <img src={src} alt={`${rank} of ${suit}`} draggable={false} />
    </div>
  );
}
