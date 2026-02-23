import type { StoryFn, Meta } from "@storybook/react";
import { Application } from "@pixi/react";
import { THEME } from "../../theme.js";
import { initPixiReact } from "../../pixi-react-setup.js";
import { TrickDisplayReact } from "./trick-display-react.js";
import type { TrickCardReact } from "./trick-display-react.js";
import type { Rect } from "../../layout.js";

initPixiReact();

const meta: Meta = {
  title: "React/TrickDisplay",
};

export default meta;

// ---- Mock data ------------------------------------------------------

const CENTER: Rect = { x: 127, y: 70, width: 590, height: 211 };

const ALL_CARDS: TrickCardReact[] = [
  { position: "south", suit: "hearts", rank: "ace" },
  { position: "west", suit: "hearts", rank: "king" },
  { position: "north", suit: "hearts", rank: "10" },
  { position: "east", suit: "spades", rank: "jack" },
];

// ---- Stories --------------------------------------------------------

/** Empty trick — no cards played yet. */
export const Empty: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <TrickDisplayReact zone={CENTER} cards={[]} />
  </Application>
);

/** One card — human leads from south. */
export const OneCard: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <TrickDisplayReact zone={CENTER} cards={ALL_CARDS.slice(0, 1)} />
  </Application>
);

/** Two cards — south and west played. */
export const TwoCards: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <TrickDisplayReact zone={CENTER} cards={ALL_CARDS.slice(0, 2)} />
  </Application>
);

/** Full trick — all 4 cards played. */
export const FullTrick: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <TrickDisplayReact zone={CENTER} cards={ALL_CARDS} />
  </Application>
);
