// ====================================================================
// Card texture generation — pure lookup functions + programmatic atlas.
// Pure functions are unit-tested. Graphics and atlas creation are
// canvas-dependent, verified via Storybook stories and dev harness.
// ====================================================================

import { Container, Graphics, Text } from "pixi.js";
import type { Application, Texture } from "pixi.js";
import type { Suit, Rank } from "@belote/core";
import { ALL_SUITS, ALL_RANKS } from "@belote/core";
import { THEME } from "./theme.js";
import { pipPositions } from "./pip-layout.js";

// ---- Pure functions (unit-tested) ------------------------------------

const SUIT_SYMBOLS: Readonly<Record<Suit, string>> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_COLORS: Readonly<Record<Suit, string>> = {
  hearts: THEME.colors.suit.red,
  diamonds: THEME.colors.suit.red,
  clubs: THEME.colors.suit.black,
  spades: THEME.colors.suit.black,
};

const RANK_DISPLAY: Readonly<Record<Rank, string>> = {
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  jack: "J",
  queen: "Q",
  king: "K",
  ace: "A",
};

export function cardKey(suit: Suit, rank: Rank): string {
  return `${suit}-${rank}`;
}

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function suitColor(suit: Suit): string {
  return SUIT_COLORS[suit];
}

export function rankDisplay(rank: Rank): string {
  return RANK_DISPLAY[rank];
}

export const CARD_BACK_KEY = "card-back";

export const ALL_CARD_KEYS: readonly string[] = Object.freeze(
  ALL_SUITS.flatMap((suit) => ALL_RANKS.map((rank) => cardKey(suit, rank))),
);

// ---- CardTextureAtlas (canvas-dependent) -----------------------------

export interface CardTextureAtlas {
  readonly getTexture: (suit: Suit, rank: Rank) => Texture;
  readonly getBackTexture: () => Texture;
  readonly destroy: () => void;
}

// Card texture dimensions (pixels at 1x scale)
const CARD_WIDTH = 100;
const CARD_HEIGHT = Math.round(CARD_WIDTH / THEME.cardDimensions.aspectRatio);
const CORNER_RADIUS = THEME.spacing.sm; // 8px

// Card face layout constants
const INDEX_OFFSET_X = 6;
const RANK_OFFSET_Y = 4;
const SUIT_SMALL_OFFSET_Y = RANK_OFFSET_Y + THEME.typography.cardIndex.minSize + 1;

// Pip area: the region between the corner indices
const PIP_AREA_LEFT = 15;
const PIP_AREA_RIGHT = CARD_WIDTH - 15;
const PIP_AREA_TOP = 25;
const PIP_AREA_BOTTOM = CARD_HEIGHT - 25;

// Card back layout
const BACK_BORDER_INSET = 6;
const BACK_BORDER_RADIUS = CORNER_RADIUS - 2;

// Face cards: ranks that get a large center letter instead of pips
const FACE_RANKS: ReadonlySet<Rank> = new Set(["jack", "queen", "king"]);

// ---- createCardFaceGraphics -----------------------------------------

export function createCardFaceGraphics(suit: Suit, rank: Rank): Container {
  const container = new Container();
  const color = suitColor(suit);
  const symbol = suitSymbol(suit);
  const display = rankDisplay(rank);

  // 1. White background + border
  const bg = new Graphics();
  bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
  bg.fill(THEME.colors.card.face);
  bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
  bg.stroke({ width: THEME.cardDesign.borderWidth, color: THEME.colors.card.border });
  container.addChild(bg);

  // 2. Top-left corner index: rank + suit
  const topRank = new Text({
    text: display,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.cardIndex.minSize,
      fontWeight: THEME.typography.cardIndex.fontWeight,
      fill: color,
    },
  });
  topRank.x = INDEX_OFFSET_X;
  topRank.y = RANK_OFFSET_Y;
  container.addChild(topRank);

  const topSuit = new Text({
    text: symbol,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.cardSuitSmall.minSize,
      fontWeight: THEME.typography.cardSuitSmall.fontWeight,
      fill: color,
    },
  });
  topSuit.x = INDEX_OFFSET_X;
  topSuit.y = SUIT_SMALL_OFFSET_Y;
  container.addChild(topSuit);

  // 3. Bottom-right corner index: rank + suit (rotated 180°)
  const bottomIndex = new Container();
  const botRank = new Text({
    text: display,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.cardIndex.minSize,
      fontWeight: THEME.typography.cardIndex.fontWeight,
      fill: color,
    },
  });
  botRank.x = INDEX_OFFSET_X;
  botRank.y = RANK_OFFSET_Y;
  bottomIndex.addChild(botRank);

  const botSuit = new Text({
    text: symbol,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.cardSuitSmall.minSize,
      fontWeight: THEME.typography.cardSuitSmall.fontWeight,
      fill: color,
    },
  });
  botSuit.x = INDEX_OFFSET_X;
  botSuit.y = SUIT_SMALL_OFFSET_Y;
  bottomIndex.addChild(botSuit);

  // Rotate 180° around card center — positions the bottom-right index
  bottomIndex.pivot.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
  bottomIndex.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
  bottomIndex.rotation = Math.PI;
  container.addChild(bottomIndex);

  // 4. Center content — depends on rank type
  const pips = pipPositions(rank);

  if (pips.length > 0) {
    // Number cards (7–10): render pip symbols
    const areaW = PIP_AREA_RIGHT - PIP_AREA_LEFT;
    const areaH = PIP_AREA_BOTTOM - PIP_AREA_TOP;

    for (const pip of pips) {
      const pipText = new Text({
        text: symbol,
        style: {
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.cardPip.minSize,
          fontWeight: THEME.typography.cardPip.fontWeight,
          fill: color,
        },
      });
      pipText.anchor.set(0.5);
      pipText.x = PIP_AREA_LEFT + pip.x * areaW;
      pipText.y = PIP_AREA_TOP + pip.y * areaH;
      if (pip.inverted) {
        pipText.rotation = Math.PI;
      }
      container.addChild(pipText);
    }
  } else if (FACE_RANKS.has(rank)) {
    // Face cards (J/Q/K): large bold letter + decorative frame
    const frame = new Graphics();
    const frameInset = 18;
    frame.roundRect(
      frameInset,
      frameInset,
      CARD_WIDTH - frameInset * 2,
      CARD_HEIGHT - frameInset * 2,
      4,
    );
    frame.stroke({ width: 1.5, color, alpha: 0.3 });
    container.addChild(frame);

    const faceLetter = new Text({
      text: display,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.cardFaceLetter.minSize,
        fontWeight: THEME.typography.cardFaceLetter.fontWeight,
        fill: color,
      },
    });
    faceLetter.anchor.set(0.5);
    faceLetter.x = CARD_WIDTH / 2;
    faceLetter.y = CARD_HEIGHT / 2;
    container.addChild(faceLetter);
  } else {
    // Ace: single large center suit symbol
    const aceSuit = new Text({
      text: symbol,
      style: {
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.cardCenter.minSize,
        fontWeight: THEME.typography.cardCenter.fontWeight,
        fill: color,
      },
    });
    aceSuit.anchor.set(0.5);
    aceSuit.x = CARD_WIDTH / 2;
    aceSuit.y = CARD_HEIGHT / 2;
    container.addChild(aceSuit);
  }

  return container;
}

