// ====================================================================
// Bidding layout — pure math for bidding panel button positions.
// 4 suit buttons + 1 pass button in a horizontal row.
// No DOM access. No side effects. Fully unit-testable.
// ====================================================================

import { deepFreeze } from "../../deep-freeze.js";
import { THEME } from "../../theme.js";
import type { Rect } from "../../layout.js";

// ---- Types ----------------------------------------------------------

export interface ButtonRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BiddingLayoutResult {
  readonly suitButtons: readonly ButtonRect[];
  readonly passButton: ButtonRect;
  readonly buttonWidth: number;
  readonly buttonHeight: number;
}

// ---- Constants ------------------------------------------------------

const SUIT_BUTTON_COUNT = 4;
const TOTAL_BUTTON_COUNT = SUIT_BUTTON_COUNT + 1; // 4 suits + pass
const MIN_TAP_SIZE = THEME.cardDimensions.minTapWidth; // 44px
const BUTTON_HEIGHT_RATIO = 0.6;

// ---- Public function ------------------------------------------------

export function computeBiddingLayout(zone: Rect): BiddingLayoutResult {
  // Button sizing
  const buttonHeight = Math.max(MIN_TAP_SIZE, Math.round(zone.height * BUTTON_HEIGHT_RATIO));
  const gap = THEME.spacing.sm;

  // Total width budget
  const totalGaps = (TOTAL_BUTTON_COUNT - 1) * gap;
  const availableWidth = zone.width - THEME.spacing.xl * 2; // margins
  const buttonWidth = Math.max(
    MIN_TAP_SIZE,
    Math.floor((availableWidth - totalGaps) / TOTAL_BUTTON_COUNT),
  );

  // Center the row of buttons
  const totalRowWidth = buttonWidth * TOTAL_BUTTON_COUNT + totalGaps;
  const startX = zone.x + (zone.width - totalRowWidth) / 2;
  const startY = zone.y + (zone.height - buttonHeight) / 2;

  // Suit buttons (first 4)
  const suitButtons: ButtonRect[] = [];
  for (let i = 0; i < SUIT_BUTTON_COUNT; i++) {
    suitButtons.push({
      x: startX + i * (buttonWidth + gap),
      y: startY,
      width: buttonWidth,
      height: buttonHeight,
    });
  }

  // Pass button (5th)
  const passButton: ButtonRect = {
    x: startX + SUIT_BUTTON_COUNT * (buttonWidth + gap),
    y: startY,
    width: buttonWidth,
    height: buttonHeight,
  };

  return deepFreeze({ suitButtons, passButton, buttonWidth, buttonHeight });
}
