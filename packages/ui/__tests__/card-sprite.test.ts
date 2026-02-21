import { describe, it, expect } from "vitest";
import { ALL_SUITS, ALL_RANKS } from "@belote/core";
import { cardLabel, CARD_BACK_LABEL } from "../src/card-sprite.js";

// ====================================================================
// cardLabel
// ====================================================================

describe("cardLabel", () => {
  it("returns 'card-hearts-ace' for hearts + ace", () => {
    expect(cardLabel("hearts", "ace")).toBe("card-hearts-ace");
  });

  it("returns 'card-spades-7' for spades + 7", () => {
    expect(cardLabel("spades", "7")).toBe("card-spades-7");
  });

  it("returns 'card-diamonds-queen' for diamonds + queen", () => {
    expect(cardLabel("diamonds", "queen")).toBe("card-diamonds-queen");
  });

  it("starts with 'card-' prefix", () => {
    expect(cardLabel("clubs", "10")).toMatch(/^card-/);
  });

  it("contains the suit", () => {
    for (const suit of ALL_SUITS) {
      expect(cardLabel(suit, "ace")).toContain(suit);
    }
  });

  it("contains the rank", () => {
    for (const rank of ALL_RANKS) {
      expect(cardLabel("hearts", rank)).toContain(rank);
    }
  });

  it("produces 32 unique labels for all suit+rank combinations", () => {
    const labels = new Set<string>();
    for (const suit of ALL_SUITS) {
      for (const rank of ALL_RANKS) {
        labels.add(cardLabel(suit, rank));
      }
    }
    expect(labels.size).toBe(32);
  });
});

// ====================================================================
// CARD_BACK_LABEL
// ====================================================================

describe("CARD_BACK_LABEL", () => {
  it("equals 'card-back'", () => {
    expect(CARD_BACK_LABEL).toBe("card-back");
  });

  it("does not collide with any card label", () => {
    for (const suit of ALL_SUITS) {
      for (const rank of ALL_RANKS) {
        expect(cardLabel(suit, rank)).not.toBe(CARD_BACK_LABEL);
      }
    }
  });
});
