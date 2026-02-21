// ====================================================================
// TrumpIndicator — PixiJS Container showing current trump suit badge.
// Placed in the center zone.
// Verified visually in Storybook.
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
import type { Suit } from "@belote/core";
import { THEME } from "../../theme.js";
import { suitSymbol, suitColor } from "../../card-textures.js";

// ---- Constants ------------------------------------------------------

const BADGE_SIZE = 32;
const BADGE_RADIUS = 6;

// ---- TrumpIndicator -------------------------------------------------

export class TrumpIndicator extends Container {
  private readonly suitText: Text;
  private readonly bg: Graphics;

  constructor(suit: Suit) {
    super();
    this.label = "trump-indicator";

    // Background badge
    this.bg = new Graphics();
    this.bg.roundRect(-BADGE_SIZE / 2, -BADGE_SIZE / 2, BADGE_SIZE, BADGE_SIZE, BADGE_RADIUS);
    this.bg.fill(THEME.colors.ui.overlayLight);
    this.bg.label = "trump-bg";
    this.addChild(this.bg);

    // Suit symbol
    this.suitText = new Text({
      text: suitSymbol(suit),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.heading.minSize,
        fill: suitColor(suit),
      },
    });
    this.suitText.label = "trump-suit";
    this.suitText.anchor.set(0.5);
    this.addChild(this.suitText);
  }

  setSuit(suit: Suit): void {
    this.suitText.text = suitSymbol(suit);
    this.suitText.style.fill = suitColor(suit);
  }
}
