import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerSummary, Seat, ServerMessage } from "@belote/protocol";
import { OnlineClient, type OnlineStatus } from "./OnlineClient.js";

export type LobbyPhase = "idle" | "creating" | "joining" | "in_room" | "error";

export interface OnlineLobbyState {
  readonly status: OnlineStatus;
  readonly phase: LobbyPhase;
  readonly code: string | null;
  readonly seat: Seat | null;
  readonly players: readonly PlayerSummary[];
  readonly error: string | null;
  createRoom(nickname: string): void;
  joinRoom(nickname: string, code: string): void;
  startGame(targetScore: number): void;
  disconnect(): void;
  /** Expose the underlying client for downstream hooks (game state wiring). */
  readonly client: OnlineClient;
}

const WS_URL_DEFAULT = "ws://localhost:4100/ws";

function resolveWsUrl(): string {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env["VITE_WS_URL"] ?? WS_URL_DEFAULT;
}

export function useOnlineLobby(): OnlineLobbyState {
  const clientRef = useRef<OnlineClient | null>(null);
  if (clientRef.current === null) {
    clientRef.current = new OnlineClient({ url: resolveWsUrl() });
  }
  const client = clientRef.current;

  const [status, setStatus] = useState<OnlineStatus>(client.status);
  const [phase, setPhase] = useState<LobbyPhase>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [seat, setSeat] = useState<Seat | null>(null);
  const [players, setPlayers] = useState<readonly PlayerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client.connect();
    const offStatus = client.onStatus((s) => setStatus(s));
    const offMsg = client.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case "room_created":
          setCode(msg.code);
          setSeat(msg.seat);
          setPlayers([{ seat: msg.seat, nickname: "" /* set by player_joined */ }]);
          setPhase("in_room");
          return;
        case "room_joined":
          setCode(msg.code);
          setSeat(msg.seat);
          setPlayers(msg.players);
          setPhase("in_room");
          return;
        case "player_joined": {
          setPlayers((prev) => {
            const next = prev.filter((p) => p.seat !== msg.seat);
            next.push({ seat: msg.seat, nickname: msg.nickname });
            next.sort((a, b) => a.seat - b.seat);
            return next;
          });
          return;
        }
        case "player_left":
          setPlayers((prev) => prev.filter((p) => p.seat !== msg.seat));
          return;
        case "error":
          setError(`${msg.code}: ${msg.reason}`);
          setPhase("error");
          return;
      }
    });
    return () => {
      offStatus();
      offMsg();
    };
  }, [client]);

  const api = useMemo<OnlineLobbyState>(
    () => ({
      status,
      phase,
      code,
      seat,
      players,
      error,
      client,
      createRoom(nickname: string) {
        setError(null);
        setPhase("creating");
        client.send({ type: "hello", nickname });
        client.send({ type: "create_room" });
      },
      joinRoom(nickname: string, roomCode: string) {
        setError(null);
        setPhase("joining");
        client.send({ type: "hello", nickname });
        client.send({ type: "join_room", code: roomCode });
      },
      startGame(targetScore: number) {
        client.send({ type: "start_game", targetScore });
      },
      disconnect() {
        client.disconnect();
      },
    }),
    [status, phase, code, seat, players, error, client],
  );

  return api;
}
