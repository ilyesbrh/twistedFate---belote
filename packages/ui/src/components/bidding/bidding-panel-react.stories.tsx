import type { StoryFn, Meta } from "@storybook/react";
import { Application } from "@pixi/react";
import { THEME } from "../../theme.js";
import { initPixiReact } from "../../pixi-react-setup.js";
import { BiddingPanelReact } from "./bidding-panel-react.js";
import type { Rect } from "../../layout.js";

initPixiReact();

const meta: Meta = {
  title: "React/BiddingPanel",
};

export default meta;

// ---- Zones ----------------------------------------------------------

const LANDSCAPE_BOTTOM: Rect = { x: 0, y: 281, width: 844, height: 109 };
const PORTRAIT_BOTTOM: Rect = { x: 0, y: 607, width: 390, height: 237 };

// ---- Stories --------------------------------------------------------

/** Landscape baseline — 5 buttons in bottom zone. */
export const Landscape: StoryFn = () => (
  <Application width={844} height={390} background={THEME.colors.table.bgDark} antialias>
    <BiddingPanelReact
      zone={LANDSCAPE_BOTTOM}
      onSuitBid={(suit) => {
        console.log("Suit bid:", suit);
      }}
      onPass={() => {
        console.log("Pass");
      }}
    />
  </Application>
);

/** Portrait fallback — buttons in taller bottom zone. */
export const Portrait: StoryFn = () => (
  <Application width={390} height={844} background={THEME.colors.table.bgDark} antialias>
    <BiddingPanelReact
      zone={PORTRAIT_BOTTOM}
      onSuitBid={(suit) => {
        console.log("Suit bid:", suit);
      }}
      onPass={() => {
        console.log("Pass");
      }}
    />
  </Application>
);
