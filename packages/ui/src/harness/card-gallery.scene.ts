// ====================================================================
// Scene: Card Gallery
// Displays all 32 Belote cards face-up in a 4×8 grid (one row per suit)
// plus one card-back, for visual verification of the texture atlas.
// ====================================================================

import { Container, Sprite } from "pixi.js";
import type { Application } from "pixi.js";
import { ALL_SUITS, ALL_RANKS } from "@belote/core";
import { THEME } from "../theme.js";
import { createCardTextureAtlas } from "../card-textures.js";
import type { CardTextureAtlas } from "../card-textures.js";
import { CardSprite } from "../card-sprite.js";
import { registerScene } from "./scenes.js";

const COLS = 8; // ranks per row
const ROWS = 4; // suits
const GAP = THEME.spacing.sm;

let atlas: CardTextureAtlas | undefined;

function layoutCards(grid: Container, app: Application): void {
  const { width, height } = app.screen;
  const padding = THEME.spacing.md;

  // Available space (reserve bottom row for card back)
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  // Card size: fit ROWS+1 rows (4 suit rows + 1 card-back row) with gaps
  const totalRows = ROWS + 1;
  const cardWidth = Math.floor((availableWidth - GAP * (COLS - 1)) / COLS);
  const cardHeight = Math.floor((availableHeight - GAP * (totalRows - 1)) / totalRows);

  // Use the smaller dimension to maintain aspect ratio
  const aspectRatio = THEME.cardDimensions.aspectRatio;
  const widthFromHeight = Math.floor(cardHeight * aspectRatio);
  const heightFromWidth = Math.floor(cardWidth / aspectRatio);

  const finalWidth = Math.min(cardWidth, widthFromHeight);
  const finalHeight = Math.min(cardHeight, heightFromWidth);

  let childIndex = 0;
  for (let row = 0; row < totalRows; row++) {
    const colsInRow = row < ROWS ? COLS : 1; // last row has just the card back
    for (let col = 0; col < colsInRow; col++) {
      const child = grid.children[childIndex];
      if (!child) continue;
      child.x = padding + col * (finalWidth + GAP) + finalWidth / 2;
      child.y = padding + row * (finalHeight + GAP) + finalHeight / 2;
      child.width = finalWidth;
      child.height = finalHeight;
      childIndex++;
    }
  }
}

function createCardGallery(app: Application): void {
  atlas = createCardTextureAtlas(app);

  const grid = new Container();
  grid.label = "card-gallery-grid";

  // Add all 32 cards face-up (4 rows × 8 columns)
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      const card = new CardSprite(atlas, suit, rank);
      card.setFaceUp(true);
      grid.addChild(card);
    }
  }

  // Add one card back
  const backSprite = new Sprite(atlas.getBackTexture());
  backSprite.label = "card-back-sample";
  backSprite.anchor.set(0.5);
  grid.addChild(backSprite);

  app.stage.addChild(grid);
  layoutCards(grid, app);

  app.renderer.on("resize", () => {
    layoutCards(grid, app);
  });
}

registerScene({
  name: "Card Gallery",
  create: createCardGallery,
  destroy(): void {
    if (atlas) {
      atlas.destroy();
      atlas = undefined;
    }
  },
});
