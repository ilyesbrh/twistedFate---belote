// ====================================================================
// BiddingPanel — PixiJS Container overlay with suit + pass buttons.
// Shown during bidding phase, hidden during play.
// Consumes layout output from bidding-layout.ts.
// Verified visually in Storybook.
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
import type { Suit } from "@belote/core";
import { ALL_SUITS } from "@belote/core";
import type { Rect } from "../../layout.js";
import { THEME } from "../../theme.js";
import { suitSymbol, suitColor } from "../../card-textures.js";
import { computeBiddingLayout } from "./bidding-layout.js";

// ---- Constants ------------------------------------------------------

const BUTTON_RADIUS = 6;

// ---- BiddingPanel ---------------------------------------------------

export class BiddingPanel extends Container {
  private suitButtonContainers: Container[] = [];
  private passButtonContainer: Container | undefined = undefined;

  constructor() {
    super();
    this.label = "bidding-panel";
  }

  /**
   * Update the bidding panel with new zone dimensions.
   * Recreates all buttons at computed positions.
   */
  update(zone: Rect): void {
    // Destroy existing buttons to prevent memory leaks
    for (const btn of this.suitButtonContainers) {
      this.removeChild(btn);
      btn.destroy({ children: true });
    }
    if (this.passButtonContainer) {
      this.removeChild(this.passButtonContainer);
      this.passButtonContainer.destroy({ children: true });
    }
    this.suitButtonContainers = [];
    this.passButtonContainer = undefined;

    // Compute layout
    const layout = computeBiddingLayout(zone);

    // Create suit buttons
    for (const [i, suit] of ALL_SUITS.entries()) {
      const btnRect = layout.suitButtons[i];
      if (!btnRect) continue;

      const btn = this.createButton(
        btnRect.x,
        btnRect.y,
        btnRect.width,
        btnRect.height,
        suitSymbol(suit),
        suitColor(suit),
        `bid-${suit}`,
      );
      this.suitButtonContainers.push(btn);
      this.addChild(btn);
    }

    // Create pass button
    const passRect = layout.passButton;
    this.passButtonContainer = this.createButton(
      passRect.x,
      passRect.y,
      passRect.width,
      passRect.height,
      "Pass",
      THEME.colors.text.muted,
      "bid-pass",
    );
    this.addChild(this.passButtonContainer);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    textColor: string,
    buttonLabel: string,
  ): Container {
    const container = new Container();
    container.label = buttonLabel;
    container.x = x;
    container.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, BUTTON_RADIUS);
    bg.fill(THEME.colors.ui.overlayLight);
    bg.label = "button-bg";
    container.addChild(bg);

    const label = new Text({
      text,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.heading.minSize,
        fill: textColor,
      },
    });
    label.label = "button-text";
    label.anchor.set(0.5);
    label.x = width / 2;
    label.y = height / 2;
    container.addChild(label);

    return container;
  }

  getSuitButton(suit: Suit): Container | undefined {
    const index = ALL_SUITS.indexOf(suit);
    return this.suitButtonContainers[index];
  }

  getPassButton(): Container | undefined {
    return this.passButtonContainer;
  }
}
