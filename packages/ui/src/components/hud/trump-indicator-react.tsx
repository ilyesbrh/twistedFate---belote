// ====================================================================
// TrumpIndicatorReact — React functional component for trump suit badge.
// Coexists with imperative trump-indicator.ts during migration.
// ====================================================================

import type { Graphics } from "pixi.js";
import type { Suit } from "@belote/core";
import { THEME } from "../../theme.js";
import { suitSymbol, suitColor } from "../../card-textures.js";

// ---- Props ----------------------------------------------------------

export interface TrumpIndicatorProps {
  suit: Suit;
}

// ---- Extracted helpers (unit-tested) --------------------------------

/** Draw the rounded-rect badge background. Stable reference — no props dependency. */
export function drawTrumpBadge(g: Graphics): void {
  const { badgeSize, badgeRadius, borderWidth, borderColor } = THEME.indicators;
  const half = badgeSize / 2;

  g.clear();
  g.roundRect(-half, -half, badgeSize, badgeSize, badgeRadius);
  g.fill(THEME.colors.ui.overlay);
  g.roundRect(-half, -half, badgeSize, badgeSize, badgeRadius);
  g.stroke({ width: borderWidth, color: borderColor });
}

/** Compute the text content and fill color for a given suit. */
export function trumpTextConfig(suit: Suit): { text: string; fill: string } {
  return {
    text: suitSymbol(suit),
    fill: suitColor(suit),
  };
}

// ---- Component ------------------------------------------------------

export function TrumpIndicatorReact({ suit }: TrumpIndicatorProps): React.JSX.Element {
  const config = trumpTextConfig(suit);

  return (
    <pixiContainer label="trump-indicator">
      <pixiGraphics label="trump-bg" draw={drawTrumpBadge} />
      <pixiText
        label="trump-suit"
        text={config.text}
        style={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.indicators.suitFontSize,
          fill: config.fill,
        }}
        anchor={0.5}
      />
    </pixiContainer>
  );
}
