// ====================================================================
// HandDisplay — PixiJS Container that renders a fan of CardSprites.
// Consumes layout output from hand-layout.ts.
// Verified visually in Storybook (no canvas in unit tests).
// ====================================================================

import { Container } from "pixi.js";
import type { Suit, Rank } from "@belote/core";
import type { Rect } from "../../layout.js";
import type { CardTextureAtlas } from "../../card-textures.js";
import { CardSprite } from "../../card-sprite.js";
import { computeHandLayout } from "./hand-layout.js";

// ---- Types ----------------------------------------------------------

export interface HandCard {
  readonly suit: Suit;
  readonly rank: Rank;
}

// ---- HandDisplay ----------------------------------------------------

export class HandDisplay extends Container {
  private readonly atlas: CardTextureAtlas;
  private cardSprites: CardSprite[] = [];

  constructor(atlas: CardTextureAtlas) {
    super();
    this.label = "hand-display";
    this.atlas = atlas;
  }

  /**
   * Update the hand with new cards and zone dimensions.
   * Removes old sprites and creates new ones at computed positions.
   */
  update(zone: Rect, cards: readonly HandCard[]): void {
    // Remove existing card sprites
    for (const sprite of this.cardSprites) {
      this.removeChild(sprite);
      sprite.destroy();
    }
    this.cardSprites = [];

    // Compute layout
    const layout = computeHandLayout(zone, cards.length);

    // Create and position card sprites — layout guarantees cards.length === layout.cards.length
    for (const [i, card] of cards.entries()) {
      const pos = layout.cards[i];
      if (!pos) continue;

      const sprite = new CardSprite(this.atlas, card.suit, card.rank);
      sprite.setFaceUp(true);
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.rotation = pos.rotation;

      // Scale card sprite to match computed dimensions
      const scaleX = layout.cardWidth / sprite.width;
      const scaleY = layout.cardHeight / sprite.height;
      sprite.scale.set(scaleX * pos.scale, scaleY * pos.scale);

      this.cardSprites.push(sprite);
      this.addChild(sprite);
    }
  }

  /** Get all current card sprites (for interaction handling). */
  getCardSprites(): readonly CardSprite[] {
    return this.cardSprites;
  }
}
