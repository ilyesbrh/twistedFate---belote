import type { ReactElement } from "react";
import type { Identity } from "@belote/protocol";
import { IdentityChip } from "../IdentityChip/IdentityChip.js";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import styles from "./GamePickerScreen.module.css";

interface GamePickerScreenProps {
  readonly onPickBelote: () => void;
  readonly onPickCoinche: () => void;
  readonly identity?: Identity | null;
  readonly onSignIn?: () => void;
  readonly onSignUp?: () => void;
  readonly onSignOut?: () => void;
}

export function GamePickerScreen({
  onPickBelote,
  onPickCoinche,
  identity,
  onSignIn,
  onSignUp,
  onSignOut,
}: GamePickerScreenProps): ReactElement {
  return (
    <MenuFelt className={styles.root}>
      <div className={styles.identity}>
        <IdentityChip
          identity={identity ?? null}
          onSignIn={onSignIn ?? (() => undefined)}
          onSignUp={onSignUp ?? (() => undefined)}
          onSignOut={onSignOut ?? (() => undefined)}
        />
      </div>

      <h1 className={styles.title}>Choose a Game</h1>

      <div className={styles.games} data-testid="game-picker-screen">
        <button
          className={styles.gameBtn}
          onClick={onPickBelote}
          data-testid="pick-belote"
          data-touch="primary"
        >
          <span className={styles.gameSuits} aria-hidden="true">
            ♠ ♥ ♦ ♣
          </span>
          <span className={styles.gameName}>Belote</span>
          <span className={styles.gameSubtitle}>Tunisian rules</span>
        </button>

        <button
          className={styles.gameBtn}
          onClick={onPickCoinche}
          data-testid="pick-coinche"
          data-touch="primary"
        >
          <span className={styles.gameSuits} aria-hidden="true">
            ♠ ♥ ♦ ♣
          </span>
          <span className={styles.gameName}>Coinche</span>
          <span className={styles.gameSubtitle}>SA · TA · Coinché</span>
        </button>
      </div>
    </MenuFelt>
  );
}
