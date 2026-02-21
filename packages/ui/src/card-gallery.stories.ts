import type { StoryFn, Meta } from "@pixi/storybook-renderer";
import { Container } from "pixi.js";
import { ALL_SUITS, ALL_RANKS } from "@belote/core";
import { THEME } from "./theme.js";
import { createCardFaceGraphics, createCardBackGraphics } from "./card-textures.js";

const meta: Meta = {
  title: "Cards/Gallery",
};

export default meta;

const COLS = 8;
const ROWS = 4;
const GAP = THEME.spacing.sm;

function layoutGrid(grid: Container, width: number, height: number): void {
  const padding = THEME.spacing.md;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const totalRows = ROWS + 1;

  const cellW = Math.floor((availableWidth - GAP * (COLS - 1)) / COLS);
  const cellH = Math.floor((availableHeight - GAP * (totalRows - 1)) / totalRows);

  const aspect = THEME.cardDimensions.aspectRatio;
  const finalW = Math.min(cellW, Math.floor(cellH * aspect));
  const finalH = Math.min(cellH, Math.floor(cellW / aspect));

  let idx = 0;
  for (let row = 0; row < totalRows; row++) {
    const cols = row < ROWS ? COLS : 1;
    for (let col = 0; col < cols; col++) {
      const child = grid.children[idx];
      if (!child) continue;
      child.x = padding + col * (finalW + GAP);
      child.y = padding + row * (finalH + GAP);
      child.width = finalW;
      child.height = finalH;
      idx++;
    }
  }
}

export const Default: StoryFn = () => {
  const grid = new Container();
  grid.label = "card-gallery-grid";

  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      const card = createCardFaceGraphics(suit, rank);
      card.label = `card-${suit}-${rank}`;
      grid.addChild(card);
    }
  }

  const back = createCardBackGraphics();
  back.label = "card-back-sample";
  grid.addChild(back);

  layoutGrid(grid, 800, 600);

  return {
    view: grid,
    resize(w: number, h: number) {
      layoutGrid(grid, w, h);
    },
  };
};
