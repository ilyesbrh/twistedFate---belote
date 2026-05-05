import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type { Identity } from "@belote/protocol";
import styles from "./IdentityChip.module.css";

export interface IdentityChipProps {
  readonly identity: Identity | null;
  readonly onSignIn: () => void;
  readonly onSignUp: () => void;
  readonly onSignOut: () => void;
  /** Optional — if provided, shows a "View history" item for users. */
  readonly onViewHistory?: () => void;
  /** Optional — if provided, shows a "Friends" item for users. */
  readonly onViewFriends?: () => void;
  /** Optional — if provided, shows a "Profile" item for users. */
  readonly onViewProfile?: () => void;
}

interface ActionDescriptor {
  readonly id: string;
  readonly testId: string;
  readonly label: string;
  readonly icon: string;
  readonly onClick: () => void;
}

/**
 * Iteration 025 redesign — handwritten signature + fanned action cards.
 *
 * The signature (Caveat font, terracotta squiggly underline) sits in the
 * bottom-left corner of the menu. Tap → a small hand of action cards
 * fans up from behind the signature. Each card is a single action,
 * tilted and staggered like a real belote hand.
 *
 * Renders nothing while `identity === null` (auth preflight in flight).
 */
export function IdentityChip(props: IdentityChipProps): ReactElement | null {
  const { identity, onSignIn, onSignUp, onSignOut, onViewHistory, onViewFriends, onViewProfile } =
    props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const close = (): void => {
    setOpen(false);
  };

  // Outside-click closes the fan.
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

  const actions = useMemo<readonly ActionDescriptor[]>(() => {
    if (!identity) return [];
    if (identity.kind === "guest") {
      return [
        {
          id: "signin",
          testId: "identity-action-signin",
          label: "Sign in",
          icon: "↩",
          onClick: onSignIn,
        },
        {
          id: "signup",
          testId: "identity-action-signup",
          label: "Create account",
          icon: "✎",
          onClick: onSignUp,
        },
      ];
    }
    const out: ActionDescriptor[] = [];
    if (onViewProfile) {
      out.push({
        id: "profile",
        testId: "identity-action-profile",
        label: "Profile",
        icon: "♣",
        onClick: onViewProfile,
      });
    }
    if (onViewFriends) {
      out.push({
        id: "friends",
        testId: "identity-action-friends",
        label: "Friends",
        icon: "♥",
        onClick: onViewFriends,
      });
    }
    if (onViewHistory) {
      out.push({
        id: "history",
        testId: "identity-action-history",
        label: "View history",
        icon: "♦",
        onClick: onViewHistory,
      });
    }
    out.push({
      id: "signout",
      testId: "identity-action-signout",
      label: "Sign out",
      icon: "↳",
      onClick: onSignOut,
    });
    return out;
  }, [identity, onSignIn, onSignUp, onSignOut, onViewProfile, onViewFriends, onViewHistory]);

  if (!identity) return null;

  return (
    <div ref={rootRef} className={styles.root}>
      {open && (
        <div className={styles.fan} role="menu">
          {actions.map((a, i) => {
            const layout = layoutFor(i, actions.length);
            return (
              <button
                key={a.id}
                type="button"
                role="menuitem"
                data-testid={a.testId}
                className={styles.actionCard}
                style={
                  {
                    "--rot": `${String(layout.rot)}deg`,
                    "--tx": `${String(layout.tx)}px`,
                    "--delay": `${String(i * 50)}ms`,
                  } as React.CSSProperties
                }
                onClick={() => {
                  close();
                  a.onClick();
                }}
              >
                <span className={styles.actionIcon} aria-hidden="true">
                  {a.icon}
                </span>
                <span className={styles.actionLabel}>{a.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        data-testid="identity-chip"
        data-kind={identity.kind}
        className={styles.signature}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <span className={styles.kindTag} aria-hidden="true">
          {identity.kind === "user" ? "Playing as" : "Guest"}
        </span>
        <span className={styles.signatureText} data-testid="identity-chip-label">
          {identity.nickname}
        </span>
        <svg
          className={styles.underline}
          viewBox="0 0 200 14"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M2 8 Q 30 2, 60 8 T 120 8 T 198 6" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Compute rotation + horizontal offset for the i-th card in a fan of `total` cards.
 * Cards spread over ±18° with a horizontal sweep so they overlap like a real hand.
 */
function layoutFor(i: number, total: number): { rot: number; tx: number } {
  if (total <= 1) return { rot: 0, tx: 0 };
  const center = (total - 1) / 2;
  const norm = (i - center) / center; // -1 … +1
  const rot = norm * 18;
  // Horizontal spread: each card shifts right by ~28% of its own width per step.
  const tx = norm * 60;
  return { rot, tx };
}
