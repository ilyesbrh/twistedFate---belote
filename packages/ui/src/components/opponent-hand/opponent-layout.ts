// ====================================================================
// Opponent layout — pure math for face-down card stack positions.
// Horizontal stacks for top opponent, vertical stacks for side opponents.
// No DOM access. No side effects. Fully unit-testable.
// ====================================================================

import { deepFreeze } from "../../deep-freeze.js";
import { THEME } from "../../theme.js";
import type { Rect } from "../../layout.js";

// ---- Types ----------------------------------------------------------

export type OpponentOrientation = "horizontal" | "vertical";

export interface OpponentCardPosition {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly scale: number;
}

export interface OpponentLayoutResult {
  readonly cards: readonly OpponentCardPosition[];
  readonly cardWidth: number;
  readonly cardHeight: number;
}

// ---- Constants ------------------------------------------------------

/** Fraction of zone dimension used for card size. */
const CARD_SIZE_RATIO = 0.85;

/** Overlap fraction for stacked cards (compact, mostly hidden). */
const STACK_OVERLAP = 0.85;

// ---- Public function ------------------------------------------------

export function computeOpponentLayout(
  zone: Rect,
  cardCount: number,
  orientation: OpponentOrientation,
): OpponentLayoutResult {
  if (cardCount === 0) {
    return deepFreeze({ cards: [], cardWidth: 0, cardHeight: 0 });
  }

  if (orientation === "horizontal") {
    return computeHorizontal(zone, cardCount);
  }
  return computeVertical(zone, cardCount);
}

// ---- Horizontal (top opponent) --------------------------------------

function computeHorizontal(zone: Rect, cardCount: number): OpponentLayoutResult {
  // Card height fits within zone height
  const cardHeight = Math.round(zone.height * CARD_SIZE_RATIO);
  const cardWidth = Math.round(cardHeight * THEME.cardDimensions.aspectRatio);

  // Step between card centers (high overlap for compact stack)
  const desiredStep = cardWidth * (1 - STACK_OVERLAP);
  const maxFanWidth = zone.width - cardWidth;
  const maxStep = cardCount > 1 ? maxFanWidth / (cardCount - 1) : 0;
  const step = Math.min(desiredStep, maxStep);

  // Center the stack horizontally
  const totalWidth = step * (cardCount - 1);
  const startX = zone.x + (zone.width - totalWidth) / 2;
  const centerY = zone.y + zone.height / 2;

  const cards: OpponentCardPosition[] = [];
  for (let i = 0; i < cardCount; i++) {
    cards.push({
      x: startX + i * step,
      y: centerY,
      rotation: 0,
      scale: 1,
    });
  }

  return deepFreeze({ cards, cardWidth, cardHeight });
}

// ---- Vertical (side opponents) --------------------------------------

function computeVertical(zone: Rect, cardCount: number): OpponentLayoutResult {
  // For vertical cards, card height becomes displayed width after 90° rotation.
  // Size the card so the rotated height fits within zone width.
  const cardHeight = Math.round(zone.width * CARD_SIZE_RATIO);
  const cardWidth = Math.round(cardHeight * THEME.cardDimensions.aspectRatio);

  // Step between card centers along the vertical axis
  // After rotation, displayed height = cardWidth
  const desiredStep = cardWidth * (1 - STACK_OVERLAP);
  const maxStackHeight = zone.height - cardWidth; // cardWidth = displayed height after rotation
  const maxStep = cardCount > 1 ? maxStackHeight / (cardCount - 1) : 0;
  const step = Math.min(desiredStep, maxStep);

  // Center the stack vertically
  const totalHeight = step * (cardCount - 1);
  const startY = zone.y + (zone.height - totalHeight) / 2;
  const centerX = zone.x + zone.width / 2;

  const cards: OpponentCardPosition[] = [];
  for (let i = 0; i < cardCount; i++) {
    cards.push({
      x: centerX,
      y: startY + i * step,
      rotation: Math.PI / 2,
      scale: 1,
    });
  }

  return deepFreeze({ cards, cardWidth, cardHeight });
}
