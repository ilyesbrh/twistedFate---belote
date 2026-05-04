import { useEffect, useRef } from "react";
import type { GameMessage } from "../../messages/gameMessages.js";
import styles from "./ChatPanel.module.css";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: GameMessage[];
}

export function ChatPanel({ isOpen, onClose, messages = [] }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        data-testid="chat-panel"
        aria-label="Chat"
        role="dialog"
      >
        <div className={styles.header}>
          <span className={styles.title}>Chat</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close chat"
            data-touch="primary"
          >
            ✕
          </button>
        </div>

        <div className={styles.messages}>
          {messages.length === 0 ? (
            <p className={styles.empty}>No messages yet.</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`${styles.messageItem} ${styles[msg.type]}`}
                data-testid={`chat-message-${String(i)}`}
              >
                {msg.playerName !== "" && (
                  <span className={styles.messageName}>{msg.playerName}</span>
                )}
                <span className={styles.messageText}>{msg.text}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input row — implemented in iteration 46 (emoji quick-send) */}
      </div>
    </>
  );
}
