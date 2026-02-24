import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { CardBack } from '../CardBack/CardBack.js';
import styles from './OpponentHand.module.css';

interface OpponentHandProps {
  cardCount: number;
  orientation: 'top' | 'left' | 'right';
  /** When true, cards animate in (deal animation). */
  isDealing?: boolean;
}

export function OpponentHand({ cardCount, orientation, isDealing = false }: OpponentHandProps) {
  const n = Math.min(cardCount, 10);
  // Fan span scales with card count: tight (few cards) → wide (full hand)
  const fanSpan = n > 1 ? Math.min(44, (n - 1) * 6.5) : 0;
  const [dealt, setDealt] = useState(!isDealing);

  useEffect(() => {
    if (isDealing) {
      setDealt(false);
      const id = requestAnimationFrame(() => { setDealt(true); });
      return () => { cancelAnimationFrame(id); };
    }
    return undefined;
  }, [isDealing]);

  if (orientation === 'top') {
    return (
      <div
        className={`${styles.topFan} ${dealt ? styles.dealt : ''}`}
        data-testid="opponent-hand-north"
      >
        {Array.from({ length: n }).map((_, i) => {
          const angle = n > 1 ? -fanSpan / 2 + (i / (n - 1)) * fanSpan : 0;
          const style: CSSProperties = {
            transform: `translateX(-50%) rotate(${angle}deg)`,
            '--card-i': String(i),
          } as CSSProperties;
          return (
            <div key={i} className={styles.topFanSlot} style={style}>
              <div className={styles.cardWrap}>
                <CardBack />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Left / Right: same arc fan as top, rotated ±90° via CSS ── */
  const isLeft = orientation === 'left';
  const fanCards = Math.min(n, 8);

  return (
    /* sideWrap has the POST-rotation dimensions so layout is correct */
    <div
      className={`${styles.sideWrap} ${isLeft ? styles.sideWrapLeft : styles.sideWrapRight}`}
      data-testid={`opponent-hand-${orientation}`}
    >
      {/* sideFan has the PRE-rotation dimensions and is rotated via CSS */}
      <div
        className={`${styles.sideFan} ${isLeft ? styles.sideFanLeft : styles.sideFanRight} ${dealt ? styles.dealt : ''}`}
      >
        {Array.from({ length: fanCards }).map((_, i) => {
          const sideFanSpan = fanCards > 1 ? Math.min(44, (fanCards - 1) * 6.5) : 0;
          const angle = fanCards > 1 ? -sideFanSpan / 2 + (i / (fanCards - 1)) * sideFanSpan : 0;
          const style: CSSProperties = {
            transform: `translateX(-50%) rotate(${angle}deg)`,
            '--card-i': String(i),
          } as CSSProperties;
          return (
            <div key={i} className={styles.sideFanSlot} style={style}>
              <div className={styles.cardWrap}>
                <CardBack />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
