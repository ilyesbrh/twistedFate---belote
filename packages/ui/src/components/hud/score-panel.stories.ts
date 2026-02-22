import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container } from "pixi.js";
import { ScorePanel } from "./score-panel.js";

const meta: Meta = {
  title: "Components/HUD/ScorePanel",
};

export default meta;

// ---- Stories --------------------------------------------------------

/** Opening scores (0-0). */
export const ZeroZero: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  const panel = new ScorePanel({
    team1Score: 0,
    team2Score: 0,
    team1Label: "Us",
    team2Label: "Them",
  });
  panel.x = 30;
  panel.y = 30;
  root.addChild(panel);
  return { view: root };
};

/** Mid-game scores. */
export const MidGame: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  const panel = new ScorePanel({
    team1Score: 82,
    team2Score: 45,
    team1Label: "Us",
    team2Label: "Them",
  });
  panel.x = 30;
  panel.y = 30;
  root.addChild(panel);
  return { view: root };
};

/** High scores (close to winning). */
export const CloseGame: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  const panel = new ScorePanel({
    team1Score: 481,
    team2Score: 462,
    team1Label: "Us",
    team2Label: "Them",
  });
  panel.x = 30;
  panel.y = 30;
  root.addChild(panel);
  return { view: root };
};
