// ====================================================================
// ScorePanelReact — React functional component for team scores display.
// Two-row layout with team color markers, labels, and right-aligned scores.
// Coexists with imperative score-panel.ts during migration.
// ====================================================================

import type { Graphics } from "pixi.js";
import { THEME } from "../../theme.js";

// ---- Props ----------------------------------------------------------

export interface ScorePanelReactProps {
  team1Score: number;
  team2Score: number;
  team1Label: string;
  team2Label: string;
}

// ---- Constants ------------------------------------------------------

const PANEL_WIDTH = 120;
const PANEL_HEIGHT = 60;
const PANEL_RADIUS = 10;
const ROW_HEIGHT = 26;
const PADDING_X = THEME.spacing.sm;
const PADDING_Y = THEME.spacing.xs + 2;

// ---- Extracted helpers (unit-tested) --------------------------------

/** Draw the rounded-rect panel background with gold border. */
export function drawScorePanelBg(g: Graphics): void {
  g.clear();
  g.roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS);
  g.fill({ color: 0x000000, alpha: 0.6 });
  g.roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS);
  g.stroke({ width: 1.5, color: THEME.colors.accent.gold, alpha: 0.5 });
}

/** Draw the horizontal divider line between team rows. */
export function drawScoreDivider(g: Graphics): void {
  g.clear();
  g.moveTo(PADDING_X, PADDING_Y + ROW_HEIGHT);
  g.lineTo(PANEL_WIDTH - PADDING_X, PADDING_Y + ROW_HEIGHT);
  g.stroke({ width: 1, color: THEME.colors.accent.gold, alpha: 0.3 });
}

/** Draw a team color marker dot. rowIndex: 0 = team1, 1 = team2. */
export function drawTeamMarker(g: Graphics, rowIndex: number, color: number): void {
  const yOffset = rowIndex * ROW_HEIGHT;
  g.clear();
  g.circle(PADDING_X + 4, PADDING_Y + yOffset + 8, 3);
  g.fill(color);
}

// ---- Component ------------------------------------------------------

export function ScorePanelReact({
  team1Score,
  team2Score,
  team1Label,
  team2Label,
}: ScorePanelReactProps): React.JSX.Element {
  return (
    <pixiContainer label="score-panel">
      <pixiGraphics label="score-bg" draw={drawScorePanelBg} />
      <pixiGraphics label="score-divider" draw={drawScoreDivider} />
      <pixiGraphics
        label="team1-marker"
        draw={(g: Graphics) => {
          drawTeamMarker(g, 0, THEME.colors.team.team1);
        }}
      />
      <pixiGraphics
        label="team2-marker"
        draw={(g: Graphics) => {
          drawTeamMarker(g, 1, THEME.colors.team.team2);
        }}
      />
      <pixiText
        label="team1-label"
        text={team1Label}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.label.minSize,
          fill: THEME.colors.text.light,
        }}
        x={PADDING_X + 12}
        y={PADDING_Y}
      />
      <pixiText
        label="team1-score"
        text={String(team1Score)}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.score.minSize,
          fontWeight: THEME.typography.score.fontWeight,
          fill: THEME.colors.text.light,
        }}
        anchor={{ x: 1, y: 0 }}
        x={PANEL_WIDTH - PADDING_X}
        y={PADDING_Y}
      />
      <pixiText
        label="team2-label"
        text={team2Label}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.label.minSize,
          fill: THEME.colors.text.light,
        }}
        x={PADDING_X + 12}
        y={PADDING_Y + ROW_HEIGHT}
      />
      <pixiText
        label="team2-score"
        text={String(team2Score)}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.score.minSize,
          fontWeight: THEME.typography.score.fontWeight,
          fill: THEME.colors.text.light,
        }}
        anchor={{ x: 1, y: 0 }}
        x={PANEL_WIDTH - PADDING_X}
        y={PADDING_Y + ROW_HEIGHT}
      />
    </pixiContainer>
  );
}
