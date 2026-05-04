import { OnlineRandomScreen } from "../../components/OnlineRandomScreen/OnlineRandomScreen.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

export const onlineRandomScreenFixtures: readonly Fixture[] = [
  {
    id: "online-random-idle",
    title: "Idle — empty nickname",
    group: "OnlineRandomScreen",
    render: () => (
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="open"
        error={null}
        onFind={noop}
        onCancel={noop}
        onBack={noop}
      />
    ),
  },
  {
    id: "online-random-queued-one",
    title: "Queued — 1/4 (just joined)",
    group: "OnlineRandomScreen",
    render: () => (
      <OnlineRandomScreen
        phase="queued"
        position={1}
        size={1}
        status="open"
        error={null}
        onFind={noop}
        onCancel={noop}
        onBack={noop}
      />
    ),
  },
  {
    id: "online-random-queued-three",
    title: "Queued — 3/4 (almost full)",
    group: "OnlineRandomScreen",
    render: () => (
      <OnlineRandomScreen
        phase="queued"
        position={3}
        size={3}
        status="open"
        error={null}
        onFind={noop}
        onCancel={noop}
        onBack={noop}
      />
    ),
  },
  {
    id: "online-random-error",
    title: "Error — server unreachable",
    group: "OnlineRandomScreen",
    render: () => (
      <OnlineRandomScreen
        phase="idle"
        position={null}
        size={0}
        status="error"
        error="Could not connect to game server"
        onFind={noop}
        onCancel={noop}
        onBack={noop}
      />
    ),
  },
];
