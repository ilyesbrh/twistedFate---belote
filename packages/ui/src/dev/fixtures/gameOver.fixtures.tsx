import { GameOver, type GameOverMode } from "../../components/GameOver/GameOver.js";
import type { RoundHistoryEntry } from "../../hooks/useGameSession.js";
import type { Fixture } from "../ScreenViewer/types.js";

const noop = (): void => {
  /* fixture: no-op */
};

const AI_BELOTE: GameOverMode = { kind: "ai", gameVariant: "belote" };
const AI_COINCHE: GameOverMode = { kind: "ai", gameVariant: "coinche" };
const ONLINE_FRIENDS: GameOverMode = { kind: "online-friends" };
const ONLINE_RANDOM: GameOverMode = { kind: "online-random" };

const SAMPLE_HISTORY: readonly RoundHistoryEntry[] = [
  {
    roundNumber: 1,
    bidderName: "Imed",
    contract: { id: "c1", suit: "hearts", value: 90, bidderPosition: 0, coincheLevel: 1 },
    roundScore: {
      contractingTeamPoints: 100,
      opponentTeamPoints: 62,
      contractingTeamRoundedPoints: 100,
      opponentTeamRoundedPoints: 60,
      contractMet: true,
      contractingTeamScore: 100,
      opponentTeamScore: 62,
      beloteBonusTeam: "contracting",
      contractingTeamFinalScore: 120,
      opponentTeamFinalScore: 62,
    },
    nsCumulative: 120,
    ewCumulative: 62,
  },
  {
    roundNumber: 2,
    bidderName: "Bilal",
    contract: { id: "c2", suit: "spades", value: 110, bidderPosition: 1, coincheLevel: 2 },
    roundScore: {
      contractingTeamPoints: 95,
      opponentTeamPoints: 67,
      contractingTeamRoundedPoints: 100,
      opponentTeamRoundedPoints: 70,
      contractMet: false,
      contractingTeamScore: 0,
      opponentTeamScore: 320,
      beloteBonusTeam: null,
      contractingTeamFinalScore: 0,
      opponentTeamFinalScore: 320,
    },
    nsCumulative: 440,
    ewCumulative: 62,
  },
  {
    roundNumber: 3,
    bidderName: "Sami",
    contract: { id: "c3", suit: "clubs", value: 80, bidderPosition: 0, coincheLevel: 1 },
    roundScore: {
      contractingTeamPoints: 82,
      opponentTeamPoints: 80,
      contractingTeamRoundedPoints: 80,
      opponentTeamRoundedPoints: 80,
      contractMet: true,
      contractingTeamScore: 80,
      opponentTeamScore: 80,
      beloteBonusTeam: null,
      contractingTeamFinalScore: 80,
      opponentTeamFinalScore: 80,
    },
    nsCumulative: 520,
    ewCumulative: 142,
  },
];

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
  {
    id: "game-over-with-breakdown",
    title: "With score breakdown (3 rounds)",
    group: "GameOver",
    render: () => (
      <GameOver
        winnerTeamIndex={0}
        nsTotal={520}
        ewTotal={142}
        targetScore={501}
        mode={AI_BELOTE}
        roundHistory={SAMPLE_HISTORY}
        onPlayAgain={noop}
        onBackToMenu={noop}
      />
    ),
  },
];
