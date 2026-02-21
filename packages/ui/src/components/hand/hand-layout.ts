// ====================================================================
// Hand layout — pure math for card fan positions in the bottom zone.
// Given a zone rect + card count → array of { x, y, rotation, scale }.
// No DOM access. No side effects. Fully unit-testable.
// ====================================================================

import { deepFreeze } from "../../deep-freeze.js";
import { THEME } from "../../theme.js";
import type { Rect } from "../../layout.js";

// ---- Types ----------------------------------------------------------

export interface CardPosition {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly scale: number;
}

export interface HandLayoutResult {
  readonly cards: readonly CardPosition[];
  readonly cardWidth: number;
  readonly cardHeight: number;
}

// ---- Constants ------------------------------------------------------

/** Fraction of zone height used for card height. */
const CARD_HEIGHT_RATIO = 0.85;

/** Maximum arc rotation in radians (~10 degrees). */
const MAX_ARC_ROTATION = 10 * (Math.PI / 180);

/** Maximum vertical arc offset as fraction of card height. */
const ARC_Y_FRACTION = 0.08;

// ---- Public function ------------------------------------------------

export function computeHandLayout(zone: Rect, cardCount: number): HandLayoutResult {
  if (cardCount === 0) {
    return deepFreeze({ cards: [], cardWidth: 0, cardHeight: 0 });
  }

  // Card dimensions — height derived from zone, width from aspect ratio
  const cardHeight = Math.round(zone.height * CARD_HEIGHT_RATIO);
  const cardWidth = Math.round(cardHeight * THEME.cardDimensions.aspectRatio);

  // Compute step (spacing between card centers)
  const step = computeStep(zone.width, cardWidth, cardCount);

  // Fan center x
  const totalFanWidth = step * (cardCount - 1);
  const startX = zone.x + (zone.width - totalFanWidth) / 2;

  // Base y — vertically center cards in zone
  const baseY = zone.y + zone.height / 2;

  // Build card positions
  const cards: CardPosition[] = [];
  for (let i = 0; i < cardCount; i++) {
    // Normalized position: -1 (leftmost) to +1 (rightmost)
    const t = cardCount === 1 ? 0 : (2 * i) / (cardCount - 1) - 1;

    const x = startX + i * step;
    const y = baseY + ARC_Y_FRACTION * cardHeight * t * t; // parabolic arc (edges lower)
    const rotation = t * MAX_ARC_ROTATION;
    const scale = 1;

    cards.push({ x, y, rotation, scale });
  }

  return deepFreeze({ cards, cardWidth, cardHeight });
}

// ---- Private helpers ------------------------------------------------

/** Reference card count for full-fan overlap. */
const FULL_FAN_COUNT = 8;

function computeStep(zoneWidth: number, cardWidth: number, cardCount: number): number {
  if (cardCount <= 1) return 0;

  // Desired overlap from THEME (use middle of range)
  const targetOverlap =
    (THEME.cardDimensions.fanOverlap.min + THEME.cardDimensions.fanOverlap.max) / 2;
  const tightStep = cardWidth * (1 - targetOverlap);
  const wideStep = cardWidth; // no overlap

  // Fewer cards get wider spacing; at FULL_FAN_COUNT+ use tight overlap
  const spreadFactor = Math.max(0, 1 - cardCount / FULL_FAN_COUNT);
  const desiredStep = tightStep + (wideStep - tightStep) * spreadFactor;

  // Maximum step that keeps fan within zone bounds
  const maxFanWidth = zoneWidth - cardWidth; // leave half-card margin on each side
  const maxStep = maxFanWidth / (cardCount - 1);

  // Use desired step, but clamp to fit within zone
  return Math.min(desiredStep, maxStep);
}
