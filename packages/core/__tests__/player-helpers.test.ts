import { describe, it, expect } from "vitest";
import { getNextPlayerPosition, isOnSameTeam } from "../src/models/player-helpers.js";
import type { PlayerPosition } from "../src/models/player.js";

// ====================================================================
// player-helpers — position rotation and team membership utilities.
// ====================================================================

describe("getNextPlayerPosition", () => {
  it("returns 1 for position 0", () => {
    expect(getNextPlayerPosition(0 as PlayerPosition)).toBe(1);
  });

  it("returns 2 for position 1", () => {
    expect(getNextPlayerPosition(1 as PlayerPosition)).toBe(2);
  });

  it("returns 3 for position 2", () => {
    expect(getNextPlayerPosition(2 as PlayerPosition)).toBe(3);
  });

  it("wraps around: returns 0 for position 3", () => {
    expect(getNextPlayerPosition(3 as PlayerPosition)).toBe(0);
  });
});

describe("isOnSameTeam", () => {
  it("(0, 2) are on the same team", () => {
    expect(isOnSameTeam(0 as PlayerPosition, 2 as PlayerPosition)).toBe(true);
  });

  it("(1, 3) are on the same team", () => {
    expect(isOnSameTeam(1 as PlayerPosition, 3 as PlayerPosition)).toBe(true);
  });

  it("(0, 1) are not on the same team", () => {
    expect(isOnSameTeam(0 as PlayerPosition, 1 as PlayerPosition)).toBe(false);
  });

  it("(0, 3) are not on the same team", () => {
    expect(isOnSameTeam(0 as PlayerPosition, 3 as PlayerPosition)).toBe(false);
  });

  it("(1, 2) are not on the same team", () => {
    expect(isOnSameTeam(1 as PlayerPosition, 2 as PlayerPosition)).toBe(false);
  });

  it("(2, 3) are not on the same team", () => {
    expect(isOnSameTeam(2 as PlayerPosition, 3 as PlayerPosition)).toBe(false);
  });
});
