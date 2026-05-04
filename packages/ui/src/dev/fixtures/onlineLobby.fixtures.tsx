import { OnlineLobby } from "../../components/OnlineLobby/OnlineLobby.js";
import type { OnlineLobbyState } from "../../online/useOnlineLobby.js";
import type { PlayerSummary } from "@belote/protocol";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

function makeLobby(over: Partial<OnlineLobbyState> = {}): OnlineLobbyState {
  return {
    status: "open",
    phase: "idle",
    code: null,
    seat: null,
    playerToken: null,
    players: [],
    error: null,
    queuePosition: null,
    queueSize: 0,
    createRoom: noop,
    joinRoom: noop,
    findRandom: noop,
    cancelRandom: noop,
    startGame: noop,
    disconnect: noop,
    clearSavedSession: noop,
    client: {} as OnlineLobbyState["client"],
    ...over,
  };
}

const ROSTER: readonly PlayerSummary[] = [
  { seat: 0, nickname: "ElenaP" },
  { seat: 1, nickname: "Villy" },
  { seat: 2, nickname: "DilyanaBl" },
  { seat: 3, nickname: "Vane_Bane" },
];

export const onlineLobbyFixtures: readonly Fixture[] = [
  {
    id: "online-lobby-idle",
    title: "Idle — choose create or join",
    group: "OnlineLobby",
    render: () => <OnlineLobby lobby={makeLobby()} onBack={noop} onGameStarted={noop} />,
  },
  {
    id: "online-lobby-host-1",
    title: "Host — 1 of 4 seats filled",
    group: "OnlineLobby",
    render: () => (
      <OnlineLobby
        lobby={makeLobby({
          phase: "in_room",
          code: "ABCD",
          seat: 0,
          players: ROSTER.slice(0, 1),
        })}
        onBack={noop}
        onGameStarted={noop}
      />
    ),
  },
  {
    id: "online-lobby-host-2",
    title: "Host — 2 of 4 seats filled",
    group: "OnlineLobby",
    render: () => (
      <OnlineLobby
        lobby={makeLobby({
          phase: "in_room",
          code: "ABCD",
          seat: 0,
          players: ROSTER.slice(0, 2),
        })}
        onBack={noop}
        onGameStarted={noop}
      />
    ),
  },
  {
    id: "online-lobby-host-3",
    title: "Host — 3 of 4 seats filled",
    group: "OnlineLobby",
    render: () => (
      <OnlineLobby
        lobby={makeLobby({
          phase: "in_room",
          code: "ABCD",
          seat: 0,
          players: ROSTER.slice(0, 3),
        })}
        onBack={noop}
        onGameStarted={noop}
      />
    ),
  },
  {
    id: "online-lobby-host-full",
    title: "Host — full room (start enabled)",
    group: "OnlineLobby",
    render: () => (
      <OnlineLobby
        lobby={makeLobby({
          phase: "in_room",
          code: "ABCD",
          seat: 0,
          players: ROSTER,
        })}
        onBack={noop}
        onGameStarted={noop}
      />
    ),
  },
  {
    id: "online-lobby-joiner-waiting",
    title: "Joiner — waiting for host",
    group: "OnlineLobby",
    render: () => (
      <OnlineLobby
        lobby={makeLobby({
          phase: "in_room",
          code: "ABCD",
          seat: 1,
          players: ROSTER.slice(0, 2),
        })}
        onBack={noop}
        onGameStarted={noop}
      />
    ),
  },
  {
    id: "online-lobby-error",
    title: "Error — room full",
    group: "OnlineLobby",
    render: () => (
      <OnlineLobby
        lobby={makeLobby({
          phase: "error",
          error: "Room is full (4/4)",
        })}
        onBack={noop}
        onGameStarted={noop}
      />
    ),
  },
];
