// ====================================================================
// OpponentHand — PixiJS Container that renders face-down card stacks.
// Consumes layout output from opponent-layout.ts.
// Verified visually in Storybook (no canvas in unit tests).
// ====================================================================

import { Container } from "pixi.js";
import type { Rect } from "../../layout.js";
import type { CardTextureAtlas } from "../../card-textures.js";
import { CardSprite } from "../../card-sprite.js";
import { computeOpponentLayout } from "./opponent-layout.js";
import type { OpponentOrientation } from "./opponent-layout.js";

// ---- OpponentHand ---------------------------------------------------

export class OpponentHand extends Container {
  private readonly atlas: CardTextureAtlas;
  private readonly orientation: OpponentOrientation;
  private cardSprites: CardSprite[] = [];

  constructor(atlas: CardTextureAtlas, orientation: OpponentOrientation) {
    super();
    this.label = `opponent-hand-${orientation}`;
    this.atlas = atlas;
    this.orientation = orientation;
  }

  /**
   * Update the opponent hand with a card count and zone dimensions.
   * Cards are always face-down. Uses a dummy suit/rank since back is shown.
   */
  update(zone: Rect, cardCount: number): void {
    // Remove existing card sprites
    for (const sprite of this.cardSprites) {
      this.removeChild(sprite);
      sprite.destroy();
    }
    this.cardSprites = [];

    // Compute layout
    const layout = computeOpponentLayout(zone, cardCount, this.orientation);

    // Create and position face-down card sprites
    for (const pos of layout.cards) {
      const sprite = new CardSprite(this.atlas, "spades", "7");
      // Keep face-down (default)
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

  getCardCount(): number {
    return this.cardSprites.length;
  }
}
