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

const BUTTON_RADIUS = 10;

const SUIT_NAMES: Record<Suit, string> = {
  hearts: "Hearts",
  diamonds: "Diamonds",
  clubs: "Clubs",
  spades: "Spades",
};

// ---- BiddingPanel ---------------------------------------------------

export class BiddingPanel extends Container {
  private suitButtonContainers: Container[] = [];
  private passButtonContainer: Container | undefined = undefined;
  private suitBidCallback: ((suit: Suit) => void) | null = null;
  private passCallback: (() => void) | null = null;

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

      const btn = this.createSuitButton(
        btnRect.x,
        btnRect.y,
        btnRect.width,
        btnRect.height,
        suit,
        `bid-${suit}`,
      );
      this.suitButtonContainers.push(btn);
      this.addChild(btn);
    }

    // Create pass button
    const passRect = layout.passButton;
    this.passButtonContainer = this.createPassButton(
      passRect.x,
      passRect.y,
      passRect.width,
      passRect.height,
    );
    this.addChild(this.passButtonContainer);

    this.applyButtonInteraction();
  }

  /** Register a callback for when a suit button is tapped. */
  onSuitBid(callback: (suit: Suit) => void): void {
    this.suitBidCallback = callback;
    this.applyButtonInteraction();
  }

  /** Register a callback for when the pass button is tapped. */
  onPass(callback: () => void): void {
    this.passCallback = callback;
    this.applyButtonInteraction();
  }

  private createSuitButton(
    x: number,
    y: number,
    width: number,
    height: number,
    suit: Suit,
    buttonLabel: string,
  ): Container {
    const container = new Container();
    container.label = buttonLabel;
    container.x = x;
    container.y = y;

    // Dark semi-transparent background with gold border
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, BUTTON_RADIUS);
    bg.fill({ color: 0x000000, alpha: 0.5 });
    bg.roundRect(0, 0, width, height, BUTTON_RADIUS);
    bg.stroke({ width: 2, color: THEME.colors.accent.gold, alpha: 0.6 });
    bg.label = "button-bg";
    container.addChild(bg);

    // Large suit symbol
    const symbol = new Text({
      text: suitSymbol(suit),
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.indicators.suitFontSize,
        fill: suitColor(suit),
      },
    });
    symbol.label = "button-suit";
    symbol.anchor.set(0.5);
    symbol.x = width / 2;
    symbol.y = height / 2 - 8;
    container.addChild(symbol);

    // Suit name label below symbol
    const nameLabel = new Text({
      text: SUIT_NAMES[suit],
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.label.minSize,
        fill: THEME.colors.text.light,
      },
    });
    nameLabel.label = "button-name";
    nameLabel.anchor.set(0.5);
    nameLabel.x = width / 2;
    nameLabel.y = height / 2 + 14;
    container.addChild(nameLabel);

    return container;
  }

  private createPassButton(x: number, y: number, width: number, height: number): Container {
    const container = new Container();
    container.label = "bid-pass";
    container.x = x;
    container.y = y;

    // Subtler background for pass button
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, BUTTON_RADIUS);
    bg.fill({ color: 0x000000, alpha: 0.3 });
    bg.roundRect(0, 0, width, height, BUTTON_RADIUS);
    bg.stroke({ width: 1, color: THEME.colors.text.muted, alpha: 0.4 });
    bg.label = "button-bg";
    container.addChild(bg);

    // "Pass" text — white, centered
    const label = new Text({
      text: "Pass",
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.heading.minSize,
        fill: THEME.colors.text.light,
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

  private applyButtonInteraction(): void {
    for (const [i, container] of this.suitButtonContainers.entries()) {
      container.eventMode = "static";
      container.cursor = "pointer";
      container.removeAllListeners("pointerdown");
      container.on("pointerdown", () => {
        const suit = ALL_SUITS[i];
        if (suit && this.suitBidCallback) {
          this.suitBidCallback(suit);
        }
      });
    }

    if (this.passButtonContainer) {
      this.passButtonContainer.eventMode = "static";
      this.passButtonContainer.cursor = "pointer";
      this.passButtonContainer.removeAllListeners("pointerdown");
      this.passButtonContainer.on("pointerdown", () => {
        this.passCallback?.();
      });
    }
  }
}
