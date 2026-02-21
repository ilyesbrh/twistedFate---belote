// ====================================================================
// TrickDisplay — PixiJS Container showing 0–4 played cards at N/S/E/W.
// Consumes layout output from trick-layout.ts.
// Verified visually in Storybook (no canvas in unit tests).
// ====================================================================

import { Container } from "pixi.js";
import type { Suit, Rank } from "@belote/core";
import type { Rect } from "../../layout.js";
import type { CardTextureAtlas } from "../../card-textures.js";
import { CardSprite } from "../../card-sprite.js";
import { computeTrickLayout } from "./trick-layout.js";
import type { TrickPosition } from "./trick-layout.js";

// ---- Types ----------------------------------------------------------

export interface TrickCard {
  readonly position: TrickPosition;
  readonly suit: Suit;
  readonly rank: Rank;
}

// ---- TrickDisplay ---------------------------------------------------

export class TrickDisplay extends Container {
  private readonly atlas: CardTextureAtlas;
  private cardSprites = new Map<TrickPosition, CardSprite>();

  constructor(atlas: CardTextureAtlas) {
    super();
    this.label = "trick-display";
    this.atlas = atlas;
  }

  /**
   * Update the trick display with played cards.
   * Removes old sprites and creates new ones at computed positions.
   */
  update(zone: Rect, playedCards: readonly TrickCard[]): void {
    // Remove existing card sprites
    for (const sprite of this.cardSprites.values()) {
      this.removeChild(sprite);
      sprite.destroy();
    }
    this.cardSprites.clear();

    // Compute layout
    const layout = computeTrickLayout(zone);

    // Place each played card at its position
    for (const card of playedCards) {
      const slot = layout.slots[card.position];

      const sprite = new CardSprite(this.atlas, card.suit, card.rank);
      sprite.setFaceUp(true);
      sprite.x = slot.x;
      sprite.y = slot.y;
      sprite.rotation = slot.rotation;

      // Scale card sprite to match computed dimensions
      const scaleX = layout.cardWidth / sprite.width;
      const scaleY = layout.cardHeight / sprite.height;
      sprite.scale.set(scaleX, scaleY);

      this.cardSprites.set(card.position, sprite);
      this.addChild(sprite);
    }
  }

  getPlayedCount(): number {
    return this.cardSprites.size;
  }
}
