import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container, Graphics, Text } from "pixi.js";
import { THEME } from "../../theme.js";

const meta: Meta = {
  title: "Components/HUD/ScorePanel",
};

export default meta;

// ---- Helpers --------------------------------------------------------

const PANEL_WIDTH = 100;
const PANEL_HEIGHT = 50;
const PANEL_RADIUS = 6;
const ROW_HEIGHT = 20;

function buildScorePanel(
  team1Label: string,
  team1Score: number,
  team2Label: string,
  team2Score: number,
): Container {
  const panel = new Container();
  panel.label = "score-panel";

  const bg = new Graphics();
  bg.roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS);
  bg.fill(THEME.colors.ui.overlay);
  bg.label = "score-bg";
  panel.addChild(bg);

  // Team 1
  const t1Label = new Text({
    text: team1Label,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.text.light,
    },
  });
  t1Label.x = THEME.spacing.xs;
  t1Label.y = THEME.spacing.xs;
  panel.addChild(t1Label);

  const t1Score = new Text({
    text: String(team1Score),
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.score.minSize,
      fontWeight: THEME.typography.score.fontWeight,
      fill: THEME.colors.text.light,
    },
  });
  t1Score.anchor.set(1, 0);
  t1Score.x = PANEL_WIDTH - THEME.spacing.xs;
  t1Score.y = THEME.spacing.xs;
  panel.addChild(t1Score);

  // Team 2
  const t2Label = new Text({
    text: team2Label,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.text.muted,
    },
  });
  t2Label.x = THEME.spacing.xs;
  t2Label.y = THEME.spacing.xs + ROW_HEIGHT;
  panel.addChild(t2Label);

  const t2Score = new Text({
    text: String(team2Score),
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.score.minSize,
      fontWeight: THEME.typography.score.fontWeight,
      fill: THEME.colors.text.muted,
    },
  });
  t2Score.anchor.set(1, 0);
  t2Score.x = PANEL_WIDTH - THEME.spacing.xs;
  t2Score.y = THEME.spacing.xs + ROW_HEIGHT;
  panel.addChild(t2Score);

  return panel;
}

// ---- Stories --------------------------------------------------------

/** Opening scores (0-0). */
export const ZeroZero: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  const panel = buildScorePanel("Us", 0, "Them", 0);
  panel.x = 30;
  panel.y = 30;
  root.addChild(panel);
  return { view: root };
};

/** Mid-game scores. */
export const MidGame: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  const panel = buildScorePanel("Us", 82, "Them", 45);
  panel.x = 30;
  panel.y = 30;
  root.addChild(panel);
  return { view: root };
};

/** High scores (close to winning). */
export const CloseGame: StoryFn = (): { view: Container } => {
  const root = new Container();
  root.label = "story-root";
  const panel = buildScorePanel("Us", 481, "Them", 462);
  panel.x = 30;
  panel.y = 30;
  root.addChild(panel);
  return { view: root };
};
