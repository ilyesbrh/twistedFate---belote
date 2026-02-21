import { describe, it, expect } from "vitest";
import { computeHandLayout } from "../src/components/hand/hand-layout.js";
import type { HandLayoutResult } from "../src/components/hand/hand-layout.js";
import type { Rect } from "../src/layout.js";
import { THEME } from "../src/theme.js";

// ====================================================================
// Hand Layout — pure math for card fan positions in the bottom zone.
// Given a zone rect + card count → array of { x, y, rotation, scale }
// ====================================================================

// Baseline bottom zone at 844x390 landscape
const BOTTOM_ZONE: Rect = { x: 0, y: 281, width: 844, height: 109 };

// ====================================================================
// Basic contract
// ====================================================================

describe("computeHandLayout basic contract", () => {
  it("returns empty array for 0 cards", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 0);
    expect(result.cards).toEqual([]);
  });

  it("returns N card positions for N cards", () => {
    for (const count of [1, 3, 5, 8]) {
      const result = computeHandLayout(BOTTOM_ZONE, count);
      expect(result.cards).toHaveLength(count);
    }
  });

  it("each card position has x, y, rotation, scale", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 5);
    for (const card of result.cards) {
      expect(typeof card.x).toBe("number");
      expect(typeof card.y).toBe("number");
      expect(typeof card.rotation).toBe("number");
      expect(typeof card.scale).toBe("number");
      expect(Number.isFinite(card.x)).toBe(true);
      expect(Number.isFinite(card.y)).toBe(true);
      expect(Number.isFinite(card.rotation)).toBe(true);
      expect(Number.isFinite(card.scale)).toBe(true);
    }
  });

  it("returns cardWidth and cardHeight metadata", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    expect(typeof result.cardWidth).toBe("number");
    expect(typeof result.cardHeight).toBe("number");
    expect(result.cardWidth).toBeGreaterThan(0);
    expect(result.cardHeight).toBeGreaterThan(0);
  });

  it("card height respects THEME aspect ratio", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const expectedRatio = THEME.cardDimensions.aspectRatio;
    const actualRatio = result.cardWidth / result.cardHeight;
    expect(actualRatio).toBeCloseTo(expectedRatio, 2);
  });
});

// ====================================================================
// Fan spread — cards distributed horizontally with overlap
// ====================================================================

describe("computeHandLayout fan spread", () => {
  it("cards are ordered left-to-right by x position", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    for (let i = 1; i < result.cards.length; i++) {
      expect(result.cards[i].x).toBeGreaterThan(result.cards[i - 1].x);
    }
  });

  it("fan is centered within the zone width", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const zoneCenterX = BOTTOM_ZONE.x + BOTTOM_ZONE.width / 2;
    const firstX = result.cards[0].x;
    const lastX = result.cards[result.cards.length - 1].x;
    const fanCenterX = (firstX + lastX) / 2;
    expect(fanCenterX).toBeCloseTo(zoneCenterX, 0);
  });

  it("single card is centered in zone", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 1);
    const zoneCenterX = BOTTOM_ZONE.x + BOTTOM_ZONE.width / 2;
    expect(result.cards[0].x).toBeCloseTo(zoneCenterX, 0);
  });

  it("overlap is within THEME fanOverlap range", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const step = result.cards[1].x - result.cards[0].x;
    // step = cardWidth * (1 - overlap), so overlap = 1 - step/cardWidth
    const overlap = 1 - step / result.cardWidth;
    expect(overlap).toBeGreaterThanOrEqual(THEME.cardDimensions.fanOverlap.min - 0.01);
    expect(overlap).toBeLessThanOrEqual(THEME.cardDimensions.fanOverlap.max + 0.01);
  });

  it("fan stays within zone horizontal bounds", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const halfCard = result.cardWidth / 2;
    const leftEdge = result.cards[0].x - halfCard;
    const rightEdge = result.cards[result.cards.length - 1].x + halfCard;
    expect(leftEdge).toBeGreaterThanOrEqual(BOTTOM_ZONE.x - 1);
    expect(rightEdge).toBeLessThanOrEqual(BOTTOM_ZONE.x + BOTTOM_ZONE.width + 1);
  });
});

// ====================================================================
// Arc curvature — subtle y-offset and rotation per card
// ====================================================================

