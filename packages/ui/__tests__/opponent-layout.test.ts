import { describe, it, expect } from "vitest";
import {
  computeOpponentLayout,
  type OpponentOrientation,
} from "../src/components/opponent-hand/opponent-layout.js";
import type { Rect } from "../src/layout.js";

// ====================================================================
// Opponent Layout — pure math for face-down card stack positions.
// Top opponent: horizontal stack. Side opponents: vertical stack.
// ====================================================================

// Baseline zones at 844x390 landscape
const TOP_ZONE: Rect = { x: 0, y: 0, width: 844, height: 70 };
const LEFT_ZONE: Rect = { x: 0, y: 70, width: 127, height: 211 };
const RIGHT_ZONE: Rect = { x: 717, y: 70, width: 127, height: 211 };

// ====================================================================
// Basic contract
// ====================================================================

describe("computeOpponentLayout basic contract", () => {
  it("returns empty array for 0 cards", () => {
    const result = computeOpponentLayout(TOP_ZONE, 0, "horizontal");
    expect(result.cards).toEqual([]);
  });

  it("returns N card positions for N cards", () => {
    for (const count of [1, 4, 8]) {
      const result = computeOpponentLayout(TOP_ZONE, count, "horizontal");
      expect(result.cards).toHaveLength(count);
    }
  });

  it("each card position has x, y, rotation, scale", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
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
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    expect(result.cardWidth).toBeGreaterThan(0);
    expect(result.cardHeight).toBeGreaterThan(0);
  });
});

// ====================================================================
// Horizontal stack (top opponent)
// ====================================================================

describe("computeOpponentLayout horizontal (top zone)", () => {
  it("cards are ordered left-to-right by x position", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    for (let i = 1; i < result.cards.length; i++) {
      expect(result.cards[i].x).toBeGreaterThan(result.cards[i - 1].x);
    }
  });

  it("stack is centered within the zone width", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    const zoneCenterX = TOP_ZONE.x + TOP_ZONE.width / 2;
    const firstX = result.cards[0].x;
    const lastX = result.cards[result.cards.length - 1].x;
    const stackCenterX = (firstX + lastX) / 2;
    expect(stackCenterX).toBeCloseTo(zoneCenterX, 0);
  });

  it("all cards have zero rotation", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    for (const card of result.cards) {
      expect(card.rotation).toBe(0);
    }
  });

  it("cards are vertically centered in zone", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    const zoneCenterY = TOP_ZONE.y + TOP_ZONE.height / 2;
    for (const card of result.cards) {
      expect(card.y).toBeCloseTo(zoneCenterY, 0);
    }
  });

  it("stack stays within zone horizontal bounds", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    const halfCard = result.cardWidth / 2;
    const leftEdge = result.cards[0].x - halfCard;
    const rightEdge = result.cards[result.cards.length - 1].x + halfCard;
    expect(leftEdge).toBeGreaterThanOrEqual(TOP_ZONE.x - 1);
    expect(rightEdge).toBeLessThanOrEqual(TOP_ZONE.x + TOP_ZONE.width + 1);
  });

  it("cards overlap heavily (stacked, not fanned)", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    const step = result.cards[1].x - result.cards[0].x;
    // Opponent stacks have high overlap (> 80%)
    const overlap = 1 - step / result.cardWidth;
    expect(overlap).toBeGreaterThanOrEqual(0.75);
  });
});

// ====================================================================
// Vertical stack (side opponents)
// ====================================================================

