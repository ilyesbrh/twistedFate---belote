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
  disabled: boolean;
}

const MODES: ModeButton[] = [
  { id: "ai", label: "Play vs AI", subtitle: "Solo — 3 bots", disabled: false },
  { id: "friends", label: "Play with Friends", subtitle: "Room code", disabled: false },
  { id: "random", label: "Random", subtitle: "Coming soon", disabled: true },
  { id: "ranked", label: "Ranked", subtitle: "Coming soon", disabled: true },
];

export function ModeSelectScreen({ onSelect }: ModeSelectScreenProps): ReactElement {
  return (
    <div className={styles.root} data-testid="mode-select-screen">
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
            data-testid={`mode-btn-${m.id}`}
          >
            <span className={styles.btnLabel}>{m.label}</span>
            <span className={styles.btnSubtitle}>{m.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
