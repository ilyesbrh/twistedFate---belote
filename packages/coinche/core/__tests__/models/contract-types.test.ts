/**
 * Iteration 048 — ContractType card-point table tests.
 *
 * Pins correct points per docs/games/coinche/GAME_RULES.md §3:
 *   - sans-atout: J=0, A=19, others same as non-trump
 *   - tout-atout: J=14, 9=9, A=6, 10=5, K=3, Q=1, 8=0, 7=0
 *   - suit: existing trump/non-trump behaviour unchanged
 *
 * Written RED before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getCoincheCardPoints, createCard, ALL_RANKS } from "../../src/models/card.js";
import { calculateRoundScore } from "../../src/models/scoring.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { Card, Suit, Rank } from "../../src/models/card.js";
import type { PlayerPosition } from "../../src/models/player.js";
import type { Trick, PlayedCard } from "../../src/models/trick.js";
import type { Contract } from "../../src/models/bid.js";
import type { BidValue } from "../../src/models/bid.js";
import type { IdGenerator } from "../../src/utils/id.js";

// ── Helpers ────────────────────────────────────────────────────────────────

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 1 });
});

function card(suit: Suit, rank: Rank): Card {
  return createCard(suit, rank, idGen);
}

function trick(
  cards: Array<{ suit: Suit; rank: Rank; pos: PlayerPosition }>,
  winner: PlayerPosition,
): Trick {
  const played: PlayedCard[] = cards.map((e) =>
    Object.freeze({ card: card(e.suit, e.rank), playerPosition: e.pos }),
  );
  return Object.freeze({
    id: idGen.generateId("trick"),
    leadingPlayerPosition: (cards[0]?.pos ?? ("north" as PlayerPosition)) as PlayerPosition,
    trumpSuit: "hearts" as const,
    contractType: "suit" as const,
    isCapot: false,
    cards: Object.freeze(played),
    state: "completed" as const,
    winnerPosition: winner,
  });
}

function makeContract(
  value: BidValue,
  suit: Suit,
  bidderPosition: PlayerPosition,
  coincheLevel: 1 | 2 | 4,
  contractType: "suit" | "sans-atout" | "tout-atout",
): Contract {
  return Object.freeze({
    id: "contract-1",
    suit,
    value,
    bidderPosition,
    coincheLevel,
    contractType,
    isCapot: false,
  });
}

/** 8 tricks all won by the contracting team (south+north) */
function makeEightTricks(cards: Array<{ suit: Suit; rank: Rank; pos: PlayerPosition }>): Trick[] {
  // Distribute cards evenly into 8 tricks of 4 cards each
  const tricks: Trick[] = [];
  for (let i = 0; i < 8; i++) {
    const slice = cards.slice(i * 4, i * 4 + 4);
    // Use 4 default cards if not enough provided
    const trickCards =
      slice.length === 4
        ? slice
        : [
            { suit: "spades" as Suit, rank: "7" as Rank, pos: "south" as PlayerPosition },
            { suit: "hearts" as Suit, rank: "7" as Rank, pos: "west" as PlayerPosition },
            { suit: "diamonds" as Suit, rank: "7" as Rank, pos: "north" as PlayerPosition },
            { suit: "clubs" as Suit, rank: "7" as Rank, pos: "east" as PlayerPosition },
          ];
    tricks.push(trick(trickCards, "south"));
  }
  return tricks;
}

// ── Sans-Atout point table ─────────────────────────────────────────────────

describe("getCoincheCardPoints — sans-atout", () => {
  it("Jack scores 0 in every suit", () => {
    expect(getCoincheCardPoints(card("hearts", "jack"), null, "sans-atout")).toBe(0);
    expect(getCoincheCardPoints(card("spades", "jack"), null, "sans-atout")).toBe(0);
    expect(getCoincheCardPoints(card("diamonds", "jack"), null, "sans-atout")).toBe(0);
    expect(getCoincheCardPoints(card("clubs", "jack"), null, "sans-atout")).toBe(0);
  });

  it("Ace scores 19 in every suit", () => {
    expect(getCoincheCardPoints(card("hearts", "ace"), null, "sans-atout")).toBe(19);
    expect(getCoincheCardPoints(card("spades", "ace"), null, "sans-atout")).toBe(19);
    expect(getCoincheCardPoints(card("diamonds", "ace"), null, "sans-atout")).toBe(19);
    expect(getCoincheCardPoints(card("clubs", "ace"), null, "sans-atout")).toBe(19);
  });

  it("10, K, Q keep their non-trump values", () => {
    expect(getCoincheCardPoints(card("hearts", "10"), null, "sans-atout")).toBe(10);
    expect(getCoincheCardPoints(card("hearts", "king"), null, "sans-atout")).toBe(4);
    expect(getCoincheCardPoints(card("hearts", "queen"), null, "sans-atout")).toBe(3);
  });

  it("9, 8, 7 score 0", () => {
    expect(getCoincheCardPoints(card("hearts", "9"), null, "sans-atout")).toBe(0);
    expect(getCoincheCardPoints(card("hearts", "8"), null, "sans-atout")).toBe(0);
    expect(getCoincheCardPoints(card("hearts", "7"), null, "sans-atout")).toBe(0);
  });

  it("per-suit total is 36 (4 × 36 = 144 deck points)", () => {
    let suitTotal = 0;
    for (const rank of ALL_RANKS) {
      suitTotal += getCoincheCardPoints(card("hearts", rank), null, "sans-atout");
    }
    expect(suitTotal).toBe(36);
  });
});

