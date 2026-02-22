// ====================================================================
// TurnIndicatorReact — React functional component for turn indication.
// Displays a directional arrow + player name on a pill-shaped background.
// Coexists with imperative turn-indicator.ts during migration.
// ====================================================================

import type { Graphics } from "pixi.js";
import type { Seat } from "../../layout.js";
import { THEME } from "../../theme.js";

// ---- Props ----------------------------------------------------------

export interface TurnIndicatorProps {
  seat: Seat;
  playerName: string;
}

// ---- Constants ------------------------------------------------------

const ARROWS: Record<Seat, string> = {
  south: "\u2193",
  north: "\u2191",
  west: "\u2190",
  east: "\u2192",
};

const PILL_HEIGHT = 28;
const PILL_PADDING_X = 14;
const MIN_TEXT_WIDTH = 60;

// ---- Extracted helpers (unit-tested) --------------------------------

/** Map a seat to its directional arrow character. */
export function arrowForSeat(seat: Seat): string {
  return ARROWS[seat];
}

/** Draw the pill-shaped background at the given dimensions. */
export function drawTurnPill(g: Graphics, pillWidth: number, totalHeight: number): void {
  const radius = PILL_HEIGHT / 2;

  g.clear();
  g.roundRect(-pillWidth / 2, -PILL_HEIGHT / 2, pillWidth, totalHeight, radius);
  g.fill({ color: 0x000000, alpha: 0.35 });
  g.roundRect(-pillWidth / 2, -PILL_HEIGHT / 2, pillWidth, totalHeight, radius);
  g.stroke({ width: 1, color: THEME.colors.accent.gold, alpha: 0.4 });
}

/** Compute text configs for the arrow and player name. */
export function turnTextConfigs(
  seat: Seat,
  playerName: string,
): {
  arrow: { text: string; fontSize: number; fill: string };
  name: { text: string; fontSize: number; fill: string };
} {
  return {
    arrow: {
      text: arrowForSeat(seat),
      fontSize: THEME.typography.heading.minSize,
      fill: THEME.colors.accent.gold,
    },
    name: {
      text: playerName,
      fontSize: THEME.typography.label.minSize,
      fill: THEME.colors.accent.gold,
    },
  };
}

// ---- Component ------------------------------------------------------

export function TurnIndicatorReact({ seat, playerName }: TurnIndicatorProps): React.JSX.Element {
  const configs = turnTextConfigs(seat, playerName);
  const pillWidth = MIN_TEXT_WIDTH + PILL_PADDING_X * 2;
  const totalHeight = PILL_HEIGHT + THEME.typography.label.minSize + THEME.spacing.xs;

  return (
    <pixiContainer label="turn-indicator">
      <pixiGraphics
        label="turn-bg"
        draw={(g: Graphics) => {
          drawTurnPill(g, pillWidth, totalHeight);
        }}
      />
      <pixiText
        label="turn-arrow"
        text={configs.arrow.text}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: configs.arrow.fontSize,
          fontWeight: "bold",
          fill: configs.arrow.fill,
        }}
        anchor={0.5}
      />
      <pixiText
        label="turn-name"
        text={configs.name.text}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: configs.name.fontSize,
          fontWeight: THEME.typography.playerName.fontWeight,
          fill: configs.name.fill,
        }}
        anchor={{ x: 0.5, y: 0 }}
        y={THEME.typography.heading.minSize / 2 + THEME.spacing.xs}
      />
    </pixiContainer>
  );
}
