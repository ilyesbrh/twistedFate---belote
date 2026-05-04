import { useState } from "react";
import type { ReactElement } from "react";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import styles from "./OnlineRandomScreen.module.css";

export type RandomPhase = "idle" | "queued";

interface OnlineRandomScreenProps {
  readonly phase: RandomPhase;
  readonly position: number | null;
  readonly size: number;
  readonly status: "connecting" | "open" | "closed" | "error";
  readonly error: string | null;
  readonly onFind: (nickname: string) => void;
  readonly onCancel: () => void;
  readonly onBack: () => void;
}

const TARGET_SIZE = 4;

export function OnlineRandomScreen(props: OnlineRandomScreenProps): ReactElement {
  const { phase, size, status, error, onFind, onCancel, onBack } = props;
  const [nickname, setNickname] = useState("");

  const trimmed = nickname.trim();
  const findDisabled = trimmed.length === 0 || status !== "open";

  return (
    <MenuFelt className={styles.root}>
      <div data-testid="online-random-screen" className={styles.contentColumn}>
        <button
          className={styles.back}
          onClick={onBack}
          aria-label="Back to menu"
          data-testid="random-back-btn"
        >
          ← Back
        </button>
        <h2 className={styles.title}>Random match</h2>
        <p className={styles.status}>{status === "open" ? "Connected" : `Status: ${status}`}</p>
        {error && (
          <p className={styles.error} data-testid="random-error">
            {error}
          </p>
        )}

        {phase === "idle" ? (
          <div className={styles.form}>
            <input
              className={styles.input}
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              aria-label="Nickname"
              data-testid="random-nickname-input"
            />
            <button
              className={styles.primaryBtn}
              disabled={findDisabled}
              onClick={() => {
                onFind(trimmed);
              }}
              aria-label="Find a random game"
              data-touch="primary"
              data-testid="random-find-btn"
            >
              Find a game
            </button>
          </div>
        ) : (
          <div className={styles.queued}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.searching}>Searching for players…</p>
            <div className={styles.progressCard} data-testid="random-progress-card">
              <p
                className={styles.progress}
                role="status"
                aria-live="polite"
                data-testid="random-progress"
              >
                {String(size)}/{String(TARGET_SIZE)}
              </p>
              <span className={styles.progressLabel}>players</span>
            </div>
            <button
              className={styles.secondaryBtn}
              onClick={onCancel}
              aria-label="Cancel matchmaking"
              data-touch="primary"
              data-testid="random-cancel-btn"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </MenuFelt>
  );
}