describe("computeOpponentLayout vertical (left zone)", () => {
  it("cards are ordered top-to-bottom by y position", () => {
    const result = computeOpponentLayout(LEFT_ZONE, 8, "vertical");
    for (let i = 1; i < result.cards.length; i++) {
      expect(result.cards[i].y).toBeGreaterThan(result.cards[i - 1].y);
    }
  });

  it("all cards are rotated 90° (PI/2)", () => {
    const result = computeOpponentLayout(LEFT_ZONE, 8, "vertical");
    const halfPi = Math.PI / 2;
    for (const card of result.cards) {
      expect(card.rotation).toBeCloseTo(halfPi, 5);
    }
  });

  it("stack is centered within the zone height", () => {
    const result = computeOpponentLayout(LEFT_ZONE, 8, "vertical");
    const zoneCenterY = LEFT_ZONE.y + LEFT_ZONE.height / 2;
    const firstY = result.cards[0].y;
    const lastY = result.cards[result.cards.length - 1].y;
    const stackCenterY = (firstY + lastY) / 2;
    expect(stackCenterY).toBeCloseTo(zoneCenterY, 0);
  });

  it("cards are horizontally centered in zone", () => {
    const result = computeOpponentLayout(LEFT_ZONE, 8, "vertical");
    const zoneCenterX = LEFT_ZONE.x + LEFT_ZONE.width / 2;
    for (const card of result.cards) {
      expect(card.x).toBeCloseTo(zoneCenterX, 0);
    }
  });

  it("stack stays within zone vertical bounds", () => {
    const result = computeOpponentLayout(LEFT_ZONE, 8, "vertical");
    // For vertical cards, the displayed height is cardWidth (rotated)
    const halfDisplayHeight = result.cardWidth / 2;
    const topEdge = result.cards[0].y - halfDisplayHeight;
    const bottomEdge = result.cards[result.cards.length - 1].y + halfDisplayHeight;
    expect(topEdge).toBeGreaterThanOrEqual(LEFT_ZONE.y - 1);
    expect(bottomEdge).toBeLessThanOrEqual(LEFT_ZONE.y + LEFT_ZONE.height + 1);
  });
});

describe("computeOpponentLayout vertical (right zone)", () => {
  it("produces same structure as left zone", () => {
    const left = computeOpponentLayout(LEFT_ZONE, 8, "vertical");
    const right = computeOpponentLayout(RIGHT_ZONE, 8, "vertical");
    expect(left.cards.length).toBe(right.cards.length);
    expect(left.cardWidth).toBe(right.cardWidth);
    expect(left.cardHeight).toBe(right.cardHeight);
  });

  it("right zone cards are positioned within right zone bounds", () => {
    const result = computeOpponentLayout(RIGHT_ZONE, 8, "vertical");
    const zoneCenterX = RIGHT_ZONE.x + RIGHT_ZONE.width / 2;
    for (const card of result.cards) {
      expect(card.x).toBeCloseTo(zoneCenterX, 0);
    }
  });
});

// ====================================================================
// Card sizing
// ====================================================================

describe("computeOpponentLayout card sizing", () => {
  it("horizontal cards are smaller than hand cards (opponent cards are compact)", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    // Cards should fit within the zone height
    expect(result.cardHeight).toBeLessThanOrEqual(TOP_ZONE.height);
    expect(result.cardHeight).toBeGreaterThan(0);
  });

  it("vertical cards fit within zone width", () => {
    const result = computeOpponentLayout(LEFT_ZONE, 8, "vertical");
    // When rotated 90°, cardHeight becomes displayed width
    expect(result.cardHeight).toBeLessThanOrEqual(LEFT_ZONE.width);
  });

  it("all cards have the same scale", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    const firstScale = result.cards[0].scale;
    for (const card of result.cards) {
      expect(card.scale).toBe(firstScale);
    }
  });
});

// ====================================================================
// Single card
// ====================================================================

describe("computeOpponentLayout single card", () => {
  it("horizontal single card is centered", () => {
    const result = computeOpponentLayout(TOP_ZONE, 1, "horizontal");
    const zoneCenterX = TOP_ZONE.x + TOP_ZONE.width / 2;
    expect(result.cards[0].x).toBeCloseTo(zoneCenterX, 0);
  });

  it("vertical single card is centered", () => {
    const result = computeOpponentLayout(LEFT_ZONE, 1, "vertical");
    const zoneCenterY = LEFT_ZONE.y + LEFT_ZONE.height / 2;
    expect(result.cards[0].y).toBeCloseTo(zoneCenterY, 0);
  });
});

// ====================================================================
// Immutability
// ====================================================================

describe("computeOpponentLayout immutability", () => {
  it("result is frozen", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("cards array is frozen", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    expect(Object.isFrozen(result.cards)).toBe(true);
  });

  it("each card position is frozen", () => {
    const result = computeOpponentLayout(TOP_ZONE, 8, "horizontal");
    for (const card of result.cards) {
      expect(Object.isFrozen(card)).toBe(true);
    }
  });
});
