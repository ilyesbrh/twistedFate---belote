import { StartScreen } from "../../components/StartScreen/StartScreen.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

export const startScreenFixtures: readonly Fixture[] = [
  {
    id: "start-screen-default",
    title: "Default",
    group: "StartScreen",
    render: () => <StartScreen players={[]} targetScore={501} onPlay={noop} />,
  },
  {
    id: "start-screen-301-target",
    title: "301 target (short game)",
    group: "StartScreen",
    render: () => <StartScreen players={[]} targetScore={301} onPlay={noop} />,
  },
  {
    id: "start-screen-coinche",
    title: "Coinche variant (1000 pts, with back button)",
    group: "StartScreen",
    render: () => (
      <StartScreen
        players={[]}
        targetScore={1000}
        onPlay={noop}
        onBack={noop}
        gameName="Coinche"
        gameSubtitle="SA · TA · Coinché"
      />
    ),
  },
];
