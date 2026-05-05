import type { ReactElement } from "react";
import type { Identity } from "@belote/protocol";
import { IdentityChip } from "../IdentityChip/IdentityChip.js";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import styles from "./ModeSelectScreen.module.css";

export type Mode = "ai" | "friends" | "random" | "ranked";

interface ModeSelectScreenProps {
  onSelect: (mode: Mode) => void;
  /** Optional auth-aware chrome. When omitted, the identity chip is not rendered. */
  identity?: Identity | null;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
  onViewHistory?: () => void;
  onViewFriends?: () => void;
  onViewProfile?: () => void;
}

interface ModeButton {
  id: Mode;
  label: string;
  subtitle: string;
  ariaLabel: string;
  disabled: boolean;
  icon: ReactElement;
}

const MODES: ModeButton[] = [
  {
    id: "ai",
    label: "Solo Match",
    subtitle: "vs three bots",
    ariaLabel: "Play vs AI",
    disabled: false,
    icon: <BotIcon />,
  },
  {
    id: "friends",
    label: "With Friends",
    subtitle: "share a room code",
    ariaLabel: "Play with Friends",
    disabled: false,
    icon: <FriendsIcon />,
  },
  {
    id: "random",
    label: "Random",
    subtitle: "match four strangers",
    ariaLabel: "Random matchmaking",
    disabled: false,
    icon: <ShuffleIcon />,
  },
  {
    id: "ranked",
    label: "Ranked",
    subtitle: "climb the leaderboard",
    ariaLabel: "Ranked play",
    disabled: true,
    icon: <TrophyIcon />,
  },
];

export function ModeSelectScreen({
  onSelect,
  identity,
  onSignIn,
  onSignUp,
  onSignOut,
  onViewHistory,
  onViewFriends,
  onViewProfile,
}: ModeSelectScreenProps): ReactElement {
  const showChip = identity !== undefined && onSignIn && onSignUp && onSignOut;
  return (
    <>
      {showChip && (
        <div className={styles.identityChipSlot}>
          <IdentityChip
            identity={identity ?? null}
            onSignIn={onSignIn}
            onSignUp={onSignUp}
            onSignOut={onSignOut}
            onViewHistory={onViewHistory}
            onViewFriends={onViewFriends}
            onViewProfile={onViewProfile}
          />
        </div>
      )}
    <MenuFelt className={styles.root}>
      <div data-testid="mode-select-screen" className={styles.contentColumn}>
        <HeroIllustration />
        <h1 className={styles.title}>Belote</h1>
        <p className={styles.subtitle}>— Coinchée —</p>
        <div className={styles.grid}>
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`${styles.btn} ${m.disabled ? styles.btnDisabled : ""}`}
              onClick={() => {
                if (!m.disabled) onSelect(m.id);
              }}
              disabled={m.disabled}
              aria-label={m.ariaLabel}
              data-touch="primary"
              data-testid={`mode-btn-${m.id}`}
            >
              <span
                className={styles.iconSlot}
                data-testid={`mode-icon-${m.id}`}
                aria-hidden="true"
              >
                {m.icon}
              </span>
              <span className={styles.btnLabel}>{m.label}</span>
              <span className={styles.btnSubtitle}>{m.subtitle}</span>
              {m.disabled && (
                <span className={styles.comingPill} data-testid={`mode-pill-${m.id}`}>
                  soon
                </span>
              )}
              {/* Decorative corner pip — hand-drawn ornament. */}
              <span className={styles.cornerPip} aria-hidden="true">
                <CornerOrnament />
              </span>
            </button>
          ))}
        </div>
      </div>
    </MenuFelt>
    </>
  );
}

// ── Hero: bigger hand-drawn fan of cards ─────────────────────────────────────

