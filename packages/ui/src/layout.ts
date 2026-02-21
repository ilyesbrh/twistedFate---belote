// ====================================================================
// Layout manager — pure functions for viewport zone calculations.
// No DOM access. No side effects. Fully unit-testable.
// Landscape-first layout (844x390 baseline). See docs/UI_MANIFESTO.md.
// ====================================================================

import { deepFreeze } from "./deep-freeze.js";

// ---- Types ----------------------------------------------------------

export type Orientation = "portrait" | "landscape";

export type Breakpoint = "compact" | "standard" | "expanded" | "medium" | "large";

/** Cardinal seat position around the table — shared by all components. */
export type Seat = "south" | "north" | "west" | "east";

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

export interface SafeAreaInsets {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LayoutZones {
  readonly top: Rect;
  readonly bottom: Rect;
  readonly left: Rect;
  readonly right: Rect;
  readonly center: Rect;
}

export interface Layout {
  readonly viewport: Viewport;
  readonly safeArea: Rect;
  readonly orientation: Orientation;
  readonly breakpoint: Breakpoint;
  readonly zones: LayoutZones;
}

// ---- Zone proportions (orientation-dependent) -----------------------

// Landscape-first ratios (primary)
const LANDSCAPE_TOP_RATIO = 0.18;
const LANDSCAPE_BOTTOM_RATIO = 0.28;
const LANDSCAPE_SIDE_WIDTH_RATIO = 0.15;

// Portrait fallback ratios
const PORTRAIT_TOP_RATIO = 0.25;
const PORTRAIT_BOTTOM_RATIO = 0.35;
const PORTRAIT_SIDE_WIDTH_RATIO = 0.12;

// ---- Public functions -----------------------------------------------

export function getOrientation(width: number, height: number): Orientation {
  return height >= width ? "portrait" : "landscape";
}

export function getBreakpoint(width: number, height: number): Breakpoint {
  const shortest = Math.min(width, height);
  if (shortest < 375) return "compact";
  if (shortest <= 430) return "standard";
  if (shortest <= 600) return "expanded";
  if (shortest <= 900) return "medium";
  return "large";
}

export function computeSafeArea(width: number, height: number, insets: SafeAreaInsets): Rect {
  return Object.freeze({
    x: insets.left,
    y: insets.top,
    width: width - insets.left - insets.right,
    height: height - insets.top - insets.bottom,
  });
}

export function computeLayout(viewport: Viewport, insets?: SafeAreaInsets): Layout {
  const resolvedInsets: SafeAreaInsets = insets ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const safeArea = computeSafeArea(viewport.width, viewport.height, resolvedInsets);

  const orientation = getOrientation(viewport.width, viewport.height);
  const breakpoint = getBreakpoint(viewport.width, viewport.height);

  const zones = computeZones(safeArea, orientation);

  return deepFreeze({
    viewport,
    safeArea,
    orientation,
    breakpoint,
    zones,
  });
}

// ---- Private helpers ------------------------------------------------

function computeZones(safeArea: Rect, orientation: Orientation): LayoutZones {
  const { x, y, width, height } = safeArea;

  const topRatio = orientation === "landscape" ? LANDSCAPE_TOP_RATIO : PORTRAIT_TOP_RATIO;
  const bottomRatio = orientation === "landscape" ? LANDSCAPE_BOTTOM_RATIO : PORTRAIT_BOTTOM_RATIO;
  const sideRatio =
    orientation === "landscape" ? LANDSCAPE_SIDE_WIDTH_RATIO : PORTRAIT_SIDE_WIDTH_RATIO;

  const topHeight = Math.round(height * topRatio);
  const bottomHeight = Math.round(height * bottomRatio);
  const middleHeight = height - topHeight - bottomHeight;
  const middleY = y + topHeight;

  const sideWidth = Math.round(width * sideRatio);
  const centerWidth = width - sideWidth * 2;

  const top: Rect = { x, y, width, height: topHeight };
  const bottom: Rect = { x, y: y + topHeight + middleHeight, width, height: bottomHeight };
  const left: Rect = { x, y: middleY, width: sideWidth, height: middleHeight };
  const right: Rect = {
    x: x + width - sideWidth,
    y: middleY,
    width: sideWidth,
    height: middleHeight,
  };
  const center: Rect = {
    x: x + sideWidth,
    y: middleY,
    width: centerWidth,
    height: middleHeight,
  };

  return { top, bottom, left, right, center };
}