// ── Tout-Atout point table ─────────────────────────────────────────────────

describe("getCoincheCardPoints — tout-atout", () => {
  it("Jack scores 14 in every suit", () => {
    expect(getCoincheCardPoints(card("hearts", "jack"), null, "tout-atout")).toBe(14);
    expect(getCoincheCardPoints(card("spades", "jack"), null, "tout-atout")).toBe(14);
    expect(getCoincheCardPoints(card("diamonds", "jack"), null, "tout-atout")).toBe(14);
    expect(getCoincheCardPoints(card("clubs", "jack"), null, "tout-atout")).toBe(14);
  });

  it("9=9, A=6, 10=5, K=3, Q=1, 8=0, 7=0 for all suits", () => {
    const c = (rank: Rank) => card("hearts", rank);
    expect(getCoincheCardPoints(c("9"), null, "tout-atout")).toBe(9);
    expect(getCoincheCardPoints(c("ace"), null, "tout-atout")).toBe(6);
    expect(getCoincheCardPoints(c("10"), null, "tout-atout")).toBe(5);
    expect(getCoincheCardPoints(c("king"), null, "tout-atout")).toBe(3);
    expect(getCoincheCardPoints(c("queen"), null, "tout-atout")).toBe(1);
    expect(getCoincheCardPoints(c("8"), null, "tout-atout")).toBe(0);
    expect(getCoincheCardPoints(c("7"), null, "tout-atout")).toBe(0);
  });

  it("per-suit total is 38 (4 × 38 = 152 deck points)", () => {
    let suitTotal = 0;
    for (const rank of ALL_RANKS) {
      suitTotal += getCoincheCardPoints(card("hearts", rank), null, "tout-atout");
    }
    expect(suitTotal).toBe(38);
  });
});

// ── Suit (regular) contract — backward-compat ──────────────────────────────

describe("getCoincheCardPoints — suit contract", () => {
  it("trump J = 20, non-trump J = 2 (backward-compatible)", () => {
    expect(getCoincheCardPoints(card("hearts", "jack"), "hearts", "suit")).toBe(20);
    expect(getCoincheCardPoints(card("spades", "jack"), "hearts", "suit")).toBe(2);
  });

  it("trump 9 = 14, non-trump 9 = 0", () => {
    expect(getCoincheCardPoints(card("hearts", "9"), "hearts", "suit")).toBe(14);
    expect(getCoincheCardPoints(card("spades", "9"), "hearts", "suit")).toBe(0);
  });
});

// ── calculateRoundScore integration ───────────────────────────────────────

describe("calculateRoundScore with sans-atout contract", () => {
  it("jack cards contribute 0 to contracting team's score", () => {
    // 8 tricks; every trick has a jack played — with SA that jack = 0 points
    // Fill tricks with: contracting team always wins, one jack per trick
    const cards: Array<{ suit: Suit; rank: Rank; pos: PlayerPosition }> = [];
    for (let i = 0; i < 8; i++) {
      cards.push(
        { suit: "hearts", rank: "jack", pos: "south" },
        { suit: "spades", rank: "7", pos: "west" },
        { suit: "diamonds", rank: "7", pos: "north" },
        { suit: "clubs", rank: "7", pos: "east" },
      );
    }
    const tricks = makeEightTricks(cards);

    // SA contract: south bids 80 sans-atout
    const contract = makeContract(80, "hearts", "south", 1, "sans-atout");
    const result = calculateRoundScore(tricks, contract);

    // 8 jacks (hearts) × 0 pts each = 0 jack contribution
    // Contracting (south+north) wins all 8 tricks
    // Expected contracting card pts = 0 (from jacks) + 10 (last trick) = 10
    expect(result.contractingTeamPoints).toBe(10);
  });
});

describe("calculateRoundScore with tout-atout contract", () => {
  it("jack of any suit scores 14 in tout-atout", () => {
    // 8 tricks; every trick has a jack of different suits played by south
    const cards: Array<{ suit: Suit; rank: Rank; pos: PlayerPosition }> = [];
    const jackSuits: Suit[] = [
      "hearts",
      "spades",
      "diamonds",
      "clubs",
      "hearts",
      "spades",
      "diamonds",
      "clubs",
    ];
    for (let i = 0; i < 8; i++) {
      const jackSuit = jackSuits[i] ?? "hearts";
      cards.push(
        { suit: jackSuit, rank: "jack", pos: "south" },
        { suit: "hearts", rank: "7", pos: "west" },
        { suit: "diamonds", rank: "7", pos: "north" },
        { suit: "clubs", rank: "7", pos: "east" },
      );
    }
    const tricks = makeEightTricks(cards);

    // TA contract: south bids 80 tout-atout
    const contract = makeContract(80, "hearts", "south", 1, "tout-atout");
    const result = calculateRoundScore(tricks, contract);

    // 8 jacks × 14 pts + 10 last-trick = 122 contracting team points
    expect(result.contractingTeamPoints).toBe(122);
  });
});
