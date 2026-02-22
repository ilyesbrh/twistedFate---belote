// ====================================================================
// TrumpIndicator — PixiJS Container showing current trump suit badge.
// Placed in the center zone.
// Verified visually in Storybook.
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
import { DropShadowFilter } from "pixi-filters";
import type { Suit } from "@belote/core";
import { THEME } from "../../theme.js";
import { suitSymbol, suitColor } from "../../card-textures.js";

// ---- TrumpIndicator -------------------------------------------------

export class TrumpIndicator extends Container {
  private readonly suitText: Text;
  private readonly bg: Graphics;

  constructor(suit: Suit) {
    super();
    this.label = "trump-indicator";

    const { badgeSize, badgeRadius, borderWidth, borderColor } = THEME.indicators;
    const half = badgeSize / 2;

    // Background badge
    this.bg = new Graphics();
    this.bg.roundRect(-half, -half, badgeSize, badgeSize, badgeRadius);
    this.bg.fill(THEME.colors.ui.overlay);
    this.bg.roundRect(-half, -half, badgeSize, badgeSize, badgeRadius);
    this.bg.stroke({ width: borderWidth, color: borderColor });
    this.bg.label = "trump-bg";
    this.addChild(this.bg);

    // Suit symbol
    this.suitText = new Text({
      text: suitSymbol(suit),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.indicators.suitFontSize,
        fill: suitColor(suit),
      },
    });
    this.suitText.label = "trump-suit";
    this.suitText.anchor.set(0.5);
    this.addChild(this.suitText);

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
  }

  setSuit(suit: Suit): void {
    this.suitText.text = suitSymbol(suit);
    this.suitText.style.fill = suitColor(suit);
  }
}
