import { GameOver, type GameOverMode } from "../../components/GameOver/GameOver.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

const AI_BELOTE: GameOverMode = { kind: "ai", gameVariant: "belote" };
const AI_COINCHE: GameOverMode = { kind: "ai", gameVariant: "coinche" };
const ONLINE_FRIENDS: GameOverMode = { kind: "online-friends" };
const ONLINE_RANDOM: GameOverMode = { kind: "online-random" };

export const gameOverFixtures: readonly Fixture[] = [
  {
    id: "game-over-ns-wins",
    title: "NS wins (you won) — AI Belote",
    group: "GameOver",
    render: () => (
      <GameOver
        winnerTeamIndex={0}
        nsTotal={512}
        ewTotal={387}
        targetScore={501}
        mode={AI_BELOTE}
        onPlayAgain={noop}
        onBackToMenu={noop}
      />
    ),
  },
  {
    id: "game-over-ew-wins",
    title: "EW wins (you lost) — AI Belote",
    group: "GameOver",
    render: () => (
      <GameOver
        winnerTeamIndex={1}
        nsTotal={433}
        ewTotal={518}
        targetScore={501}
        mode={AI_BELOTE}
        onPlayAgain={noop}
        onBackToMenu={noop}
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
        mode={AI_COINCHE}
        onPlayAgain={noop}
        onBackToMenu={noop}
      />
    ),
  },
  {
    id: "game-over-online-friends",
    title: "Online friends — LEAVE ROOM + Back to Menu",
    group: "GameOver",
    render: () => (
      <GameOver
        winnerTeamIndex={0}
        nsTotal={520}
        ewTotal={395}
        targetScore={501}
        mode={ONLINE_FRIENDS}
        onPlayAgain={noop}
        onBackToMenu={noop}
      />
    ),
  },
  {
    id: "game-over-online-random",
    title: "Online random — FIND NEW OPPONENTS + LEAVE + Back",
    group: "GameOver",
    render: () => (
      <GameOver
        winnerTeamIndex={1}
        nsTotal={410}
        ewTotal={502}
        targetScore={501}
        mode={ONLINE_RANDOM}
        onPlayAgain={noop}
        onBackToMenu={noop}
        onFindNewOpponents={noop}
      />
    ),
  },
];
