import { describe, it, expect, beforeEach } from "vitest";
import {
  ALL_SUITS,
  ALL_RANKS,
  TRUMP_POINTS,
  NON_TRUMP_POINTS,
  TRUMP_ORDER,
  NON_TRUMP_ORDER,
  createCard,
  getCardPoints,
  getCardRankOrder,
  createDeck,
  shuffleDeck,
} from "../../src/models/card.js";
import type { Card, Suit, Rank } from "../../src/models/card.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";

describe("Card Entity", () => {
  let idGenerator: IdGenerator;

  beforeEach(() => {
    idGenerator = createIdGenerator({ seed: 42 });
  });

  // ==================================================
  // SECTION 1: CONSTANTS VALIDATION
  // ==================================================
  describe("constants", () => {
    it("should define exactly 4 suits", () => {
      expect(ALL_SUITS).toHaveLength(4);
      expect(ALL_SUITS).toContain("hearts");
      expect(ALL_SUITS).toContain("diamonds");
      expect(ALL_SUITS).toContain("clubs");
      expect(ALL_SUITS).toContain("spades");
    });

    it("should define exactly 8 ranks", () => {
      expect(ALL_RANKS).toHaveLength(8);
      expect(ALL_RANKS).toContain("7");
      expect(ALL_RANKS).toContain("8");
      expect(ALL_RANKS).toContain("9");
      expect(ALL_RANKS).toContain("10");
      expect(ALL_RANKS).toContain("jack");
      expect(ALL_RANKS).toContain("queen");
      expect(ALL_RANKS).toContain("king");
      expect(ALL_RANKS).toContain("ace");
    });

    it("should define trump points for all ranks", () => {
      for (const rank of ALL_RANKS) {
        expect(TRUMP_POINTS[rank]).toBeDefined();
        expect(typeof TRUMP_POINTS[rank]).toBe("number");
      }
    });

    it("should define non-trump points for all ranks", () => {
      for (const rank of ALL_RANKS) {
        expect(NON_TRUMP_POINTS[rank]).toBeDefined();
        expect(typeof NON_TRUMP_POINTS[rank]).toBe("number");
      }
    });

    it("should have correct trump point values", () => {
      expect(TRUMP_POINTS["7"]).toBe(0);
      expect(TRUMP_POINTS["8"]).toBe(0);
      expect(TRUMP_POINTS["9"]).toBe(14);
      expect(TRUMP_POINTS["10"]).toBe(10);
      expect(TRUMP_POINTS.jack).toBe(20);
      expect(TRUMP_POINTS.queen).toBe(3);
      expect(TRUMP_POINTS.king).toBe(4);
      expect(TRUMP_POINTS.ace).toBe(11);
    });

    it("should have correct non-trump point values", () => {
      expect(NON_TRUMP_POINTS["7"]).toBe(0);
      expect(NON_TRUMP_POINTS["8"]).toBe(0);
      expect(NON_TRUMP_POINTS["9"]).toBe(0);
      expect(NON_TRUMP_POINTS["10"]).toBe(10);
      expect(NON_TRUMP_POINTS.jack).toBe(2);
      expect(NON_TRUMP_POINTS.queen).toBe(3);
      expect(NON_TRUMP_POINTS.king).toBe(4);
      expect(NON_TRUMP_POINTS.ace).toBe(11);
    });

    it("should have total trump points of 62 per suit", () => {
      const total = ALL_RANKS.reduce((sum, rank) => sum + TRUMP_POINTS[rank], 0);
      expect(total).toBe(62);
    });

    it("should have total non-trump points of 30 per suit", () => {
      const total = ALL_RANKS.reduce((sum, rank) => sum + NON_TRUMP_POINTS[rank], 0);
      expect(total).toBe(30);
    });

    it("should define trump order with 8 ranks", () => {
      expect(TRUMP_ORDER).toHaveLength(8);
    });

    it("should define non-trump order with 8 ranks", () => {
      expect(NON_TRUMP_ORDER).toHaveLength(8);
    });

    it("should have jack as highest trump rank", () => {
      expect(TRUMP_ORDER[TRUMP_ORDER.length - 1]).toBe("jack");
    });

    it("should have 9 as second-highest trump rank", () => {
      expect(TRUMP_ORDER[TRUMP_ORDER.length - 2]).toBe("9");
    });

    it("should have ace as highest non-trump rank", () => {
      expect(NON_TRUMP_ORDER[NON_TRUMP_ORDER.length - 1]).toBe("ace");
    });
  });

  // ==================================================
  // SECTION 2: CARD CREATION
  // ==================================================
  describe("createCard", () => {
    it("should create a card with the correct suit and rank", () => {
      const card = createCard("hearts", "ace", idGenerator);
      expect(card.suit).toBe("hearts");
      expect(card.rank).toBe("ace");
    });

    it("should assign a unique ID with card prefix", () => {
      const card = createCard("spades", "jack", idGenerator);
      expect(card.id).toMatch(/^card_[a-z0-9]+$/);
    });

    it("should create different IDs for different cards", () => {
      const card1 = createCard("hearts", "ace", idGenerator);
      const card2 = createCard("hearts", "king", idGenerator);
      expect(card1.id).not.toBe(card2.id);
    });

    it("should produce deterministic IDs with seeded generator", () => {
      const gen1 = createIdGenerator({ seed: 99 });
      const gen2 = createIdGenerator({ seed: 99 });

      const card1 = createCard("diamonds", "10", gen1);
      const card2 = createCard("diamonds", "10", gen2);
      expect(card1.id).toBe(card2.id);
    });

    it("should create cards for all suit/rank combinations", () => {
      for (const suit of ALL_SUITS) {
        for (const rank of ALL_RANKS) {
          const card = createCard(suit, rank, idGenerator);
          expect(card.suit).toBe(suit);
          expect(card.rank).toBe(rank);
          expect(card.id).toBeTruthy();
        }
      }
    });

    it("should return a readonly card (immutable)", () => {
      const card = createCard("clubs", "queen", idGenerator);
      expect(Object.isFrozen(card)).toBe(true);
    });
  });

  // ==================================================
  // SECTION 3: CARD POINTS
  // ==================================================
  describe("getCardPoints", () => {
    it("should return trump points when card suit matches trump", () => {
      const card = createCard("hearts", "jack", idGenerator);
      expect(getCardPoints(card, "hearts")).toBe(20);
    });

    it("should return non-trump points when card suit does not match trump", () => {
      const card = createCard("hearts", "jack", idGenerator);
      expect(getCardPoints(card, "spades")).toBe(2);
    });

    it("should return non-trump points when there is no trump", () => {
      const card = createCard("hearts", "jack", idGenerator);
      expect(getCardPoints(card, null)).toBe(2);
    });

    it("should return 14 for 9 of trump", () => {
      const card = createCard("diamonds", "9", idGenerator);
      expect(getCardPoints(card, "diamonds")).toBe(14);
    });

    it("should return 0 for 9 of non-trump", () => {
      const card = createCard("diamonds", "9", idGenerator);
      expect(getCardPoints(card, "clubs")).toBe(0);
    });

    it("should return correct points for all trump cards", () => {
      for (const rank of ALL_RANKS) {
        const card = createCard("hearts", rank, idGenerator);
        expect(getCardPoints(card, "hearts")).toBe(TRUMP_POINTS[rank]);
      }
    });

    it("should return correct points for all non-trump cards", () => {
      for (const rank of ALL_RANKS) {
        const card = createCard("hearts", rank, idGenerator);
        expect(getCardPoints(card, "spades")).toBe(NON_TRUMP_POINTS[rank]);
      }
    });
  });

  // ==================================================
  // SECTION 4: CARD RANK ORDER
  // ==================================================
  describe("getCardRankOrder", () => {
    it("should rank jack highest in trump", () => {
      const jack = createCard("hearts", "jack", idGenerator);
      const ace = createCard("hearts", "ace", idGenerator);
      expect(getCardRankOrder(jack, "hearts")).toBeGreaterThan(getCardRankOrder(ace, "hearts"));
    });

    it("should rank 9 second-highest in trump", () => {
      const nine = createCard("hearts", "9", idGenerator);
      const ace = createCard("hearts", "ace", idGenerator);
      expect(getCardRankOrder(nine, "hearts")).toBeGreaterThan(getCardRankOrder(ace, "hearts"));
    });

    it("should rank ace highest in non-trump", () => {
      const ace = createCard("hearts", "ace", idGenerator);
      const king = createCard("hearts", "king", idGenerator);
      expect(getCardRankOrder(ace, "spades")).toBeGreaterThan(getCardRankOrder(king, "spades"));
    });

    it("should rank 10 second-highest in non-trump", () => {
      const ten = createCard("hearts", "10", idGenerator);
      const king = createCard("hearts", "king", idGenerator);
      expect(getCardRankOrder(ten, "spades")).toBeGreaterThan(getCardRankOrder(king, "spades"));
    });

    it("should give a unique order to each rank in trump", () => {
      const orders = ALL_RANKS.map((rank) => {
        const card = createCard("hearts", rank, idGenerator);
        return getCardRankOrder(card, "hearts");
      });
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(8);
    });

    it("should give a unique order to each rank in non-trump", () => {
      const orders = ALL_RANKS.map((rank) => {
        const card = createCard("hearts", rank, idGenerator);
        return getCardRankOrder(card, "spades");
      });
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(8);
    });

    it("should produce correct full trump ordering", () => {
      const orderedRanks = TRUMP_ORDER;
      for (let i = 0; i < orderedRanks.length - 1; i++) {
        const lower = createCard("hearts", orderedRanks[i]!, idGenerator);
        const higher = createCard("hearts", orderedRanks[i + 1]!, idGenerator);
        expect(getCardRankOrder(lower, "hearts")).toBeLessThan(getCardRankOrder(higher, "hearts"));
      }
    });

    it("should produce correct full non-trump ordering", () => {
      const orderedRanks = NON_TRUMP_ORDER;
      for (let i = 0; i < orderedRanks.length - 1; i++) {
        const lower = createCard("hearts", orderedRanks[i]!, idGenerator);
        const higher = createCard("hearts", orderedRanks[i + 1]!, idGenerator);
        expect(getCardRankOrder(lower, "spades")).toBeLessThan(getCardRankOrder(higher, "spades"));
      }
    });

    it("should use non-trump order when no trump is set", () => {
      const ace = createCard("hearts", "ace", idGenerator);
      const jack = createCard("hearts", "jack", idGenerator);
      expect(getCardRankOrder(ace, null)).toBeGreaterThan(getCardRankOrder(jack, null));
    });
  });

  // ==================================================
  // SECTION 5: DECK CREATION
  // ==================================================
  describe("createDeck", () => {
    it("should create a deck of 32 cards", () => {
      const deck = createDeck(idGenerator);
      expect(deck).toHaveLength(32);
    });

    it("should contain all suit/rank combinations", () => {
      const deck = createDeck(idGenerator);
      for (const suit of ALL_SUITS) {
        for (const rank of ALL_RANKS) {
          const found = deck.some((card) => card.suit === suit && card.rank === rank);
          expect(found).toBe(true);
        }
      }
    });

    it("should have unique IDs for all cards", () => {
      const deck = createDeck(idGenerator);
      const ids = new Set(deck.map((card) => card.id));
      expect(ids.size).toBe(32);
    });

    it("should have all IDs prefixed with card_", () => {
      const deck = createDeck(idGenerator);
      for (const card of deck) {
        expect(card.id.startsWith("card_")).toBe(true);
      }
    });

    it("should produce a deterministic deck with the same seed", () => {
      const gen1 = createIdGenerator({ seed: 7 });
      const gen2 = createIdGenerator({ seed: 7 });
      const deck1 = createDeck(gen1);
      const deck2 = createDeck(gen2);

      expect(deck1.map((c) => c.id)).toEqual(deck2.map((c) => c.id));
      expect(deck1.map((c) => `${c.suit}_${c.rank}`)).toEqual(
        deck2.map((c) => `${c.suit}_${c.rank}`),
      );
    });

    it("should contain 8 cards per suit", () => {
      const deck = createDeck(idGenerator);
      for (const suit of ALL_SUITS) {
        const suitCards = deck.filter((card) => card.suit === suit);
        expect(suitCards).toHaveLength(8);
      }
    });
  });

  // ==================================================
  // SECTION 6: DECK SHUFFLE
  // ==================================================
  describe("shuffleDeck", () => {
    it("should return a new array (not mutate original)", () => {
      const deck = createDeck(idGenerator);
      const original = [...deck];

      const rng = (): number => Math.random();
      const shuffled = shuffleDeck(deck, rng);

      expect(shuffled).not.toBe(deck);
      expect(deck.map((c) => c.id)).toEqual(original.map((c) => c.id));
    });

    it("should contain the same 32 cards after shuffle", () => {
      const deck = createDeck(idGenerator);
      const rng = (): number => Math.random();
      const shuffled = shuffleDeck(deck, rng);

      expect(shuffled).toHaveLength(32);
      const originalIds = new Set(deck.map((c) => c.id));
      const shuffledIds = new Set(shuffled.map((c) => c.id));
      expect(shuffledIds).toEqual(originalIds);
    });

    it("should produce a deterministic shuffle with seeded RNG", () => {
      const gen = createIdGenerator({ seed: 1 });
      const deck = createDeck(gen);

      const makePrng = (seed: number): (() => number) => {
        let state = seed | 0;
        return (): number => {
          state = (state + 0x6d2b79f5) | 0;
          let t = Math.imul(state ^ (state >>> 15), 1 | state);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      };

      const shuffle1 = shuffleDeck(deck, makePrng(123));
      const shuffle2 = shuffleDeck(deck, makePrng(123));

      expect(shuffle1.map((c) => c.id)).toEqual(shuffle2.map((c) => c.id));
    });

    it("should produce different orderings with different seeds", () => {
      const gen = createIdGenerator({ seed: 1 });
      const deck = createDeck(gen);

      const makePrng = (seed: number): (() => number) => {
        let state = seed | 0;
        return (): number => {
          state = (state + 0x6d2b79f5) | 0;
          let t = Math.imul(state ^ (state >>> 15), 1 | state);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      };

      const shuffle1 = shuffleDeck(deck, makePrng(1));
      const shuffle2 = shuffleDeck(deck, makePrng(2));

      // Different orderings (overwhelmingly likely with different seeds)
      const ids1 = shuffle1.map((c) => c.id).join(",");
      const ids2 = shuffle2.map((c) => c.id).join(",");
      expect(ids1).not.toBe(ids2);
    });

    it("should handle an empty deck", () => {
      const rng = (): number => Math.random();
      const shuffled = shuffleDeck([], rng);
      expect(shuffled).toHaveLength(0);
    });

    it("should handle a single-card deck", () => {
      const card = createCard("hearts", "ace", idGenerator);
      const rng = (): number => Math.random();
      const shuffled = shuffleDeck([card], rng);
      expect(shuffled).toHaveLength(1);
      expect(shuffled[0]!.id).toBe(card.id);
    });
  });
});
