import type { ReactElement, ReactNode } from "react";
import styles from "./MenuFelt.module.css";

interface MenuFeltProps {
  /** Optional extra class on the root, for screen-specific layout (gap,
   *  justify-content, padding overrides). */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Shared full-screen menu surface used by the mode-select, lobby, and
 * random-matchmaking screens. Provides the dark card-table felt
 * background (radial + diagonal weave) and four corner suit watermarks.
 *
 * The watermarks layer is decorative — `aria-hidden` so it does not
 * appear in the accessibility tree. All foreground content stacks above
 * it via `position: relative; z-index: 1`.
 */
export function MenuFelt({ className, children }: MenuFeltProps): ReactElement {
  return (
    <div className={`${styles.root} ${className ?? ""}`} data-testid="menu-felt">
      <div className={styles.watermarks} data-testid="menu-felt-watermarks" aria-hidden="true">
        <span className={`${styles.watermark} ${styles.watermarkTL}`}>♠</span>
        <span className={`${styles.watermark} ${styles.watermarkTR}`}>♥</span>
        <span className={`${styles.watermark} ${styles.watermarkBL}`}>♦</span>
        <span className={`${styles.watermark} ${styles.watermarkBR}`}>♣</span>
      </div>
      {children}
    </div>
  );
}
