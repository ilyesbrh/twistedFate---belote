import { describe, it, expect } from "vitest";
import { computeTrickLayout, type TrickPosition } from "../src/components/trick/trick-layout.js";
import type { Rect } from "../src/layout.js";

// ====================================================================
// Trick Layout — pure math for played card positions in center zone.
// Cards placed at N/S/E/W positions matching the player who played them.
// Positions: "south" (human), "north" (partner), "west" (left), "east" (right)
// ====================================================================

// Baseline center zone at 844x390 landscape
const CENTER_ZONE: Rect = { x: 127, y: 70, width: 590, height: 211 };

const ALL_POSITIONS: TrickPosition[] = ["south", "north", "west", "east"];

// ====================================================================
// Basic contract
// ====================================================================

describe("computeTrickLayout basic contract", () => {
  it("returns 4 slot positions (one per player seat)", () => {
    const result = computeTrickLayout(CENTER_ZONE);
    expect(Object.keys(result.slots)).toHaveLength(4);
    expect(result.slots.south).toBeDefined();
    expect(result.slots.north).toBeDefined();
    expect(result.slots.west).toBeDefined();
    expect(result.slots.east).toBeDefined();
  });

  it("each slot has x, y, rotation", () => {
    const result = computeTrickLayout(CENTER_ZONE);
    for (const pos of ALL_POSITIONS) {
      const slot = result.slots[pos];
      expect(typeof slot.x).toBe("number");
      expect(typeof slot.y).toBe("number");
      expect(typeof slot.rotation).toBe("number");
      expect(Number.isFinite(slot.x)).toBe(true);
      expect(Number.isFinite(slot.y)).toBe(true);
      expect(Number.isFinite(slot.rotation)).toBe(true);
    }
  });

  it("returns cardWidth and cardHeight metadata", () => {
    const result = computeTrickLayout(CENTER_ZONE);
    expect(result.cardWidth).toBeGreaterThan(0);
    expect(result.cardHeight).toBeGreaterThan(0);
  });
});

// ====================================================================
// Spatial positions
// ====================================================================

describe("computeTrickLayout spatial positions", () => {
  const result = computeTrickLayout(CENTER_ZONE);
  const zoneCenterX = CENTER_ZONE.x + CENTER_ZONE.width / 2;
  const zoneCenterY = CENTER_ZONE.y + CENTER_ZONE.height / 2;

  it("south (human) is below center", () => {
    expect(result.slots.south.y).toBeGreaterThan(zoneCenterY);
  });

  it("north (partner) is above center", () => {
    expect(result.slots.north.y).toBeLessThan(zoneCenterY);
  });

  it("west (left opponent) is left of center", () => {
    expect(result.slots.west.x).toBeLessThan(zoneCenterX);
  });

  it("east (right opponent) is right of center", () => {
    expect(result.slots.east.x).toBeGreaterThan(zoneCenterX);
  });

  it("north and south are roughly horizontally centered", () => {
    expect(result.slots.north.x).toBeCloseTo(zoneCenterX, -1);
    expect(result.slots.south.x).toBeCloseTo(zoneCenterX, -1);
  });

  it("west and east are roughly vertically centered", () => {
    expect(result.slots.west.y).toBeCloseTo(zoneCenterY, -1);
    expect(result.slots.east.y).toBeCloseTo(zoneCenterY, -1);
  });
});

// ====================================================================
// Rotation
// ====================================================================

describe("computeTrickLayout card rotation", () => {
  const result = computeTrickLayout(CENTER_ZONE);

  it("south and north cards have zero rotation (upright)", () => {
    expect(result.slots.south.rotation).toBe(0);
    expect(result.slots.north.rotation).toBe(0);
  });

  it("west card is rotated 90° clockwise", () => {
    expect(result.slots.west.rotation).toBeCloseTo(Math.PI / 2, 5);
  });

  it("east card is rotated 90° counter-clockwise", () => {
    expect(result.slots.east.rotation).toBeCloseTo(-Math.PI / 2, 5);
  });
});

// ====================================================================
// All slots within zone bounds
// ====================================================================

describe("computeTrickLayout bounds", () => {
  it("all slots are within center zone", () => {
    const result = computeTrickLayout(CENTER_ZONE);
    for (const pos of ALL_POSITIONS) {
      const slot = result.slots[pos];
      expect(slot.x).toBeGreaterThanOrEqual(CENTER_ZONE.x);
      expect(slot.x).toBeLessThanOrEqual(CENTER_ZONE.x + CENTER_ZONE.width);
      expect(slot.y).toBeGreaterThanOrEqual(CENTER_ZONE.y);
      expect(slot.y).toBeLessThanOrEqual(CENTER_ZONE.y + CENTER_ZONE.height);
    }
  });
});

// ====================================================================
// Responsive
// ====================================================================

describe("computeTrickLayout responsive", () => {
  it("works in a smaller center zone", () => {
    const smallZone: Rect = { x: 47, y: 211, width: 296, height: 338 };
    const result = computeTrickLayout(smallZone);
    for (const pos of ALL_POSITIONS) {
      const slot = result.slots[pos];
      expect(slot.x).toBeGreaterThanOrEqual(smallZone.x);
      expect(slot.x).toBeLessThanOrEqual(smallZone.x + smallZone.width);
      expect(slot.y).toBeGreaterThanOrEqual(smallZone.y);
      expect(slot.y).toBeLessThanOrEqual(smallZone.y + smallZone.height);
    }
  });

  it("card height scales with zone dimensions", () => {
    const smallZone: Rect = { x: 0, y: 0, width: 300, height: 150 };
    const bigZone: Rect = { x: 0, y: 0, width: 600, height: 300 };
    const smallResult = computeTrickLayout(smallZone);
    const bigResult = computeTrickLayout(bigZone);
    expect(bigResult.cardHeight).toBeGreaterThan(smallResult.cardHeight);
  });
});

// ====================================================================
// Immutability
// ====================================================================

describe("computeTrickLayout immutability", () => {
  it("result is frozen", () => {
    const result = computeTrickLayout(CENTER_ZONE);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("slots object is frozen", () => {
    const result = computeTrickLayout(CENTER_ZONE);
    expect(Object.isFrozen(result.slots)).toBe(true);
  });

  it("each slot is frozen", () => {
    const result = computeTrickLayout(CENTER_ZONE);
    for (const pos of ALL_POSITIONS) {
      expect(Object.isFrozen(result.slots[pos])).toBe(true);
    }
  });
});
