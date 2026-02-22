// ====================================================================
// Pip layout — pure function returning normalized pip positions
// for standard playing card pip arrangements (Belote: 7–A).
// Unit-tested in __tests__/pip-layout.test.ts.
// ====================================================================

import type { Rank } from "@belote/core";

// ---- Types ----------------------------------------------------------

export interface PipPosition {
  readonly x: number;
  readonly y: number;
  readonly inverted: boolean;
}

// ---- Column x-coordinates (normalized 0-1) --------------------------

const L = 0.25; // left column
const C = 0.5; // center column
const R = 0.75; // right column

// ---- Pip position helper --------------------------------------------

function pip(x: number, y: number): PipPosition {
  return Object.freeze({ x, y, inverted: y > 0.5 });
}

// ---- Pip layouts per rank -------------------------------------------
// All layouts are vertically symmetric around y=0.5.
// Odd-count layouts use a center pip at y=0.5.

// 7: L,R top + C upper-center + C center + C lower-center + L,R bottom
const PIPS_7: readonly PipPosition[] = Object.freeze([
  pip(L, 0.1),
  pip(R, 0.1),
  pip(C, 0.3),
  pip(C, 0.5),
  pip(C, 0.7),
  pip(L, 0.9),
  pip(R, 0.9),
]);

// 8: L,R at 4 symmetric rows
const PIPS_8: readonly PipPosition[] = Object.freeze([
  pip(L, 0.1),
  pip(R, 0.1),
  pip(L, 0.35),
  pip(R, 0.35),
  pip(L, 0.65),
  pip(R, 0.65),
  pip(L, 0.9),
  pip(R, 0.9),
]);

// 9: L,R at 4 rows + C center
const PIPS_9: readonly PipPosition[] = Object.freeze([
  pip(L, 0.1),
  pip(R, 0.1),
  pip(L, 0.3),
  pip(R, 0.3),
  pip(C, 0.5),
  pip(L, 0.7),
  pip(R, 0.7),
  pip(L, 0.9),
  pip(R, 0.9),
]);

// 10: L,R at 4 rows + C pair near center
const PIPS_10: readonly PipPosition[] = Object.freeze([
  pip(L, 0.1),
  pip(R, 0.1),
  pip(L, 0.3),
  pip(R, 0.3),
  pip(C, 0.4),
  pip(C, 0.6),
  pip(L, 0.7),
  pip(R, 0.7),
  pip(L, 0.9),
  pip(R, 0.9),
]);

const EMPTY: readonly PipPosition[] = Object.freeze([]);

// ---- Public API -----------------------------------------------------

const PIP_MAP: Readonly<Record<Rank, readonly PipPosition[]>> = {
  "7": PIPS_7,
  "8": PIPS_8,
  "9": PIPS_9,
  "10": PIPS_10,
  jack: EMPTY,
  queen: EMPTY,
  king: EMPTY,
  ace: EMPTY,
};

/**
 * Returns normalized pip positions for the given rank.
 * Number cards (7-10) return their standard pip layouts.
 * Face cards (J/Q/K) and Ace return empty arrays (they use
 * a different center treatment: large letter or large symbol).
 *
 * Each position has x,y in [0,1] and an `inverted` flag for
 * bottom-half pips that should be rendered upside-down.
 */
export function pipPositions(rank: Rank): readonly PipPosition[] {
  const template = PIP_MAP[rank];
  return Object.freeze(template.map((p) => pip(p.x, p.y)));
}
