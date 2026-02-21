import { describe, it, expect } from "vitest";
import { getOrientation, getBreakpoint, computeSafeArea, computeLayout } from "../src/layout.js";
import type { Viewport, SafeAreaInsets } from "../src/layout.js";

// ====================================================================
// getOrientation
// ====================================================================

describe("getOrientation", () => {
  it("returns portrait when height > width", () => {
    expect(getOrientation(390, 844)).toBe("portrait");
  });

  it("returns landscape when width > height", () => {
    expect(getOrientation(844, 390)).toBe("landscape");
  });

  it("returns portrait when square (height === width)", () => {
    expect(getOrientation(500, 500)).toBe("portrait");
  });
});

// ====================================================================
// getBreakpoint — uses shortest viewport dimension
// ====================================================================

describe("getBreakpoint", () => {
  it("returns compact for shortest dimension < 375", () => {
    expect(getBreakpoint(667, 320)).toBe("compact");
    expect(getBreakpoint(320, 667)).toBe("compact");
  });

  it("returns standard for shortest dimension 375-430", () => {
    expect(getBreakpoint(844, 390)).toBe("standard");
    expect(getBreakpoint(390, 844)).toBe("standard");
    expect(getBreakpoint(926, 428)).toBe("standard");
  });

  it("returns expanded for shortest dimension 431-600", () => {
    expect(getBreakpoint(900, 500)).toBe("expanded");
    expect(getBreakpoint(500, 900)).toBe("expanded");
  });

  it("returns medium for shortest dimension 601-900", () => {
    expect(getBreakpoint(1024, 768)).toBe("medium");
    expect(getBreakpoint(768, 1024)).toBe("medium");
  });

  it("returns large for shortest dimension > 900", () => {
    expect(getBreakpoint(1920, 1080)).toBe("large");
    expect(getBreakpoint(1080, 1920)).toBe("large");
  });

  it("returns same breakpoint regardless of orientation", () => {
    expect(getBreakpoint(844, 390)).toBe(getBreakpoint(390, 844));
    expect(getBreakpoint(1024, 768)).toBe(getBreakpoint(768, 1024));
  });
});

// ====================================================================
// computeSafeArea
// ====================================================================

describe("computeSafeArea", () => {
  it("returns full viewport when all insets are zero", () => {
    const result = computeSafeArea(844, 390, { top: 0, bottom: 0, left: 0, right: 0 });
    expect(result).toEqual({ x: 0, y: 0, width: 844, height: 390 });
  });

  it("adjusts for landscape notch insets (left/right)", () => {
    const result = computeSafeArea(844, 390, { top: 0, bottom: 0, left: 47, right: 34 });
    expect(result).toEqual({ x: 47, y: 0, width: 763, height: 390 });
  });

  it("adjusts for all insets", () => {
    const result = computeSafeArea(844, 390, { top: 10, bottom: 20, left: 47, right: 34 });
    expect(result).toEqual({ x: 47, y: 10, width: 763, height: 360 });
  });
});

// ====================================================================
// computeLayout — 844x390 (iPhone 14 landscape, design baseline)
// ====================================================================

