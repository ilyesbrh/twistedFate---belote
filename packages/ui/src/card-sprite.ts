// ====================================================================
// CardSprite — PixiJS display object for a single playing card.
// Pure helper functions are unit-tested. The CardSprite class is
// canvas-dependent and verified via the dev harness card-gallery scene.
// ====================================================================

import { Container, Sprite } from "pixi.js";
import { DropShadowFilter } from "pixi-filters";
import type { Suit, Rank } from "@belote/core";
import type { CardTextureAtlas } from "./card-textures.js";
import { THEME } from "./theme.js";

// ---- Pure functions (unit-tested) ------------------------------------

export function cardLabel(suit: Suit, rank: Rank): string {
  return `card-${suit}-${rank}`;
}

export const CARD_BACK_LABEL = "card-back";

// ---- CardSprite (canvas-dependent) -----------------------------------

export class CardSprite extends Container {
  readonly suit: Suit;
  readonly rank: Rank;

  private readonly faceSprite: Sprite;
  private readonly backSprite: Sprite;
  private _faceUp: boolean;

  constructor(atlas: CardTextureAtlas, suit: Suit, rank: Rank) {
    super();

    this.suit = suit;
    this.rank = rank;
    this.label = cardLabel(suit, rank);

    this.faceSprite = new Sprite(atlas.getTexture(suit, rank));
    this.faceSprite.label = "face";
    this.faceSprite.anchor.set(0.5);

    this.backSprite = new Sprite(atlas.getBackTexture());
    this.backSprite.label = "back";
    this.backSprite.anchor.set(0.5);

    this.addChild(this.faceSprite);
    this.addChild(this.backSprite);

    // Drop shadow
    const shadow = THEME.shadows.card;
    this.filters = [
      new DropShadowFilter({
        color: shadow.color,
        alpha: shadow.alpha,
        blur: shadow.blur,
        offset: { x: shadow.offsetX, y: shadow.offsetY },
      }),
    ];

    // Default: face-down
    this._faceUp = false;
    this.faceSprite.visible = false;
    this.backSprite.visible = true;
  }

  get faceUp(): boolean {
    return this._faceUp;
  }

  setFaceUp(faceUp: boolean): void {
    this._faceUp = faceUp;
    this.faceSprite.visible = faceUp;
    this.backSprite.visible = !faceUp;
  }
}
