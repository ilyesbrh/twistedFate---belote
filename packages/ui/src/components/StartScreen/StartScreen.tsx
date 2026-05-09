import type { ReactElement } from "react";
import styles from "./StartScreen.module.css";

interface StartScreenProps {
  players: unknown[];
  targetScore: number;
  onPlay: () => void;
  onBack?: () => void;
  gameName?: string;
  gameSubtitle?: string;
}

export function StartScreen({
  targetScore,
  onPlay,
  onBack,
  gameName = "Belote",
  gameSubtitle = "— Coinchée —",
}: StartScreenProps): ReactElement {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <HeroFan />
        <h2 className={styles.title}>{gameName}</h2>
        <p className={styles.subtitle}>{gameSubtitle}</p>
        <p className={styles.target}>
          first to <strong>{String(targetScore)}</strong> points wins
        </p>
        <button
          className={styles.playBtn}
          onClick={onPlay}
          aria-label="Play game"
          data-touch="primary"
        >
          Play game
        </button>
        {onBack !== undefined && (
          <button
            className={styles.backBtn}
            onClick={onBack}
            aria-label="Back"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

// ── Hero strip: small fan of four suit cards (matches the menu) ────────────

function HeroFan(): ReactElement {
  const cards: { suit: SuitGlyph; rot: number; tone: "red" | "black" }[] = [
    { suit: "club", rot: -16, tone: "black" },
    { suit: "diamond", rot: -5, tone: "red" },
    { suit: "heart", rot: 5, tone: "red" },
    { suit: "spade", rot: 16, tone: "black" },
  ];
  return (
    <div className={styles.hero} aria-hidden="true">
      {cards.map((c) => (
        <span
          key={c.suit}
          className={`${styles.heroCard} ${c.tone === "red" ? styles.heroCardRed : styles.heroCardBlack}`}
          style={{ transform: `rotate(${String(c.rot)}deg)` }}
        >
          <SuitPip glyph={c.suit} />
        </span>
      ))}
    </div>
  );
}

type SuitGlyph = "spade" | "heart" | "diamond" | "club";

function SuitPip({ glyph }: { glyph: SuitGlyph }): ReactElement {
  switch (glyph) {
    case "spade":
      return (
        <svg viewBox="0 0 32 32" fill="currentColor" stroke="none">
          <path d="M16 3 C 11 9 5 13 5 19 c 0 4 3 7 7 7 c 1.6 0 2.7 -0.6 3.4 -1.6 c -0.4 1.5 -1 2.9 -2 4.1 c -0.5 0.6 -0.1 1.5 0.7 1.5 h 5.8 c 0.8 0 1.2 -0.9 0.7 -1.5 c -1 -1.2 -1.6 -2.6 -2 -4.1 c 0.7 1 1.8 1.6 3.4 1.6 c 4 0 7 -3 7 -7 c 0 -6 -6 -10 -11 -16 z" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 32 32" fill="currentColor" stroke="none">
          <path d="M16 28 C 6 21 3 14 3 10 C 3 6 6 3 10 3 c 2.4 0 4.6 1.4 6 3.6 C 17.4 4.4 19.6 3 22 3 c 4 0 7 3 7 7 c 0 4 -3 11 -13 18 z" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 32 32" fill="currentColor" stroke="none">
          <path d="M16 2 C 14 8 10 12 4 16 C 10 20 14 24 16 30 C 18 24 22 20 28 16 C 22 12 18 8 16 2 z" />
        </svg>
      );
    case "club":
      return (
        <svg viewBox="0 0 32 32" fill="currentColor" stroke="none">
          <circle cx="16" cy="9" r="5" />
          <circle cx="9" cy="18" r="5" />
          <circle cx="23" cy="18" r="5" />
          <path d="M14 19 c 0 5 -1 7 -3 9 c -0.6 0.6 -0.1 1.5 0.7 1.5 h 8.6 c 0.8 0 1.3 -0.9 0.7 -1.5 c -2 -2 -3 -4 -3 -9 z" />
        </svg>
      );
  }
}
