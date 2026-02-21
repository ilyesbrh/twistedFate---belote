import { describe, it, expect } from "vitest";
import { computeBiddingLayout } from "../src/components/bidding/bidding-layout.js";
import type { BiddingLayoutResult } from "../src/components/bidding/bidding-layout.js";
import type { Rect } from "../src/layout.js";

// ====================================================================
// Bidding Layout — pure math for bidding panel button positions.
// 4 suit buttons + 1 pass button arranged in a grid.
// ====================================================================

// Baseline bottom zone at 844x390 landscape
const BOTTOM_ZONE: Rect = { x: 0, y: 281, width: 844, height: 109 };

// ====================================================================
// Basic contract
// ====================================================================

describe("computeBiddingLayout basic contract", () => {
  it("returns 4 suit buttons", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    expect(result.suitButtons).toHaveLength(4);
  });

  it("returns a pass button", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    expect(result.passButton).toBeDefined();
    expect(typeof result.passButton.x).toBe("number");
    expect(typeof result.passButton.y).toBe("number");
  });

  it("each suit button has x, y, width, height", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    for (const btn of result.suitButtons) {
      expect(typeof btn.x).toBe("number");
      expect(typeof btn.y).toBe("number");
      expect(typeof btn.width).toBe("number");
      expect(typeof btn.height).toBe("number");
      expect(btn.width).toBeGreaterThan(0);
      expect(btn.height).toBeGreaterThan(0);
    }
  });

  it("returns buttonWidth and buttonHeight metadata", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    expect(result.buttonWidth).toBeGreaterThan(0);
    expect(result.buttonHeight).toBeGreaterThan(0);
  });
});

// ====================================================================
// Layout arrangement
// ====================================================================

describe("computeBiddingLayout arrangement", () => {
  it("suit buttons are arranged left-to-right", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    for (let i = 1; i < result.suitButtons.length; i++) {
      expect(result.suitButtons[i].x).toBeGreaterThan(result.suitButtons[i - 1].x);
    }
  });

  it("all buttons are centered vertically in the zone", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    const zoneCenterY = BOTTOM_ZONE.y + BOTTOM_ZONE.height / 2;
    for (const btn of result.suitButtons) {
      const btnCenterY = btn.y + btn.height / 2;
      expect(btnCenterY).toBeCloseTo(zoneCenterY, 0);
    }
  });

  it("pass button is positioned after suit buttons", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    const lastSuitBtn = result.suitButtons[result.suitButtons.length - 1];
    if (lastSuitBtn) {
      expect(result.passButton.x).toBeGreaterThan(lastSuitBtn.x);
    }
  });

  it("button group is centered horizontally in zone", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    const firstBtn = result.suitButtons[0];
    const lastBtn = result.passButton;
    if (firstBtn) {
      const groupLeft = firstBtn.x;
      const groupRight = lastBtn.x + lastBtn.width;
      const groupCenter = (groupLeft + groupRight) / 2;
      const zoneCenter = BOTTOM_ZONE.x + BOTTOM_ZONE.width / 2;
      expect(groupCenter).toBeCloseTo(zoneCenter, 0);
    }
  });
});

// ====================================================================
// Bounds
// ====================================================================

describe("computeBiddingLayout bounds", () => {
  it("all buttons are within zone", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    const allButtons = [...result.suitButtons, result.passButton];
    for (const btn of allButtons) {
      expect(btn.x).toBeGreaterThanOrEqual(BOTTOM_ZONE.x);
      expect(btn.y).toBeGreaterThanOrEqual(BOTTOM_ZONE.y);
      expect(btn.x + btn.width).toBeLessThanOrEqual(BOTTOM_ZONE.x + BOTTOM_ZONE.width);
      expect(btn.y + btn.height).toBeLessThanOrEqual(BOTTOM_ZONE.y + BOTTOM_ZONE.height);
    }
  });

  it("buttons meet minimum tap target", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    const allButtons = [...result.suitButtons, result.passButton];
    for (const btn of allButtons) {
      expect(btn.width).toBeGreaterThanOrEqual(44);
      expect(btn.height).toBeGreaterThanOrEqual(44);
    }
  });
});

// ====================================================================
// Responsive
// ====================================================================

describe("computeBiddingLayout responsive", () => {
  it("works in a narrow portrait zone", () => {
    const portraitZone: Rect = { x: 0, y: 549, width: 390, height: 295 };
    const result = computeBiddingLayout(portraitZone);
    expect(result.suitButtons).toHaveLength(4);
    const allButtons = [...result.suitButtons, result.passButton];
    for (const btn of allButtons) {
      expect(btn.x + btn.width).toBeLessThanOrEqual(portraitZone.x + portraitZone.width);
    }
  });
});

// ====================================================================
// Immutability
// ====================================================================

describe("computeBiddingLayout immutability", () => {
  it("result is frozen", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("suitButtons array is frozen", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    expect(Object.isFrozen(result.suitButtons)).toBe(true);
  });

  it("each button rect is frozen", () => {
    const result = computeBiddingLayout(BOTTOM_ZONE);
    for (const btn of result.suitButtons) {
      expect(Object.isFrozen(btn)).toBe(true);
    }
    expect(Object.isFrozen(result.passButton)).toBe(true);
  });
});
