import { useState, type ReactElement } from "react";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import type { Friend, FriendRequest } from "../../online/api/friends.js";
import styles from "./FriendsScreen.module.css";

export interface FriendsScreenProps {
  readonly friends: readonly Friend[];
  readonly incoming: readonly FriendRequest[];
  readonly outgoing: readonly FriendRequest[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly mutating: boolean;
  readonly onSendRequest: (email: string) => void;
  readonly onAccept: (requestId: string) => void;
  readonly onReject: (requestId: string) => void;
  readonly onCancel: (requestId: string) => void;
  readonly onRemove: (userId: string) => void;
  readonly onBack: () => void;
}

export function FriendsScreen(props: FriendsScreenProps): ReactElement {
  const {
    friends,
    incoming,
    outgoing,
    loading,
    error,
    mutating,
    onSendRequest,
    onAccept,
    onReject,
    onCancel,
    onRemove,
    onBack,
  } = props;

  const [email, setEmail] = useState("");
  const empty = !loading && friends.length === 0 && incoming.length === 0 && outgoing.length === 0;

  return (
    <MenuFelt className={styles.root}>
      <div data-testid="friends-screen" className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Friends</h1>
          <button
            type="button"
            className={styles.backBtn}
            data-testid="friends-back"
            onClick={onBack}
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className={styles.error} data-testid="friends-error" role="alert">
            {error}
          </div>
        )}

        <form
          className={styles.addForm}
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = email.trim();
            if (!trimmed || mutating) return;
            onSendRequest(trimmed);
            setEmail("");
          }}
        >
          <input
            data-testid="add-friend-email"
            className={styles.addInput}
            type="email"
            placeholder="friend's email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            disabled={mutating}
          />
          <button
            type="submit"
            data-testid="add-friend-submit"
            className={`${styles.actionBtn} ${styles.actionPrimary}`}
            disabled={email.trim().length === 0 || mutating}
          >
            Add
          </button>
        </form>

        {loading && (
          <div className={styles.loading} data-testid="friends-loading">
            Loading…
          </div>
        )}

        {empty && (
          <div className={styles.empty} data-testid="friends-empty">
            No friends yet — add one by email.
          </div>
        )}

        {incoming.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Incoming requests</h2>
            {incoming.map((r) => (
              <div className={styles.row} key={r.id} data-testid={`incoming-row-${r.id}`}>
                <div className={styles.who}>
                  <span className={styles.nickname}>{r.otherNickname}</span>
                  <span className={styles.email}>{r.otherEmail}</span>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionPrimary}`}
                    data-testid={`incoming-accept-${r.id}`}
                    disabled={mutating}
                    onClick={() => {
                      onAccept(r.id);
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    data-testid={`incoming-reject-${r.id}`}
                    disabled={mutating}
                    onClick={() => {
                      onReject(r.id);
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {outgoing.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Sent requests</h2>
            {outgoing.map((r) => (
              <div className={styles.row} key={r.id} data-testid={`outgoing-row-${r.id}`}>
                <div className={styles.who}>
                  <span className={styles.nickname}>{r.otherNickname}</span>
                  <span className={styles.email}>{r.otherEmail}</span>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    data-testid={`outgoing-cancel-${r.id}`}
                    disabled={mutating}
                    onClick={() => {
                      onCancel(r.id);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {friends.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Friends</h2>
            {friends.map((f) => (
              <div className={styles.row} key={f.userId} data-testid={`friend-row-${f.userId}`}>
                <div className={styles.who}>
                  <span className={styles.nickname}>{f.nickname}</span>
                  <span className={styles.email}>{f.email}</span>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    data-testid={`friend-remove-${f.userId}`}
                    disabled={mutating}
                    onClick={() => {
                      onRemove(f.userId);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MenuFelt>
  );
}