function HeroIllustration(): ReactElement {
  // Five-card fan with pip-illustrated faces. Each card has a slight
  // hand-stamped imperfection. Rotates into place on mount when reduced
  // motion is no-preference.
  const cards: { suit: SuitGlyph; rot: number; tx: number; tone: "red" | "black" }[] = [
    { suit: "club", rot: -22, tx: -2, tone: "black" },
    { suit: "diamond", rot: -10, tx: 0, tone: "red" },
    { suit: "heart", rot: 0, tx: 0, tone: "red" },
    { suit: "spade", rot: 10, tx: 0, tone: "black" },
    { suit: "club", rot: 22, tx: 2, tone: "black" },
  ];
  return (
    <div className={styles.hero} data-testid="menu-hero" aria-hidden="true">
      {cards.map((c, i) => (
        <span
          key={`${c.suit}-${String(i)}`}
          className={`${styles.heroCard} ${c.tone === "red" ? styles.heroCardRed : styles.heroCardBlack}`}
          style={{
            transform: `rotate(${String(c.rot)}deg) translateX(${String(c.tx)}px)`,
            animationDelay: `${String(i * 80)}ms`,
            zIndex: i === 2 ? 6 : 5 - Math.abs(i - 2),
          }}
        >
          <span className={styles.heroPip}>
            <SuitPip glyph={c.suit} />
          </span>
        </span>
      ))}
    </div>
  );
}

// ── Suit pip (hand-drawn ink shape) ─────────────────────────────────────────

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

// ── Corner ornament: small hand-drawn flourish ──────────────────────────────

function CornerOrnament(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12 c 4 0 6 -2 6 -6" />
      <path d="M2 12 c 4 0 6 2 6 6" />
      <circle cx="2" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

// ── Mode icons — hand-drawn / sketchy strokes ───────────────────────────────

function BotIcon(): ReactElement {
  // A friendly bot head with antenna — board-game-companion vibe.
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 6 v 5" />
      <circle cx="24" cy="5" r="1.6" fill="currentColor" />
      <rect x="9" y="13" width="30" height="22" rx="4" />
      <circle cx="18" cy="24" r="2.2" fill="currentColor" />
      <circle cx="30" cy="24" r="2.2" fill="currentColor" />
      <path d="M18 30 q 6 4 12 0" />
      <path d="M9 22 h -3" />
      <path d="M9 28 h -3" />
      <path d="M39 22 h 3" />
      <path d="M39 28 h 3" />
      <path d="M16 35 v 5" />
      <path d="M32 35 v 5" />
    </svg>
  );
}

function FriendsIcon(): ReactElement {
  // Two figures, hand-drawn; deliberately uneven heights.
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="17" cy="16" r="5" />
      <path d="M7 38 c 0 -6 4 -10 10 -10 s 10 4 10 10" />
      <circle cx="33" cy="19" r="4" />
      <path d="M27 39 c 0 -5 3 -9 6 -9 s 7 3 7 8" />
    </svg>
  );
}

function ShuffleIcon(): ReactElement {
  // Two crossing card silhouettes — the act of shuffling.
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="14" width="18" height="24" rx="2" transform="rotate(-12 18 26)" />
      <rect x="21" y="10" width="18" height="24" rx="2" transform="rotate(10 30 22)" />
      <path d="M16 26 l 2 2 l 4 -4" />
    </svg>
  );
}

function TrophyIcon(): ReactElement {
  // Hand-drawn trophy — chunky, slightly imperfect.
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 8 h 20 v 9 a 10 10 0 0 1 -20 0 z" />
      <path d="M14 11 h -5 v 4 a 5 5 0 0 0 5 5" />
      <path d="M34 11 h 5 v 4 a 5 5 0 0 1 -5 5" />
      <path d="M19 28 v 6" />
      <path d="M29 28 v 6" />
      <rect x="15" y="34" width="18" height="4" rx="0.8" />
      <path d="M14 40 h 20" />
      <path d="M22 14 l 2 2 l 4 -4" />
    </svg>
  );
}
