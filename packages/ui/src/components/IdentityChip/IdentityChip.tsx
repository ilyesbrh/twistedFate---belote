import { useEffect, useRef, useState, type ReactElement } from "react";
import type { Identity } from "@belote/protocol";
import styles from "./IdentityChip.module.css";

export interface IdentityChipProps {
  readonly identity: Identity | null;
  readonly onSignIn: () => void;
  readonly onSignUp: () => void;
  readonly onSignOut: () => void;
}

/**
 * Small pill in the menu's top-right showing the current identity.
 * Click to open a dropdown of auth actions. Renders nothing while
 * the parent's auth preflight is in flight (`identity === null`).
 */
export function IdentityChip(props: IdentityChipProps): ReactElement | null {
  const { identity, onSignIn, onSignUp, onSignOut } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close the menu when clicking outside.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent): void => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (!identity) return null;

  const close = (): void => {
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        data-testid="identity-chip"
        data-kind={identity.kind}
        className={styles.chip}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.label} data-testid="identity-chip-label">
          {identity.nickname}
        </span>
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {identity.kind === "guest" ? (
            <>
              <button
                type="button"
                role="menuitem"
                data-testid="identity-action-signin"
                className={styles.menuItem}
                onClick={() => {
                  close();
                  onSignIn();
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="identity-action-signup"
                className={styles.menuItem}
                onClick={() => {
                  close();
                  onSignUp();
                }}
              >
                Create account
              </button>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              data-testid="identity-action-signout"
              className={styles.menuItem}
              onClick={() => {
                close();
                onSignOut();
              }}
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
