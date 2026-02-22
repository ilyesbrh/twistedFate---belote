import type { StoryFn, Meta } from "@storybook/react";
import { Application } from "@pixi/react";
import { THEME } from "../../theme.js";
import { initPixiReact } from "../../pixi-react-setup.js";
import { ScorePanelReact } from "./score-panel-react.js";

initPixiReact();

const meta: Meta = {
  title: "React/HUD/ScorePanel",
};

export default meta;

// ---- Stories --------------------------------------------------------

/** Opening scores (0-0). */
export const ZeroZero: StoryFn = () => (
  <Application width={200} height={120} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={30} y={30}>
      <ScorePanelReact team1Score={0} team2Score={0} team1Label="Us" team2Label="Them" />
    </pixiContainer>
  </Application>
);

/** Mid-game scores. */
export const MidGame: StoryFn = () => (
  <Application width={200} height={120} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={30} y={30}>
      <ScorePanelReact team1Score={82} team2Score={45} team1Label="Us" team2Label="Them" />
    </pixiContainer>
  </Application>
);

/** High scores (close to winning). */
export const CloseGame: StoryFn = () => (
  <Application width={200} height={120} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={30} y={30}>
      <ScorePanelReact team1Score={481} team2Score={462} team1Label="Us" team2Label="Them" />
    </pixiContainer>
  </Application>
);
