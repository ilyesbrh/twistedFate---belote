import type { StoryFn, Meta } from "@storybook/react";
import { Application } from "@pixi/react";
import { THEME } from "./theme.js";
import { initPixiReact } from "./pixi-react-setup.js";
import { GameRoot } from "./game-root.js";
import type { GameView } from "./game-view.js";

initPixiReact();

const meta: Meta = {
  title: "React/GameRoot",
};

export default meta;

// ---- Test data -------------------------------------------------------

const IDLE_VIEW: GameView = {
  players: [
    { name: "You", seat: "south", isActive: false, cardCount: 0, teamIndex: 0 },
    { name: "West", seat: "west", isActive: false, cardCount: 0, teamIndex: 1 },
    { name: "Partner", seat: "north", isActive: false, cardCount: 0, teamIndex: 0 },
    { name: "East", seat: "east", isActive: false, cardCount: 0, teamIndex: 1 },
  ],
  hand: [],
  opponents: [
    { seat: "west", orientation: "vertical", cardCount: 0 },
    { seat: "north", orientation: "horizontal", cardCount: 0 },
    { seat: "east", orientation: "vertical", cardCount: 0 },
  ],
  trick: [],
  trumpSuit: null,
  activeSeat: null,
  scores: { team1: 0, team2: 0 },
  phase: "idle",
};

const PLAYING_VIEW: GameView = {
  players: [
    { name: "You", seat: "south", isActive: true, cardCount: 5, teamIndex: 0 },
    { name: "West", seat: "west", isActive: false, cardCount: 5, teamIndex: 1 },
    { name: "Partner", seat: "north", isActive: false, cardCount: 5, teamIndex: 0 },
    { name: "East", seat: "east", isActive: false, cardCount: 5, teamIndex: 1 },
  ],
  hand: [
    { suit: "hearts", rank: "ace", playable: true },
    { suit: "hearts", rank: "king", playable: true },
    { suit: "spades", rank: "10", playable: false },
    { suit: "diamonds", rank: "queen", playable: false },
    { suit: "clubs", rank: "jack", playable: false },
  ],
  opponents: [
    { seat: "west", orientation: "vertical", cardCount: 5 },
    { seat: "north", orientation: "horizontal", cardCount: 5 },
    { seat: "east", orientation: "vertical", cardCount: 5 },
  ],
  trick: [
    { position: "north", suit: "hearts", rank: "10" },
    { position: "west", suit: "hearts", rank: "7" },
  ],
  trumpSuit: "hearts",
  activeSeat: "south",
  scores: { team1: 40, team2: 30 },
  phase: "playing",
};

const BIDDING_VIEW: GameView = {
  players: [
    { name: "You", seat: "south", isActive: true, cardCount: 8, teamIndex: 0 },
    { name: "West", seat: "west", isActive: false, cardCount: 8, teamIndex: 1 },
    { name: "Partner", seat: "north", isActive: false, cardCount: 8, teamIndex: 0 },
    { name: "East", seat: "east", isActive: false, cardCount: 8, teamIndex: 1 },
  ],
  hand: [
    { suit: "hearts", rank: "ace", playable: true },
    { suit: "hearts", rank: "king", playable: true },
    { suit: "spades", rank: "10", playable: true },
    { suit: "diamonds", rank: "queen", playable: true },
    { suit: "clubs", rank: "jack", playable: true },
    { suit: "hearts", rank: "9", playable: true },
    { suit: "spades", rank: "8", playable: true },
    { suit: "diamonds", rank: "7", playable: true },
  ],
  opponents: [
    { seat: "west", orientation: "vertical", cardCount: 8 },
    { seat: "north", orientation: "horizontal", cardCount: 8 },
    { seat: "east", orientation: "vertical", cardCount: 8 },
  ],
  trick: [],
  trumpSuit: null,
  activeSeat: "south",
  scores: { team1: 0, team2: 0 },
  phase: "bidding",
};

// ---- Stories ---------------------------------------------------------

/** Idle state — no round in progress. */
export const Idle: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <GameRoot width={844} height={390} view={IDLE_VIEW} />
  </Application>
);

/** Playing phase — cards in hand, trick in progress, trump and turn indicators visible. */
export const Playing: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <GameRoot width={844} height={390} view={PLAYING_VIEW} />
  </Application>
);

/** Bidding phase — bidding panel visible in bottom zone. */
export const Bidding: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <GameRoot width={844} height={390} view={BIDDING_VIEW} />
  </Application>
);

/** Portrait layout (390x844). */
export const Portrait: StoryFn = () => (
  <Application width={390} height={844} background={THEME.colors.table.bgDark} antialias>
    <GameRoot width={390} height={844} view={PLAYING_VIEW} />
  </Application>
);