describe("computeLayout at 844x390 (design baseline, landscape)", () => {
  const viewport: Viewport = { width: 844, height: 390 };
  const layout = computeLayout(viewport);

  it("returns correct viewport", () => {
    expect(layout.viewport).toEqual({ width: 844, height: 390 });
  });

  it("detects landscape orientation", () => {
    expect(layout.orientation).toBe("landscape");
  });

  it("detects standard breakpoint", () => {
    expect(layout.breakpoint).toBe("standard");
  });

  it("top zone occupies top 18% of height", () => {
    expect(layout.zones.top.y).toBe(0);
    expect(layout.zones.top.height).toBeCloseTo(390 * 0.18, 0);
  });

  it("bottom zone occupies bottom 28% of height", () => {
    expect(layout.zones.bottom.height).toBeCloseTo(390 * 0.28, 0);
    expect(layout.zones.bottom.y + layout.zones.bottom.height).toBeCloseTo(390, 0);
  });

  it("center zone is within the middle 54%", () => {
    const middleTop = 390 * 0.18;
    const middleBottom = 390 * (1 - 0.28);
    expect(layout.zones.center.y).toBeGreaterThanOrEqual(middleTop - 1);
    expect(layout.zones.center.y + layout.zones.center.height).toBeLessThanOrEqual(
      middleBottom + 1,
    );
  });

  it("side zones are 15% of width each", () => {
    expect(layout.zones.left.width).toBeCloseTo(844 * 0.15, 0);
    expect(layout.zones.right.width).toBeCloseTo(844 * 0.15, 0);
  });

  it("center zone width equals total minus two side zones", () => {
    const expectedSideWidth = Math.round(844 * 0.15);
    expect(layout.zones.center.width).toBe(844 - expectedSideWidth * 2);
  });

  it("has all 5 zones", () => {
    expect(layout.zones.top).toBeDefined();
    expect(layout.zones.bottom).toBeDefined();
    expect(layout.zones.left).toBeDefined();
    expect(layout.zones.right).toBeDefined();
    expect(layout.zones.center).toBeDefined();
  });
});

// ====================================================================
// computeLayout — 390x844 (iPhone 14 portrait, fallback)
// ====================================================================

describe("computeLayout at 390x844 (portrait fallback)", () => {
  const viewport: Viewport = { width: 390, height: 844 };
  const layout = computeLayout(viewport);

  it("detects portrait orientation", () => {
    expect(layout.orientation).toBe("portrait");
  });

  it("detects standard breakpoint (same device)", () => {
    expect(layout.breakpoint).toBe("standard");
  });

  it("top zone occupies top 25% of height", () => {
    expect(layout.zones.top.y).toBe(0);
    expect(layout.zones.top.height).toBeCloseTo(844 * 0.25, 0);
  });

  it("bottom zone occupies bottom 35% of height", () => {
    expect(layout.zones.bottom.height).toBeCloseTo(844 * 0.35, 0);
    expect(layout.zones.bottom.y + layout.zones.bottom.height).toBeCloseTo(844, 0);
  });

  it("side zones are 12% of width each", () => {
    expect(layout.zones.left.width).toBeCloseTo(390 * 0.12, 0);
    expect(layout.zones.right.width).toBeCloseTo(390 * 0.12, 0);
  });

  it("uses different ratios than landscape", () => {
    const landscapeLayout = computeLayout({ width: 844, height: 390 });
    // Landscape top = 18%, portrait top = 25% — different ratios for different orientations
    const landscapeTopRatio = landscapeLayout.zones.top.height / 390;
    const portraitTopRatio = layout.zones.top.height / 844;
    expect(landscapeTopRatio).not.toBeCloseTo(portraitTopRatio, 1);
  });
});

// ====================================================================
// computeLayout — 1024x768 (tablet landscape)
// ====================================================================

describe("computeLayout at 1024x768 (tablet landscape)", () => {
  const viewport: Viewport = { width: 1024, height: 768 };
  const layout = computeLayout(viewport);

  it("detects landscape orientation", () => {
    expect(layout.orientation).toBe("landscape");
  });

  it("detects medium breakpoint", () => {
    expect(layout.breakpoint).toBe("medium");
  });

  it("uses landscape ratios (18% top)", () => {
    expect(layout.zones.top.height).toBeCloseTo(768 * 0.18, 0);
  });
});

// ====================================================================
// computeLayout — 768x1024 (tablet portrait)
// ====================================================================

describe("computeLayout at 768x1024 (tablet portrait)", () => {
  const viewport: Viewport = { width: 768, height: 1024 };
  const layout = computeLayout(viewport);

  it("detects portrait orientation", () => {
    expect(layout.orientation).toBe("portrait");
  });

  it("detects medium breakpoint", () => {
    expect(layout.breakpoint).toBe("medium");
  });

  it("uses portrait ratios (25% top)", () => {
    expect(layout.zones.top.height).toBeCloseTo(1024 * 0.25, 0);
  });
});

// ====================================================================
// computeLayout with safe area insets (landscape)
// ====================================================================

