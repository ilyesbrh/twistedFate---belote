import { GameOver } from "../../components/GameOver/GameOver.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

export const gameOverFixtures: readonly Fixture[] = [
  {
    id: "game-over-ns-wins",
    title: "NS wins (you won)",
    group: "GameOver",
    render: () => (
      <GameOver
        winnerTeamIndex={0}
        nsTotal={512}
        ewTotal={387}
        targetScore={501}
        onPlayAgain={noop}
      />
    ),
  },
  {
    id: "game-over-ew-wins",
    title: "EW wins (you lost)",
    group: "GameOver",
    render: () => (
      <GameOver
        winnerTeamIndex={1}
        nsTotal={433}
        ewTotal={518}
        targetScore={501}
        onPlayAgain={noop}
      />
    ),
  },
  {
    id: "game-over-blowout",
    title: "Blowout — short 301 game",
    group: "GameOver",
    render: () => (
      <GameOver
        winnerTeamIndex={0}
        nsTotal={310}
        ewTotal={92}
        targetScore={301}
        onPlayAgain={noop}
      />
    ),
  },
];
