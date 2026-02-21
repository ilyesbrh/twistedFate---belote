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

// Card face internal layout (proportional to CARD_WIDTH × CARD_HEIGHT)
const INDEX_OFFSET_X = THEME.spacing.xs + 2; // 6px — inset from card edge
const RANK_OFFSET_Y = THEME.spacing.xs; // 4px
const SUIT_SMALL_OFFSET_Y = RANK_OFFSET_Y + THEME.typography.cardIndex.minSize + 2; // below rank text

// Card back internal layout
const BACK_BORDER_INSET = THEME.spacing.xs + 2; // 6px
const BACK_BORDER_RADIUS = CORNER_RADIUS - 2;
const DIAMOND_HALF_WIDTH = 16;
const DIAMOND_HALF_HEIGHT = 22;

export function createCardFaceGraphics(suit: Suit, rank: Rank): Container {
  const container = new Container();

  // Card background
  const bg = new Graphics();
  bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
  bg.fill(THEME.colors.card.face);
  bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
  bg.stroke({ width: 1, color: THEME.colors.card.border });
  container.addChild(bg);

  const color = suitColor(suit);
  const symbol = suitSymbol(suit);
  const display = rankDisplay(rank);

  // Top-left rank
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

  // Top-left suit symbol (below rank)
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

  // Center suit symbol (large)
  const centerSuit = new Text({
    text: symbol,
    style: {
      fontFamily: THEME.typography.fontFamily,
      fontSize: THEME.typography.cardCenter.minSize,
      fontWeight: THEME.typography.cardCenter.fontWeight,
      fill: color,
    },
  });
  centerSuit.anchor.set(0.5);
  centerSuit.x = CARD_WIDTH / 2;
  centerSuit.y = CARD_HEIGHT / 2;
  container.addChild(centerSuit);

  return container;
}

export function createCardBackGraphics(): Container {
  const container = new Container();

  // Card background
  const bg = new Graphics();
  bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
  bg.fill(THEME.colors.card.back);
  container.addChild(bg);

  // Inner border pattern
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

  // Center diamond shape
  const diamond = new Graphics();
  const cx = CARD_WIDTH / 2;
  const cy = CARD_HEIGHT / 2;
  diamond.moveTo(cx, cy - DIAMOND_HALF_HEIGHT);
  diamond.lineTo(cx + DIAMOND_HALF_WIDTH, cy);
  diamond.lineTo(cx, cy + DIAMOND_HALF_HEIGHT);
  diamond.lineTo(cx - DIAMOND_HALF_WIDTH, cy);
  diamond.closePath();
  diamond.fill(THEME.colors.accent.gold);
  container.addChild(diamond);

  return container;
}

export function createCardTextureAtlas(app: Application): CardTextureAtlas {
  const textures = new Map<string, Texture>();

  // Generate face textures for all 32 cards
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      const container = createCardFaceGraphics(suit, rank);
      const texture = app.renderer.generateTexture(container);
      textures.set(cardKey(suit, rank), texture);
      container.destroy({ children: true });
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