describe("computeLayout with safe area insets (landscape)", () => {
  const viewport: Viewport = { width: 844, height: 390 };
  const insets: SafeAreaInsets = { top: 0, bottom: 34, left: 47, right: 0 };
  const layout = computeLayout(viewport, insets);

  it("safe area excludes insets", () => {
    expect(layout.safeArea.x).toBe(47);
    expect(layout.safeArea.width).toBe(797);
    expect(layout.safeArea.height).toBe(356);
  });

  it("top zone starts at safe area top", () => {
    expect(layout.zones.top.y).toBe(0);
  });

  it("bottom zone ends at safe area bottom", () => {
    const bottomEnd = layout.zones.bottom.y + layout.zones.bottom.height;
    expect(bottomEnd).toBeCloseTo(390 - 34, 0);
  });
});

// ====================================================================
// Zone invariants (cross-viewport)
// ====================================================================

describe("zone invariants", () => {
  const viewports: Viewport[] = [
    { width: 844, height: 390 }, // iPhone 14 landscape (baseline)
    { width: 390, height: 844 }, // iPhone 14 portrait (fallback)
    { width: 667, height: 375 }, // iPhone SE landscape
    { width: 1024, height: 768 }, // iPad landscape
    { width: 768, height: 1024 }, // iPad portrait
    { width: 1920, height: 1080 }, // Desktop
  ];

  for (const viewport of viewports) {
    describe(`at ${viewport.width}x${viewport.height}`, () => {
      const layout = computeLayout(viewport);

      it("top and bottom zones do not overlap vertically", () => {
        const topEnd = layout.zones.top.y + layout.zones.top.height;
        expect(topEnd).toBeLessThanOrEqual(layout.zones.bottom.y + 1);
      });

      it("left and right zones do not overlap horizontally", () => {
        const leftEnd = layout.zones.left.x + layout.zones.left.width;
        expect(leftEnd).toBeLessThanOrEqual(layout.zones.right.x + 1);
      });

      it("center zone is within viewport bounds", () => {
        expect(layout.zones.center.x).toBeGreaterThanOrEqual(0);
        expect(layout.zones.center.y).toBeGreaterThanOrEqual(0);
        expect(layout.zones.center.x + layout.zones.center.width).toBeLessThanOrEqual(
          viewport.width + 1,
        );
        expect(layout.zones.center.y + layout.zones.center.height).toBeLessThanOrEqual(
          viewport.height + 1,
        );
      });

      it("all zone values are finite non-negative numbers", () => {
        const zones = [
          layout.zones.top,
          layout.zones.bottom,
          layout.zones.left,
          layout.zones.right,
          layout.zones.center,
        ];
        for (const zone of zones) {
          expect(Number.isFinite(zone.x)).toBe(true);
          expect(Number.isFinite(zone.y)).toBe(true);
          expect(Number.isFinite(zone.width)).toBe(true);
          expect(Number.isFinite(zone.height)).toBe(true);
          expect(zone.x).toBeGreaterThanOrEqual(0);
          expect(zone.y).toBeGreaterThanOrEqual(0);
          expect(zone.width).toBeGreaterThanOrEqual(0);
          expect(zone.height).toBeGreaterThanOrEqual(0);
        }
      });
    });
  }
});

// ====================================================================
// Immutability
// ====================================================================

describe("layout immutability", () => {
  it("returned layout is frozen", () => {
    const layout = computeLayout({ width: 844, height: 390 });
    expect(Object.isFrozen(layout)).toBe(true);
  });

  it("zones are frozen", () => {
    const layout = computeLayout({ width: 844, height: 390 });
    expect(Object.isFrozen(layout.zones)).toBe(true);
    expect(Object.isFrozen(layout.zones.top)).toBe(true);
    expect(Object.isFrozen(layout.zones.bottom)).toBe(true);
    expect(Object.isFrozen(layout.zones.left)).toBe(true);
    expect(Object.isFrozen(layout.zones.right)).toBe(true);
    expect(Object.isFrozen(layout.zones.center)).toBe(true);
  });
});
