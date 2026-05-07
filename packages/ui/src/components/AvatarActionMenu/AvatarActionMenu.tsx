import { useEffect, useRef, useState } from "react";
import styles from "./AvatarActionMenu.module.css";

interface AvatarActionMenuProps {
  /** Open the chat panel. */
  onChatOpen: () => void;
  /** Unread chat badge count. */
  unreadCount?: number;
}

/**
 * Compact FAB-style menu anchored to the south avatar's top-right corner.
 *
 * Replaces the previous always-visible chat button (which overlapped the
 * contract-holder stamp). A 3-dot trigger collapses to the avatar; tapping
 * it fans out the action buttons (chat for now, settings/exit slot in
 * later) along a quarter-arc above-right of the avatar.
 */
export function AvatarActionMenu({ onChatOpen, unreadCount = 0 }: AvatarActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside tap. Touchstart + mousedown so it works on both.
  useEffect(() => {
    if (!open) return;
    const onAway = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onAway);
    document.addEventListener("touchstart", onAway, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onAway);
      document.removeEventListener("touchstart", onAway);
    };
  }, [open]);

  const handleChat = () => {
    setOpen(false);
    onChatOpen();
  };

  return (
    <div ref={rootRef} className={`${styles.root} ${open ? styles.open : ""}`}>
      {/* Action: chat. Hidden behind the trigger when collapsed; fans out
          to the upper-right quadrant when expanded. */}
      <button
        className={`${styles.action} ${styles.chatAction}`}
        onClick={handleChat}
        aria-label="Open chat"
        data-testid="chat-button"
        tabIndex={open ? 0 : -1}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Trigger: 3-dot collapsed, ✕ when open. Always visible. */}
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open actions"}
        aria-expanded={open}
        data-testid="avatar-action-trigger"
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          {open ? "×" : "⋯"}
        </span>
        {!open && unreadCount > 0 && (
          <span className={styles.badge} aria-label={`${unreadCount} unread`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
