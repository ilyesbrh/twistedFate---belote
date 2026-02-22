// ====================================================================
// ScorePanel — PixiJS Container showing team scores.
// Placed in the top zone (right side).
// Verified visually in Storybook.
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
import { DropShadowFilter } from "pixi-filters";
import { THEME } from "../../theme.js";

// ---- Types ----------------------------------------------------------

export interface ScorePanelOptions {
  readonly team1Score: number;
  readonly team2Score: number;
  readonly team1Label: string;
  readonly team2Label: string;
}

// ---- Constants ------------------------------------------------------

export const SCORE_PANEL_WIDTH = 120;
const PANEL_WIDTH = SCORE_PANEL_WIDTH;
const PANEL_HEIGHT = 60;
const PANEL_RADIUS = 10;
const ROW_HEIGHT = 26;
const PADDING_X = THEME.spacing.sm;
const PADDING_Y = THEME.spacing.xs + 2;

// ---- ScorePanel -----------------------------------------------------

export class ScorePanel extends Container {
  private readonly team1ScoreText: Text;
  private readonly team2ScoreText: Text;

  constructor(options: ScorePanelOptions) {
    super();
    this.label = "score-panel";

    // Drop shadow
    const shadow = THEME.shadows.panel;
    this.filters = [
      new DropShadowFilter({
        color: shadow.color,
        alpha: shadow.alpha,
        blur: shadow.blur,
        offset: { x: shadow.offsetX, y: shadow.offsetY },
      }),
    ];

    // Background with gold border
    const bg = new Graphics();
    bg.roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS);
    bg.fill({ color: 0x000000, alpha: 0.6 });
    bg.roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS);
    bg.stroke({ width: 1.5, color: THEME.colors.accent.gold, alpha: 0.5 });
    bg.label = "score-bg";
    this.addChild(bg);

    // Divider line between teams
    const divider = new Graphics();
    divider.moveTo(PADDING_X, PADDING_Y + ROW_HEIGHT);
    divider.lineTo(PANEL_WIDTH - PADDING_X, PADDING_Y + ROW_HEIGHT);
    divider.stroke({ width: 1, color: THEME.colors.accent.gold, alpha: 0.3 });
    divider.label = "score-divider";
    this.addChild(divider);

    // Team 1 color marker
    const team1Dot = new Graphics();
    team1Dot.circle(PADDING_X + 4, PADDING_Y + 8, 3);
    team1Dot.fill(THEME.colors.team.team1);
    team1Dot.label = "team1-marker";
    this.addChild(team1Dot);

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
    team1Label.x = PADDING_X + 12;
    team1Label.y = PADDING_Y;
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
    this.team1ScoreText.x = PANEL_WIDTH - PADDING_X;
    this.team1ScoreText.y = PADDING_Y;
    this.addChild(this.team1ScoreText);

    // Team 2 color marker
    const team2Dot = new Graphics();
    team2Dot.circle(PADDING_X + 4, PADDING_Y + ROW_HEIGHT + 8, 3);
    team2Dot.fill(THEME.colors.team.team2);
    team2Dot.label = "team2-marker";
    this.addChild(team2Dot);

    // Team 2 row — both teams in light text (differentiated by color markers)
    const team2Label = new Text({
      text: options.team2Label,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.label.minSize,
        fill: THEME.colors.text.light,
      },
    });
    team2Label.label = "team2-label";
    team2Label.x = PADDING_X + 12;
    team2Label.y = PADDING_Y + ROW_HEIGHT;
    this.addChild(team2Label);

    this.team2ScoreText = new Text({
      text: String(options.team2Score),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.score.minSize,
        fontWeight: THEME.typography.score.fontWeight,
        fill: THEME.colors.text.light,
      },
    });
    this.team2ScoreText.label = "team2-score";
    this.team2ScoreText.anchor.set(1, 0);
    this.team2ScoreText.x = PANEL_WIDTH - PADDING_X;
    this.team2ScoreText.y = PADDING_Y + ROW_HEIGHT;
    this.addChild(this.team2ScoreText);
  }

  setScores(team1: number, team2: number): void {
    this.team1ScoreText.text = String(team1);
    this.team2ScoreText.text = String(team2);
  }
}