describe("computeHandLayout arc curvature", () => {
  it("center cards are higher (lower y) than edge cards", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const middleIdx = Math.floor(result.cards.length / 2);
    const edgeIdx = 0;
    // Center card should have lower y (higher on screen) than edge card
    expect(result.cards[middleIdx].y).toBeLessThan(result.cards[edgeIdx].y);
  });

  it("rotation fans outward from center (left negative, right positive)", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const leftCard = result.cards[0];
    const rightCard = result.cards[result.cards.length - 1];
    // Left card rotated counter-clockwise (negative)
    expect(leftCard.rotation).toBeLessThan(0);
    // Right card rotated clockwise (positive)
    expect(rightCard.rotation).toBeGreaterThan(0);
  });

  it("rotation is symmetric around center", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const first = result.cards[0];
    const last = result.cards[result.cards.length - 1];
    expect(Math.abs(first.rotation + last.rotation)).toBeLessThan(0.01);
  });

  it("arc is symmetric vertically", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const first = result.cards[0];
    const last = result.cards[result.cards.length - 1];
    expect(Math.abs(first.y - last.y)).toBeLessThan(1);
  });

  it("single card has zero rotation", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 1);
    expect(result.cards[0].rotation).toBe(0);
  });

  it("max rotation is reasonable (< 15 degrees)", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const maxDeg = 15 * (Math.PI / 180);
    for (const card of result.cards) {
      expect(Math.abs(card.rotation)).toBeLessThanOrEqual(maxDeg);
    }
  });
});

// ====================================================================
// Card sizing
// ====================================================================

describe("computeHandLayout card sizing", () => {
  it("card height is based on zone height", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    // Card should use most of the zone height (with some padding)
    expect(result.cardHeight).toBeGreaterThan(BOTTOM_ZONE.height * 0.6);
    expect(result.cardHeight).toBeLessThanOrEqual(BOTTOM_ZONE.height);
  });

  it("card width satisfies minimum tap target", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    expect(result.cardWidth).toBeGreaterThanOrEqual(THEME.cardDimensions.minTapWidth);
  });

  it("all cards have the same scale", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    const firstScale = result.cards[0].scale;
    for (const card of result.cards) {
      expect(card.scale).toBe(firstScale);
    }
  });
});

// ====================================================================
// Different card counts
// ====================================================================

describe("computeHandLayout adapts to card count", () => {
  it("fewer cards have wider spacing", () => {
    const result3 = computeHandLayout(BOTTOM_ZONE, 3);
    const result8 = computeHandLayout(BOTTOM_ZONE, 8);
    const step3 = result3.cards[1].x - result3.cards[0].x;
    const step8 = result8.cards[1].x - result8.cards[0].x;
    expect(step3).toBeGreaterThan(step8);
  });

  it("works with 2 cards", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 2);
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].x).toBeLessThan(result.cards[1].x);
  });
});

// ====================================================================
// Different zone sizes (responsive)
// ====================================================================

describe("computeHandLayout responsive zones", () => {
  it("works in a narrow portrait zone", () => {
    const portraitZone: Rect = { x: 0, y: 549, width: 390, height: 295 };
    const result = computeHandLayout(portraitZone, 8);
    expect(result.cards).toHaveLength(8);
    // Fan stays within bounds
    const halfCard = result.cardWidth / 2;
    const leftEdge = result.cards[0].x - halfCard;
    const rightEdge = result.cards[result.cards.length - 1].x + halfCard;
    expect(leftEdge).toBeGreaterThanOrEqual(portraitZone.x - 1);
    expect(rightEdge).toBeLessThanOrEqual(portraitZone.x + portraitZone.width + 1);
  });

  it("works in a wide desktop zone", () => {
    const desktopZone: Rect = { x: 0, y: 778, width: 1920, height: 302 };
    const result = computeHandLayout(desktopZone, 8);
    expect(result.cards).toHaveLength(8);
    // Cards still ordered left to right
    for (let i = 1; i < result.cards.length; i++) {
      expect(result.cards[i].x).toBeGreaterThan(result.cards[i - 1].x);
    }
  });

  it("card height scales with zone height", () => {
    const smallZone: Rect = { x: 0, y: 0, width: 600, height: 80 };
    const bigZone: Rect = { x: 0, y: 0, width: 600, height: 200 };
    const smallResult = computeHandLayout(smallZone, 8);
    const bigResult = computeHandLayout(bigZone, 8);
    expect(bigResult.cardHeight).toBeGreaterThan(smallResult.cardHeight);
  });
});

// ====================================================================
// Immutability
// ====================================================================

describe("computeHandLayout immutability", () => {
  it("result is frozen", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("cards array is frozen", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    expect(Object.isFrozen(result.cards)).toBe(true);
  });

  it("each card position is frozen", () => {
    const result = computeHandLayout(BOTTOM_ZONE, 8);
    for (const card of result.cards) {
      expect(Object.isFrozen(card)).toBe(true);
    }
  });
});
