// ====================================================================
// TurnIndicator — PixiJS Container showing which player's turn it is.
// Displays a text label + directional arrow.
// Placed in the center zone below the trick area.
// Verified visually in Storybook.
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
import type { Seat } from "../../layout.js";
import { THEME } from "../../theme.js";

// ---- Types ----------------------------------------------------------

export type TurnSeat = Seat;

// ---- Constants ------------------------------------------------------

const ARROWS: Record<TurnSeat, string> = {
  south: "\u2193",
  north: "\u2191",
  west: "\u2190",
  east: "\u2192",
};

const PILL_HEIGHT = 28;
const PILL_PADDING_X = 14;

// ---- TurnIndicator --------------------------------------------------

export class TurnIndicator extends Container {
  private readonly arrowText: Text;
  private readonly nameText: Text;
  private readonly pillBg: Graphics;

  constructor(seat: TurnSeat, playerName: string) {
    super();
    this.label = "turn-indicator";

    // Pill-shaped background
    this.pillBg = new Graphics();
    this.pillBg.label = "turn-bg";
    this.addChild(this.pillBg);

    // Arrow
    this.arrowText = new Text({
      text: ARROWS[seat],
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.heading.minSize,
        fontWeight: "bold",
        fill: THEME.colors.accent.gold,
      },
    });
    this.arrowText.label = "turn-arrow";
    this.arrowText.anchor.set(0.5);
    this.addChild(this.arrowText);

    // Player name
    this.nameText = new Text({
      text: playerName,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.label.minSize,
        fontWeight: THEME.typography.playerName.fontWeight,
        fill: THEME.colors.accent.gold,
      },
    });
    this.nameText.label = "turn-name";
    this.nameText.anchor.set(0.5, 0);
    this.nameText.y = THEME.typography.heading.minSize / 2 + THEME.spacing.xs;
    this.addChild(this.nameText);

    this.drawPill();
  }

  setTurn(seat: TurnSeat, playerName: string): void {
    this.arrowText.text = ARROWS[seat];
    this.nameText.text = playerName;
    this.drawPill();
  }

  private drawPill(): void {
    const totalHeight = PILL_HEIGHT + THEME.typography.label.minSize + THEME.spacing.xs;
    const textWidth = Math.max(this.nameText.width, 60);
    const pillWidth = textWidth + PILL_PADDING_X * 2;

    this.pillBg.clear();
    this.pillBg.roundRect(
      -pillWidth / 2,
      -PILL_HEIGHT / 2,
      pillWidth,
      totalHeight,
      PILL_HEIGHT / 2,
    );
    this.pillBg.fill({ color: 0x000000, alpha: 0.35 });
    this.pillBg.roundRect(
      -pillWidth / 2,
      -PILL_HEIGHT / 2,
      pillWidth,
      totalHeight,
      PILL_HEIGHT / 2,
    );
    this.pillBg.stroke({ width: 1, color: THEME.colors.accent.gold, alpha: 0.4 });
  }
}
