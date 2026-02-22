import { describe, it, expect } from "vitest";
import { ALL_RANKS } from "@belote/core";
import type { Rank } from "@belote/core";
import { pipPositions } from "../src/pip-layout.js";
import type { PipPosition } from "../src/pip-layout.js";

// ====================================================================
// pipPositions — returns normalized (0-1) pip positions for each rank
// ====================================================================

describe("pipPositions", () => {
  // ---- Pip counts per rank -------------------------------------------

  it("returns 7 pips for rank 7", () => {
    expect(pipPositions("7")).toHaveLength(7);
  });

  it("returns 8 pips for rank 8", () => {
    expect(pipPositions("8")).toHaveLength(8);
  });

  it("returns 9 pips for rank 9", () => {
    expect(pipPositions("9")).toHaveLength(9);
  });

  it("returns 10 pips for rank 10", () => {
    expect(pipPositions("10")).toHaveLength(10);
  });

  it("returns empty array for jack", () => {
    expect(pipPositions("jack")).toHaveLength(0);
  });

  it("returns empty array for queen", () => {
    expect(pipPositions("queen")).toHaveLength(0);
  });

  it("returns empty array for king", () => {
    expect(pipPositions("king")).toHaveLength(0);
  });

  it("returns empty array for ace", () => {
    expect(pipPositions("ace")).toHaveLength(0);
  });

  // ---- Coordinate bounds ---------------------------------------------

  it("all positions have x in [0, 1]", () => {
    for (const rank of ALL_RANKS) {
      for (const pip of pipPositions(rank)) {
        expect(pip.x).toBeGreaterThanOrEqual(0);
        expect(pip.x).toBeLessThanOrEqual(1);
      }
    }
  });

  it("all positions have y in [0, 1]", () => {
    for (const rank of ALL_RANKS) {
      for (const pip of pipPositions(rank)) {
        expect(pip.y).toBeGreaterThanOrEqual(0);
        expect(pip.y).toBeLessThanOrEqual(1);
      }
    }
  });

  // ---- Inversion flag ------------------------------------------------

  it("bottom-half pips (y > 0.5) are inverted", () => {
    for (const rank of ALL_RANKS) {
      for (const pip of pipPositions(rank)) {
        if (pip.y > 0.5) {
          expect(pip.inverted).toBe(true);
        }
      }
    }
  });

  it("top-half pips (y < 0.5) are not inverted", () => {
    for (const rank of ALL_RANKS) {
      for (const pip of pipPositions(rank)) {
        if (pip.y < 0.5) {
          expect(pip.inverted).toBe(false);
        }
      }
    }
  });

  it("center pips (y === 0.5) are not inverted", () => {
    for (const rank of ALL_RANKS) {
      for (const pip of pipPositions(rank)) {
        if (pip.y === 0.5) {
          expect(pip.inverted).toBe(false);
        }
      }
    }
  });

  // ---- Symmetry ------------------------------------------------------

  it("pip layouts are vertically symmetric", () => {
    const numberRanks: Rank[] = ["7", "8", "9", "10"];
    for (const rank of numberRanks) {
      const pips = pipPositions(rank);
      // For each pip in the top half, there should be a corresponding pip
      // in the bottom half mirrored around y=0.5
      const topPips = pips.filter((p) => p.y < 0.5);
      const bottomPips = pips.filter((p) => p.y > 0.5);
      expect(topPips.length).toBe(bottomPips.length);

      for (const top of topPips) {
        const mirroredY = 1 - top.y;
        const match = bottomPips.find(
          (b) => Math.abs(b.x - top.x) < 0.001 && Math.abs(b.y - mirroredY) < 0.001,
        );
        expect(match).toBeDefined();
      }
    }
  });

  // ---- Frozen result -------------------------------------------------

  it("returns a frozen array", () => {
    expect(Object.isFrozen(pipPositions("7"))).toBe(true);
  });

  it("returns a new reference each call", () => {
    expect(pipPositions("7")).not.toBe(pipPositions("7"));
  });

  // ---- Handles every rank --------------------------------------------

  it("handles every rank in ALL_RANKS without throwing", () => {
    for (const rank of ALL_RANKS) {
      expect(() => pipPositions(rank)).not.toThrow();
    }
  });
});
