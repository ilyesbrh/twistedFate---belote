import { useState } from "react";
import type { ReactElement } from "react";
import type { OnlineLobbyState } from "../../online/useOnlineLobby.js";
import styles from "./OnlineLobby.module.css";

interface OnlineLobbyProps {
  lobby: OnlineLobbyState;
  onBack: () => void;
  /** Called once start_game has been dispatched and the host wants to enter the game UI. */
  onGameStarted: () => void;
}

export function OnlineLobby({ lobby, onBack, onGameStarted }: OnlineLobbyProps): ReactElement {
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"choose" | "join">("choose");

  const isFull = lobby.players.length === 4;
  const isHost = lobby.seat === 0;

  return (
    <div className={styles.root} data-testid="online-lobby">
      <button className={styles.back} onClick={onBack} data-testid="lobby-back">
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
          <div className={styles.codeBlock}>
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
          {isHost && (
            <button
              className={styles.startBtn}
              disabled={!isFull}
              onClick={() => {
                lobby.startGame(501);
                onGameStarted();
              }}
              data-testid="start-game-btn"
            >
              {isFull ? "Start game" : `Waiting for ${String(4 - lobby.players.length)} more`}
            </button>
          )}
          {!isHost && <p className={styles.hint}>Waiting for host to start…</p>}
        </div>
      ) : (
        <div className={styles.lobbyForms}>
          <input
            className={styles.input}
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            data-testid="nickname-input"
          />
          {mode === "choose" ? (
            <div className={styles.btnRow}>
              <button
                className={styles.primaryBtn}
                disabled={!nickname.trim() || lobby.status !== "open"}
                onClick={() => lobby.createRoom(nickname.trim())}
                data-testid="create-room-btn"
              >
                Create room
              </button>
              <button
                className={styles.secondaryBtn}
                disabled={!nickname.trim() || lobby.status !== "open"}
                onClick={() => setMode("join")}
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
                data-testid="join-code-input"
              />
              <button
                className={styles.primaryBtn}
                disabled={joinCode.length !== 4}
                onClick={() => lobby.joinRoom(nickname.trim(), joinCode)}
                data-testid="join-room-btn"
              >
                Join
              </button>
              <button className={styles.secondaryBtn} onClick={() => setMode("choose")}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
