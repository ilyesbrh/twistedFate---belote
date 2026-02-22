import type { StoryFn, Meta } from "@storybook/react";
import { Application } from "@pixi/react";
import { ALL_SUITS } from "@belote/core";
import type { Suit } from "@belote/core";
import { THEME } from "../../theme.js";
import { initPixiReact } from "../../pixi-react-setup.js";
import { TrumpIndicatorReact } from "./trump-indicator-react.js";

initPixiReact();

const meta: Meta = {
  title: "React/HUD/TrumpIndicator",
};

export default meta;

// ---- Stories --------------------------------------------------------

/** All 4 trump suits side by side. */
export const AllSuits: StoryFn = () => (
  <Application width={400} height={120} background={THEME.colors.table.bgDark} antialias>
    {ALL_SUITS.map((suit: Suit, i: number) => (
      <pixiContainer key={suit} x={50 + i * 70} y={50}>
        <TrumpIndicatorReact suit={suit} />
      </pixiContainer>
    ))}
  </Application>
);

/** Hearts trump. */
export const Hearts: StoryFn = () => (
  <Application width={120} height={120} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={50} y={50}>
      <TrumpIndicatorReact suit="hearts" />
    </pixiContainer>
  </Application>
);

/** Spades trump. */
export const Spades: StoryFn = () => (
  <Application width={120} height={120} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={50} y={50}>
      <TrumpIndicatorReact suit="spades" />
    </pixiContainer>
  </Application>
);
