import { describe, it, expect } from "vitest";
import { ALL_SUITS, ALL_RANKS } from "@belote/core";
import type { Suit, Rank } from "@belote/core";
import {
  cardKey,
  suitSymbol,
  suitColor,
  rankDisplay,
  CARD_BACK_KEY,
  ALL_CARD_KEYS,
} from "../src/card-textures.js";
import { THEME } from "../src/theme.js";

// ====================================================================
// cardKey
// ====================================================================

describe("cardKey", () => {
  it("returns 'hearts-ace' for hearts + ace", () => {
    expect(cardKey("hearts", "ace")).toBe("hearts-ace");
  });

  it("returns 'clubs-7' for clubs + 7", () => {
    expect(cardKey("clubs", "7")).toBe("clubs-7");
  });

  it("returns 'diamonds-queen' for diamonds + queen", () => {
    expect(cardKey("diamonds", "queen")).toBe("diamonds-queen");
  });

  it("returns 'spades-10' for spades + 10", () => {
    expect(cardKey("spades", "10")).toBe("spades-10");
  });

  it("contains the suit in the key", () => {
    for (const suit of ALL_SUITS) {
      const key = cardKey(suit, "ace");
      expect(key).toContain(suit);
    }
  });

  it("contains the rank in the key", () => {
    for (const rank of ALL_RANKS) {
      const key = cardKey("hearts", rank);
      expect(key).toContain(rank);
    }
  });

  it("produces 32 unique keys for all suit+rank combinations", () => {
    const keys = new Set<string>();
    for (const suit of ALL_SUITS) {
      for (const rank of ALL_RANKS) {
        keys.add(cardKey(suit, rank));
      }
    }
    expect(keys.size).toBe(32);
  });
});

// ====================================================================
// suitSymbol
// ====================================================================

describe("suitSymbol", () => {
  it("returns ♥ for hearts", () => {
    expect(suitSymbol("hearts")).toBe("♥");
  });

  it("returns ♦ for diamonds", () => {
    expect(suitSymbol("diamonds")).toBe("♦");
  });

  it("returns ♣ for clubs", () => {
    expect(suitSymbol("clubs")).toBe("♣");
  });

  it("returns ♠ for spades", () => {
    expect(suitSymbol("spades")).toBe("♠");
  });
});

// ====================================================================
// suitColor
// ====================================================================

describe("suitColor", () => {
  it("returns theme red for hearts", () => {
    expect(suitColor("hearts")).toBe(THEME.colors.suit.red);
  });

  it("returns theme red for diamonds", () => {
    expect(suitColor("diamonds")).toBe(THEME.colors.suit.red);
  });

  it("returns theme black for clubs", () => {
    expect(suitColor("clubs")).toBe(THEME.colors.suit.black);
  });

  it("returns theme black for spades", () => {
    expect(suitColor("spades")).toBe(THEME.colors.suit.black);
  });
});

// ====================================================================
// rankDisplay
// ====================================================================

describe("rankDisplay", () => {
  it("returns numeric ranks as-is", () => {
    expect(rankDisplay("7")).toBe("7");
    expect(rankDisplay("8")).toBe("8");
    expect(rankDisplay("9")).toBe("9");
    expect(rankDisplay("10")).toBe("10");
  });

  it("returns 'J' for jack", () => {
    expect(rankDisplay("jack")).toBe("J");
  });

  it("returns 'Q' for queen", () => {
    expect(rankDisplay("queen")).toBe("Q");
  });

  it("returns 'K' for king", () => {
    expect(rankDisplay("king")).toBe("K");
  });

  it("returns 'A' for ace", () => {
    expect(rankDisplay("ace")).toBe("A");
  });

  it("returns a non-empty string for every rank", () => {
    for (const rank of ALL_RANKS) {
      expect(rankDisplay(rank).length).toBeGreaterThan(0);
    }
  });
});

// ====================================================================
// CARD_BACK_KEY
// ====================================================================

describe("CARD_BACK_KEY", () => {
  it("equals 'card-back'", () => {
    expect(CARD_BACK_KEY).toBe("card-back");
  });
});

// ====================================================================
// ALL_CARD_KEYS
// ====================================================================

describe("ALL_CARD_KEYS", () => {
  it("contains exactly 32 entries", () => {
    expect(ALL_CARD_KEYS).toHaveLength(32);
  });

  it("every entry is unique", () => {
    const unique = new Set(ALL_CARD_KEYS);
    expect(unique.size).toBe(32);
  });

  it("every entry matches cardKey output for some suit+rank", () => {
    const expected = new Set<string>();
    for (const suit of ALL_SUITS) {
      for (const rank of ALL_RANKS) {
        expected.add(cardKey(suit, rank));
      }
    }
    for (const key of ALL_CARD_KEYS) {
      expect(expected.has(key)).toBe(true);
    }
  });

  it("is frozen", () => {
    expect(Object.isFrozen(ALL_CARD_KEYS)).toBe(true);
  });
});
