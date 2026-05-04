import type { ReactElement } from "react";
import styles from "./ModeSelectScreen.module.css";

export type Mode = "ai" | "friends" | "random" | "ranked";

interface ModeSelectScreenProps {
  onSelect: (mode: Mode) => void;
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
    label: "Play vs AI",
    subtitle: "Solo — 3 bots",
    ariaLabel: "Play vs AI",
    disabled: false,
    icon: <CpuIcon />,
  },
  {
    id: "friends",
    label: "Play with Friends",
    subtitle: "Room code",
    ariaLabel: "Play with Friends",
    disabled: false,
    icon: <FriendsIcon />,
  },
  {
    id: "random",
    label: "Random",
    subtitle: "Auto-match 4 players",
    ariaLabel: "Random matchmaking",
    disabled: false,
    icon: <ShuffleIcon />,
  },
  {
    id: "ranked",
    label: "Ranked",
    subtitle: "Climb the leaderboard",
    ariaLabel: "Ranked play",
    disabled: true,
    icon: <TrophyIcon />,
  },
];

export function ModeSelectScreen({ onSelect }: ModeSelectScreenProps): ReactElement {
  return (
    <div className={styles.root} data-testid="mode-select-screen">
      <SuitWatermarks />
      <HeroFan />
      <h1 className={styles.title}>Belote</h1>
      <p className={styles.subtitle}>Coinchée</p>
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
            <span className={styles.iconSlot} data-testid={`mode-icon-${m.id}`} aria-hidden="true">
              {m.icon}
            </span>
            <span className={styles.btnLabel}>{m.label}</span>
            <span className={styles.btnSubtitle}>{m.subtitle}</span>
            {m.disabled && (
              <span className={styles.comingPill} data-testid={`mode-pill-${m.id}`}>
                Coming soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Hero strip — fan of four suit cards ─────────────────────────────────────

function HeroFan(): ReactElement {
  // Four cards fanned out, one per suit. Each rotates into place from the
  // centre on mount when prefers-reduced-motion is no-preference.
  const cards: { suit: "♠" | "♥" | "♦" | "♣"; red: boolean; rot: number }[] = [
    { suit: "♣", red: false, rot: -18 },
    { suit: "♦", red: true, rot: -6 },
    { suit: "♥", red: true, rot: 6 },
    { suit: "♠", red: false, rot: 18 },
  ];
  return (
    <div className={styles.hero} data-testid="menu-hero" aria-hidden="true">
      {cards.map((c, i) => (
        <span
          key={c.suit}
          className={`${styles.heroCard} ${c.red ? styles.heroCardRed : styles.heroCardBlack}`}
          style={{
            transform: `rotate(${String(c.rot)}deg)`,
            animationDelay: `${String(i * 70)}ms`,
          }}
        >
          {c.suit}
        </span>
      ))}
    </div>
  );
}

// ── Decorative suit watermarks anchored to corners ──────────────────────────

function SuitWatermarks(): ReactElement {
  return (
    <div className={styles.watermarks} aria-hidden="true">
      <span className={`${styles.watermark} ${styles.watermarkTL}`}>♠</span>
      <span className={`${styles.watermark} ${styles.watermarkTR}`}>♥</span>
      <span className={`${styles.watermark} ${styles.watermarkBL}`}>♦</span>
      <span className={`${styles.watermark} ${styles.watermarkBR}`}>♣</span>
    </div>
  );
}

// ── Mode icons ──────────────────────────────────────────────────────────────
// Hand-rolled inline SVG so the menu doesn't pull in an icon library or extra
// asset requests. Each glyph is a 32×32 viewBox sized via CSS.

function CpuIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="14" height="14" rx="2" />
      <rect x="13" y="13" width="6" height="6" rx="1" />
      <line x1="12" y1="5" x2="12" y2="9" />
      <line x1="20" y1="5" x2="20" y2="9" />
      <line x1="12" y1="23" x2="12" y2="27" />
      <line x1="20" y1="23" x2="20" y2="27" />
      <line x1="5" y1="12" x2="9" y2="12" />
      <line x1="5" y1="20" x2="9" y2="20" />
      <line x1="23" y1="12" x2="27" y2="12" />
      <line x1="23" y1="20" x2="27" y2="20" />
    </svg>
  );
}

function FriendsIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="4" />
      <circle cx="22" cy="13" r="3" />
      <path d="M4 26c0-4 3-7 7-7s7 3 7 7" />
      <path d="M19 26c0-3 2-6 5-6s4 3 4 6" />
    </svg>
  );
}

function ShuffleIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h5l16 16h5" />
      <path d="M3 24h5l4-4" />
      <path d="M20 12l4-4h5" />
      <polyline points="25 4 29 8 25 12" />
      <polyline points="25 20 29 24 25 28" />
    </svg>
  );
}

function TrophyIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5h14v6a7 7 0 0 1-14 0z" />
      <path d="M9 7H5v3a4 4 0 0 0 4 4" />
      <path d="M23 7h4v3a4 4 0 0 1-4 4" />
      <line x1="13" y1="20" x2="13" y2="24" />
      <line x1="19" y1="20" x2="19" y2="24" />
      <rect x="10" y="24" width="12" height="3" rx="0.5" />
    </svg>
  );
}
