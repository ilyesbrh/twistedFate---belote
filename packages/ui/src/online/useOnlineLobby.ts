import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerSummary, Seat, ServerMessage } from "@belote/protocol";
import { OnlineClient, type OnlineStatus } from "./OnlineClient.js";

export type LobbyPhase = "idle" | "creating" | "joining" | "rejoining" | "in_room" | "error";

export interface OnlineLobbyState {
  readonly status: OnlineStatus;
  readonly phase: LobbyPhase;
  readonly code: string | null;
  readonly seat: Seat | null;
  readonly playerToken: string | null;
  readonly players: readonly PlayerSummary[];
  readonly error: string | null;
  createRoom(nickname: string): void;
  joinRoom(nickname: string, code: string): void;
  startGame(targetScore: number): void;
  disconnect(): void;
  /** Forget the saved (room, token) for this browser. Call when user
   *  explicitly leaves; rejoin won't be attempted on next load. */
  clearSavedSession(): void;
  /** Expose the underlying client for downstream hooks (game state wiring). */
  readonly client: OnlineClient;
}

const WS_URL_DEFAULT = "ws://localhost:4100/ws";
const STORAGE_KEY = "belote.online.session.v1";

interface SavedSession {
  code: string;
  playerToken: string;
}

function resolveWsUrl(): string {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env["VITE_WS_URL"] ?? WS_URL_DEFAULT;
}

/**
 * Read room+token from URL query params first (so a shareable link works),
 * else from localStorage as a fallback for tab refresh.
 */
function readSavedSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const code = url.searchParams.get("room");
  const tok = url.searchParams.get("pid");
  if (code && tok && /^[A-Z]{4}$/.test(code)) {
    return { code, playerToken: tok };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: SavedSession = JSON.parse(raw);
    if (typeof parsed.code === "string" && typeof parsed.playerToken === "string") {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function writeSavedSession(s: SavedSession): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("room", s.code);
  url.searchParams.set("pid", s.playerToken);
  window.history.replaceState({}, "", url.toString());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // best-effort — ignore quota / disabled-storage errors.
  }
}

function clearSavedSessionStorage(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("room");
  url.searchParams.delete("pid");
  window.history.replaceState({}, "", url.toString());
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
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
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [players, setPlayers] = useState<readonly PlayerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const rejoinAttemptedRef = useRef(false);

  useEffect(() => {
    client.connect();
    const offStatus = client.onStatus((s) => {
      setStatus(s);
      // On first open, attempt rejoin if a saved (room, token) exists.
      if (s === "open" && !rejoinAttemptedRef.current) {
        rejoinAttemptedRef.current = true;
        const saved = readSavedSession();
        if (saved) {
          setPhase("rejoining");
          client.send({ type: "rejoin_room", code: saved.code, playerToken: saved.playerToken });
        }
      }
    });
    const offMsg = client.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case "room_created":
          setCode(msg.code);
          setSeat(msg.seat);
          setPlayerToken(msg.playerToken);
          setPlayers([{ seat: msg.seat, nickname: "" /* set by player_joined */ }]);
          setPhase("in_room");
          writeSavedSession({ code: msg.code, playerToken: msg.playerToken });
          return;
        case "room_joined":
          setCode(msg.code);
          setSeat(msg.seat);
          setPlayerToken(msg.playerToken);
          setPlayers(msg.players);
          setPhase("in_room");
          writeSavedSession({ code: msg.code, playerToken: msg.playerToken });
          return;
        case "player_joined":
          setPlayers((prev) => {
            const next = prev.filter((p) => p.seat !== msg.seat);
            next.push({ seat: msg.seat, nickname: msg.nickname });
            next.sort((a, b) => a.seat - b.seat);
            return next;
          });
          return;
        case "player_left":
          setPlayers((prev) => prev.filter((p) => p.seat !== msg.seat));
          return;
        case "error":
          setError(`${msg.code}: ${msg.reason}`);
          // If a rejoin attempt failed, clear the saved session so we don't
          // loop on next refresh, and fall back to the lobby.
          if (msg.code === "REJOIN_FAILED" || msg.code === "NO_SUCH_ROOM") {
            clearSavedSessionStorage();
            setPhase("idle");
          } else {
            setPhase("error");
          }
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
      playerToken,
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
      clearSavedSession() {
        clearSavedSessionStorage();
      },
    }),
    [status, phase, code, seat, playerToken, players, error, client],
  );

  return api;
}
