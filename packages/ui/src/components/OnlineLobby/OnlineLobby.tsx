import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { MenuFelt } from "../MenuFelt/MenuFelt.js";
import type { OnlineLobbyState } from "../../online/useOnlineLobby.js";
import { apiListFriends, type Friend } from "../../online/api/friends.js";
import styles from "./OnlineLobby.module.css";

interface OnlineLobbyProps {
  lobby: OnlineLobbyState;
  onBack: () => void;
  /** Called once start_game has been dispatched and the host wants to enter the game UI. */
  onGameStarted: () => void;
}

export function OnlineLobby({ lobby, onBack, onGameStarted }: OnlineLobbyProps): ReactElement {
  const isUser = lobby.identity?.kind === "user";
  const autoNickname = lobby.identity?.nickname ?? "";
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"choose" | "join">("choose");
  const [friends, setFriends] = useState<readonly Friend[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isFull = lobby.players.length === 4;
  const isHost = lobby.seat === 0;

  // Fetch friends list when user enters a room
  useEffect(() => {
    if (lobby.phase !== "in_room" || !isUser) return;
    apiListFriends()
      .then((v) => {
        setFriends(v.friends);
      })
      .catch(() => {
        // silently ignore — invite is optional
      });
  }, [lobby.phase, isUser]);

  const copyInvite = (friendId: string): void => {
    const url = `${window.location.origin}${window.location.pathname}?room=${lobby.code ?? ""}&pid=join`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedId(friendId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <MenuFelt className={styles.root}>
      <div data-testid="online-lobby" className={styles.contentColumn}>
        <button
          className={styles.back}
          onClick={onBack}
          aria-label="Back to menu"
          data-testid="lobby-back"
        >
          ← Back
        </button>

        <h2 className={styles.title}>Play with Friends</h2>

        <p className={styles.status} data-testid="lobby-status">
          {lobby.status === "open" ? "Connected" : `Status: ${lobby.status}`}
        </p>

        {lobby.error && (
          <p className={styles.error} data-testid="lobby-error">
            {lobby.error}
          </p>
        )}

        {lobby.phase === "in_room" ? (
          <div className={styles.inRoom}>
            <div className={styles.codeBlock} data-testid="room-code-card">
              <span className={styles.codeLabel}>Room code</span>
              <span className={styles.codeValue} data-testid="room-code">
                {lobby.code}
              </span>
            </div>
            <ul className={styles.players}>
              {[0, 1, 2, 3].map((seat) => {
                const p = lobby.players.find((pp) => pp.seat === seat);
                return (
                  <li
                    key={seat}
                    className={`${styles.playerRow} ${p ? styles.playerSeated : ""}`}
                    data-testid={`lobby-seat-${seat}`}
                  >
                    <span className={styles.seatLabel}>Seat {seat + 1}</span>
                    <span className={styles.playerName}>
                      {p ? p.nickname || "(you)" : "Waiting…"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {friends.length > 0 && !isFull && (
              <div className={styles.inviteSection}>
                <h3 className={styles.inviteTitle}>Invite friends</h3>
                <ul className={styles.inviteList}>
                  {friends.map((f) => (
                    <li key={f.userId} className={styles.inviteRow}>
                      <span className={styles.inviteName}>{f.nickname}</span>
                      <button
                        type="button"
                        className={styles.inviteBtn}
                        onClick={() => {
                          copyInvite(f.userId);
                        }}
                        data-testid={`invite-${f.userId}`}
                      >
                        {copiedId === f.userId ? "Copied!" : "Copy link"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isHost && !isFull && (
              <button
                className={styles.secondaryBtn}
                onClick={() => {
                  lobby.addBots();
                }}
                aria-label="Fill empty seats with bots"
                data-touch="primary"
                data-testid="add-bots-btn"
              >
                Fill with bots
              </button>
            )}
            {isHost && (
              <button
                className={styles.startBtn}
                disabled={!isFull}
                onClick={() => {
                  lobby.startGame(501);
                  onGameStarted();
                }}
                aria-label={isFull ? "Start game" : "Start game (waiting for players)"}
                data-touch="primary"
                data-testid="start-game-btn"
              >
                {isFull ? "Start game" : `Waiting for ${String(4 - lobby.players.length)} more`}
              </button>
            )}
            {!isHost && <p className={styles.hint}>Waiting for host to start…</p>}
          </div>
        ) : (
          <div className={styles.lobbyForms}>
            {mode === "choose" ? (
              <div className={styles.btnRow}>
                <button
                  className={styles.primaryBtn}
                  disabled={!autoNickname || lobby.status !== "open"}
                  onClick={() => {
                    lobby.createRoom(autoNickname);
                  }}
                  aria-label="Create a room"
                  data-touch="primary"
                  data-testid="create-room-btn"
                >
                  Create room
                </button>
                <button
                  className={styles.secondaryBtn}
                  disabled={!autoNickname || lobby.status !== "open"}
                  onClick={() => setMode("join")}
                  aria-label="Join an existing room"
                  data-touch="primary"
                  data-testid="enter-join-btn"
                >
                  Join room
                </button>
              </div>
            ) : (
              <div className={styles.joinRow}>
                <input
                  className={styles.input}
                  placeholder="ABCD"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  aria-label="Room code"
                  data-testid="join-code-input"
                />
                <button
                  className={styles.primaryBtn}
                  disabled={joinCode.length !== 4}
                  onClick={() => {
                    lobby.joinRoom(autoNickname, joinCode);
                  }}
                  aria-label="Join room"
                  data-touch="primary"
                  data-testid="join-room-btn"
                >
                  Join
                </button>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => setMode("choose")}
                  aria-label="Cancel join"
                  data-touch="primary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </MenuFelt>
  );
}
