// ====================================================================
// TurnIndicator — PixiJS Container showing which player's turn it is.
// Displays a text label + directional arrow.
// Placed in the center zone below the trick area.
// Verified visually in Storybook.
// ====================================================================

import { Container, Text } from "pixi.js";
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

// ---- TurnIndicator --------------------------------------------------

export class TurnIndicator extends Container {
  private readonly arrowText: Text;
  private readonly nameText: Text;

  constructor(seat: TurnSeat, playerName: string) {
    super();
    this.label = "turn-indicator";

    // Arrow
    this.arrowText = new Text({
      text: ARROWS[seat],
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.heading.minSize,
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
  }

  setTurn(seat: TurnSeat, playerName: string): void {
    this.arrowText.text = ARROWS[seat];
    this.nameText.text = playerName;
  }
}
