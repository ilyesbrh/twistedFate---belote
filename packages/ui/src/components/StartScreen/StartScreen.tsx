import type { ReactElement } from 'react';
import type { PlayerData } from '../../data/mockGame.js';
import styles from './StartScreen.module.css';

const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;

interface StartScreenProps {
  players: PlayerData[];
  targetScore: number;
  onPlay: () => void;
}

export function StartScreen({ players, targetScore, onPlay }: StartScreenProps): ReactElement {
  const north = players.find((p) => p.position === 'north')!;
  const south = players.find((p) => p.position === 'south')!;
  const west  = players.find((p) => p.position === 'west')!;
  const east  = players.find((p) => p.position === 'east')!;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>

        {/* ── Title ── */}
        <div className={styles.title}>
          {SUIT_SYMBOLS.map((s, i) => (
            <span
              key={s}
              className={i === 1 || i === 2 ? styles.suitRed : styles.suitBlack}
              aria-hidden="true"
            >
              {s}
            </span>
          ))}
          <span className={styles.titleText}>BELOTE</span>
        </div>

        {/* ── Players grid ── */}
        <div className={styles.playersGrid}>

          {/* North (NS team) */}
          <div className={styles.northSlot}>
            <PlayerSlot player={north} team="NS" />
          </div>

          {/* Middle row: West vs East */}
          <div className={styles.midRow}>
            <PlayerSlot player={west} team="EW" />
            <div className={styles.vsText} aria-hidden="true">VS</div>
            <PlayerSlot player={east} team="EW" />
          </div>

          {/* South (NS team, the human) */}
          <div className={styles.southSlot}>
            <PlayerSlot player={south} team="NS" isYou />
          </div>

        </div>

        {/* ── Target score ── */}
        <p className={styles.target}>
          First to <strong>{String(targetScore)}</strong> points wins
        </p>

        {/* ── Play button ── */}
        <button className={styles.playBtn} onClick={onPlay}>
          PLAY GAME
        </button>

      </div>
    </div>
  );
}

// ── PlayerSlot ───────────────────────────────────────────────────────────────

interface PlayerSlotProps {
  player: PlayerData;
  team: 'NS' | 'EW';
  isYou?: boolean;
}

function PlayerSlot({ player, team, isYou = false }: PlayerSlotProps): ReactElement {
  return (
    <div className={styles.playerSlot}>
      <img
        src={player.avatarUrl}
        alt={player.name}
        className={styles.avatar}
        draggable={false}
      />
      <div className={styles.playerName}>
        {player.name}
        {isYou && <span className={styles.youLabel}> (You)</span>}
      </div>
      <div className={styles.playerMeta}>
        <span className={`${styles.teamBadge} ${team === 'NS' ? styles.teamNS : styles.teamEW}`}>
          {team}
        </span>
        <span className={styles.levelText}>Lv.{String(player.level)}</span>
        {player.isVip && <span className={styles.vipBadge}>VIP</span>}
      </div>
    </div>
  );
}
