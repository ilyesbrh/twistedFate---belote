import type { ReactElement } from "react";
import styles from "./StartScreen.module.css";

interface StartScreenProps {
  players: unknown[];
  targetScore: number;
  onPlay: () => void;
}

export function StartScreen({ targetScore, onPlay }: StartScreenProps): ReactElement {
  const heroSrc = `${import.meta.env.BASE_URL}belote-hero.svg`;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {/* ── Hero image ── */}
        <img
          src={heroSrc}
          alt="Belote card game"
          className={styles.heroImage}
          draggable={false}
        />

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