// ---- createCardBackGraphics -----------------------------------------

export function createCardBackGraphics(): Container {
  const container = new Container();
  const design = THEME.cardDesign;

  // 1. Blue base fill
  const bg = new Graphics();
  bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
  bg.fill(THEME.colors.card.back);
  container.addChild(bg);

  // 2. Checkered/gingham pattern inside the inner border area
  const checkerSize = design.backCheckerSize;
  const inset = BACK_BORDER_INSET + 2; // slightly inside inner border
  const checkerW = CARD_WIDTH - inset * 2;
  const checkerH = CARD_HEIGHT - inset * 2;
  const cols = Math.ceil(checkerW / checkerSize);
  const rows = Math.ceil(checkerH / checkerSize);

  const checker = new Graphics();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((row + col) % 2 === 0) {
        const rx = inset + col * checkerSize;
        const ry = inset + row * checkerSize;
        const rw = Math.min(checkerSize, inset + checkerW - rx);
        const rh = Math.min(checkerSize, inset + checkerH - ry);
        checker.rect(rx, ry, rw, rh);
      }
    }
  }
  checker.fill(design.backCheckerColor);

  // White squares (the other half of the checker)
  const checkerWhite = new Graphics();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((row + col) % 2 === 1) {
        const rx = inset + col * checkerSize;
        const ry = inset + row * checkerSize;
        const rw = Math.min(checkerSize, inset + checkerW - rx);
        const rh = Math.min(checkerSize, inset + checkerH - ry);
        checkerWhite.rect(rx, ry, rw, rh);
      }
    }
  }
  checkerWhite.fill("#FFFFFF");

  container.addChild(checkerWhite);
  container.addChild(checker);

  // 3. Outer border
  const outer = new Graphics();
  outer.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
  outer.stroke({
    width: design.borderWidth,
    color: THEME.colors.accent.gold,
    alpha: 0.8,
  });
  container.addChild(outer);

  // 4. Inner border
  const inner = new Graphics();
  inner.roundRect(
    BACK_BORDER_INSET,
    BACK_BORDER_INSET,
    CARD_WIDTH - BACK_BORDER_INSET * 2,
    CARD_HEIGHT - BACK_BORDER_INSET * 2,
    BACK_BORDER_RADIUS,
  );
  inner.stroke({ width: 2, color: THEME.colors.accent.gold });
  container.addChild(inner);

  return container;
}

// ---- CardTextureAtlas -----------------------------------------------

export function createCardTextureAtlas(app: Application): CardTextureAtlas {
  const textures = new Map<string, Texture>();

  // Generate face textures for all 32 cards
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      const c = createCardFaceGraphics(suit, rank);
      const texture = app.renderer.generateTexture(c);
      textures.set(cardKey(suit, rank), texture);
      c.destroy({ children: true });
    }
  }

  // Generate card back texture
  const backContainer = createCardBackGraphics();
  const backTexture = app.renderer.generateTexture(backContainer);
  textures.set(CARD_BACK_KEY, backTexture);
  backContainer.destroy({ children: true });

  return Object.freeze({
    getTexture(suit: Suit, rank: Rank): Texture {
      const key = cardKey(suit, rank);
      const texture = textures.get(key);
      if (!texture) {
        throw new Error(`No texture found for card: ${key}`);
      }
      return texture;
    },

    getBackTexture(): Texture {
      const texture = textures.get(CARD_BACK_KEY);
      if (!texture) {
        throw new Error("No card back texture found");
      }
      return texture;
    },

    destroy(): void {
      for (const texture of textures.values()) {
        texture.destroy(true);
      }
      textures.clear();
    },
  });
}
