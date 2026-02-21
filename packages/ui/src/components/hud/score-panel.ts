// ====================================================================
// ScorePanel — PixiJS Container showing team scores.
// Placed in the top zone (right side).
// Verified visually in Storybook.
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
import { THEME } from "../../theme.js";

// ---- Types ----------------------------------------------------------

export interface ScorePanelOptions {
  readonly team1Score: number;
  readonly team2Score: number;
  readonly team1Label: string;
  readonly team2Label: string;
}

// ---- Constants ------------------------------------------------------

const PANEL_WIDTH = 100;
const PANEL_HEIGHT = 50;
const PANEL_RADIUS = 6;
const ROW_HEIGHT = 20;

// ---- ScorePanel -----------------------------------------------------

export class ScorePanel extends Container {
  private readonly team1ScoreText: Text;
  private readonly team2ScoreText: Text;

  constructor(options: ScorePanelOptions) {
    super();
    this.label = "score-panel";

    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS);
    bg.fill(THEME.colors.ui.overlay);
    bg.label = "score-bg";
    this.addChild(bg);

    // Team 1 row
    const team1Label = new Text({
      text: options.team1Label,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.label.minSize,
        fill: THEME.colors.text.light,
      },
    });
    team1Label.label = "team1-label";
    team1Label.x = THEME.spacing.xs;
    team1Label.y = THEME.spacing.xs;
    this.addChild(team1Label);

    this.team1ScoreText = new Text({
      text: String(options.team1Score),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.score.minSize,
        fontWeight: THEME.typography.score.fontWeight,
        fill: THEME.colors.text.light,
      },
    });
    this.team1ScoreText.label = "team1-score";
    this.team1ScoreText.anchor.set(1, 0);
    this.team1ScoreText.x = PANEL_WIDTH - THEME.spacing.xs;
    this.team1ScoreText.y = THEME.spacing.xs;
    this.addChild(this.team1ScoreText);

    // Team 2 row
    const team2Label = new Text({
      text: options.team2Label,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.label.minSize,
        fill: THEME.colors.text.muted,
      },
    });
    team2Label.label = "team2-label";
    team2Label.x = THEME.spacing.xs;
    team2Label.y = THEME.spacing.xs + ROW_HEIGHT;
    this.addChild(team2Label);

    this.team2ScoreText = new Text({
      text: String(options.team2Score),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.score.minSize,
        fontWeight: THEME.typography.score.fontWeight,
        fill: THEME.colors.text.muted,
      },
    });
    this.team2ScoreText.label = "team2-score";
    this.team2ScoreText.anchor.set(1, 0);
    this.team2ScoreText.x = PANEL_WIDTH - THEME.spacing.xs;
    this.team2ScoreText.y = THEME.spacing.xs + ROW_HEIGHT;
    this.addChild(this.team2ScoreText);
  }

  setScores(team1: number, team2: number): void {
    this.team1ScoreText.text = String(team1);
    this.team2ScoreText.text = String(team2);
  }
}
