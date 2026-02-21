// ====================================================================
// Trick layout — pure math for played card positions in center zone.
// Cards placed at N/S/E/W positions matching the player who played them.
// No DOM access. No side effects. Fully unit-testable.
// ====================================================================

import { deepFreeze } from "../../deep-freeze.js";
import { THEME } from "../../theme.js";
import type { Rect, Seat } from "../../layout.js";

// ---- Types ----------------------------------------------------------

export type TrickPosition = Seat;

export interface TrickSlot {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
}

export interface TrickLayoutResult {
  readonly slots: Readonly<Record<TrickPosition, TrickSlot>>;
  readonly cardWidth: number;
  readonly cardHeight: number;
}

// ---- Constants ------------------------------------------------------

/** Card height as fraction of the shorter zone dimension. */
const CARD_HEIGHT_RATIO = 0.35;

/** How far from center the N/S cards are placed (fraction of half-height). */
const NS_OFFSET_RATIO = 0.35;

/** How far from center the E/W cards are placed (fraction of half-width). */
const EW_OFFSET_RATIO = 0.25;

// ---- Public function ------------------------------------------------

export function computeTrickLayout(zone: Rect): TrickLayoutResult {
  const centerX = zone.x + zone.width / 2;
  const centerY = zone.y + zone.height / 2;

  // Card sizing — based on zone height (trick cards are smaller than hand cards)
  const cardHeight = Math.round(Math.min(zone.height, zone.width) * CARD_HEIGHT_RATIO);
  const cardWidth = Math.round(cardHeight * THEME.cardDimensions.aspectRatio);

  // Offsets from center
  const nsOffset = (zone.height / 2) * NS_OFFSET_RATIO;
  const ewOffset = (zone.width / 2) * EW_OFFSET_RATIO;

  const slots: Record<TrickPosition, TrickSlot> = {
    south: { x: centerX, y: centerY + nsOffset, rotation: 0 },
    north: { x: centerX, y: centerY - nsOffset, rotation: 0 },
    west: { x: centerX - ewOffset, y: centerY, rotation: Math.PI / 2 },
    east: { x: centerX + ewOffset, y: centerY, rotation: -Math.PI / 2 },
  };

  return deepFreeze({ slots, cardWidth, cardHeight });
}
