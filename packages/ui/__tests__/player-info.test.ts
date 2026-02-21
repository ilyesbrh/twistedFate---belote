import { describe, it, expect } from "vitest";
import { teamForSeat, type PlayerSeat } from "../src/components/player-info/player-info.js";

// ====================================================================
// PlayerInfo — unit tests for pure helper functions.
// The PlayerInfo class itself is canvas-dependent (verified via Storybook).
// ====================================================================

describe("teamForSeat", () => {
  it("south is team1", () => {
    expect(teamForSeat("south")).toBe("team1");
  });

  it("north is team1 (partner)", () => {
    expect(teamForSeat("north")).toBe("team1");
  });

  it("west is team2", () => {
    expect(teamForSeat("west")).toBe("team2");
  });

  it("east is team2", () => {
    expect(teamForSeat("east")).toBe("team2");
  });

  it("all seats return valid team", () => {
    const seats: PlayerSeat[] = ["south", "north", "west", "east"];
    for (const seat of seats) {
      expect(["team1", "team2"]).toContain(teamForSeat(seat));
    }
  });
});
