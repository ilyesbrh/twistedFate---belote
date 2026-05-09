/**
 * Iteration 054 — Capot scoring tests.
 *
 * Announced capot: 500 × coincheLevel (made) or 500 × coincheLevel (opponents, failed).
 * Unannounced capot: bidder wins all 8 tricks on a regular contract → 250 + bid value.
 * Belote (+20) preserved on top of capot scores.
 *
 * Written RED before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { calculateRoundScore } from "../../src/models/scoring.js";
import { createCard } from "../../src/models/card.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { Card, Suit, Rank } from "../../src/models/card.js";
import type { PlayerPosition } from "../../src/models/player.js";
import type { Trick, PlayedCard } from "../../src/models/trick.js";
import type { Contract } from "../../src/models/bid.js";
import type { BidValue } from "../../src/models/bid.js";
import type { IdGenerator } from "../../src/utils/id.js";

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 1 });
});

function card(suit: Suit, rank: Rank): Card {
  return createCard(suit, rank, idGen);
}

function makeTrick(
  trumpSuit: Suit,
  cards: Array<{ suit: Suit; rank: Rank; pos: PlayerPosition }>,
  winner: PlayerPosition,
): Trick {
  const played: PlayedCard[] = cards.map((e) =>
    Object.freeze({ card: card(e.suit, e.rank), playerPosition: e.pos }),
  );
  return Object.freeze({
    id: idGen.generateId("trick"),
    leadingPlayerPosition: cards[0]!.pos,
    trumpSuit,
    contractType: "suit" as const,
    cards: Object.freeze(played),
    state: "completed" as const,
    winnerPosition: winner,
  });
}

/** 8 simple zero-point tricks, all won by given winners array (length 8). */
function eightZeroTricks(winners: readonly PlayerPosition[]): Trick[] {
  return winners.map((winner, i) =>
    makeTrick(
      "hearts",
      [
        { suit: "spades", rank: "7", pos: 0 as PlayerPosition },
        { suit: "clubs", rank: "7", pos: 1 as PlayerPosition },
        { suit: "diamonds", rank: "7", pos: 2 as PlayerPosition },
        { suit: "spades", rank: "8", pos: 3 as PlayerPosition },
      ].map((c, j) => ({ ...c, pos: ((i * 4 + j) % 4) as PlayerPosition })),
      winner,
    ),
  );
}

function capotContract(
  suit: Suit,
  bidderPosition: PlayerPosition,
  coincheLevel: 1 | 2 | 4 = 1,
): Contract {
  return Object.freeze({
    id: "contract-capot",
    suit,
    value: 160 as BidValue,
    bidderPosition,
    coincheLevel,
    contractType: "suit" as const,
    isCapot: true,
  });
}

function regularContract(
  value: BidValue,
  suit: Suit,
  bidderPosition: PlayerPosition,
  coincheLevel: 1 | 2 | 4 = 1,
): Contract {
  return Object.freeze({
    id: "contract-regular",
    suit,
    value,
    bidderPosition,
    coincheLevel,
    contractType: "suit" as const,
    isCapot: false,
  });
}

// ── Announced capot ────────────────────────────────────────────────────────────

describe("calculateRoundScore — announced capot made (×1)", () => {
  it("bidder wins all 8 tricks → contractingTeamFinalScore = 500", () => {
    const tricks = eightZeroTricks([0, 0, 0, 0, 0, 0, 0, 0]);
    const contract = capotContract("hearts", 0, 1);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(true);
    expect(result.contractingTeamFinalScore).toBe(500);
    expect(result.opponentTeamFinalScore).toBe(0);
  });
});

describe("calculateRoundScore — announced capot failed (×1)", () => {
  it("bidder loses 1+ tricks → opponentTeamFinalScore = 500", () => {
    const tricks = eightZeroTricks([0, 0, 0, 0, 0, 0, 0, 1]);
    const contract = capotContract("hearts", 0, 1);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(false);
    expect(result.contractingTeamFinalScore).toBe(0);
    expect(result.opponentTeamFinalScore).toBe(500);
  });
});

describe("calculateRoundScore — announced capot coinched (×2) made", () => {
  it("bidder wins all 8 → contractingTeamFinalScore = 1000", () => {
    const tricks = eightZeroTricks([0, 0, 0, 0, 0, 0, 0, 0]);
    const contract = capotContract("hearts", 0, 2);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(true);
    expect(result.contractingTeamFinalScore).toBe(1000);
    expect(result.opponentTeamFinalScore).toBe(0);
  });
});

describe("calculateRoundScore — announced capot coinched (×2) failed", () => {
  it("bidder loses 1+ → opponentTeamFinalScore = 1000", () => {
    const tricks = eightZeroTricks([0, 0, 0, 0, 0, 0, 0, 1]);
    const contract = capotContract("hearts", 0, 2);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(false);
    expect(result.opponentTeamFinalScore).toBe(1000);
  });
});

describe("calculateRoundScore — announced capot surcoinched (×4) made", () => {
  it("bidder wins all 8 → contractingTeamFinalScore = 2000", () => {
    const tricks = eightZeroTricks([0, 0, 0, 0, 0, 0, 0, 0]);
    const contract = capotContract("hearts", 0, 4);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(true);
    expect(result.contractingTeamFinalScore).toBe(2000);
  });
});

describe("calculateRoundScore — announced capot surcoinched (×4) failed", () => {
  it("bidder loses 1+ → opponentTeamFinalScore = 2000", () => {
    const tricks = eightZeroTricks([0, 0, 0, 0, 0, 0, 0, 1]);
    const contract = capotContract("hearts", 0, 4);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(false);
    expect(result.opponentTeamFinalScore).toBe(2000);
  });
});

// ── Unannounced capot (regular contract, bidder wins all 8) ───────────────────

/**
 * 8 tricks all won by position 0. Hearts is trump.
 * Uses full 32-card deal mirroring TRICK_TEMPLATE (152 card pts + 10 last = 162).
 * Bidder wins all → contractingTeamPoints = 162.
 */
function eightScoringTricksAllBidder(): Trick[] {
  const template: Array<Array<{ suit: Suit; rank: Rank; pos: PlayerPosition }>> = [
    [
      { suit: "hearts", rank: "jack", pos: 0 },
      { suit: "hearts", rank: "9", pos: 1 },
      { suit: "hearts", rank: "ace", pos: 2 },
      { suit: "hearts", rank: "10", pos: 3 },
    ],
    [
      { suit: "hearts", rank: "king", pos: 0 },
      { suit: "hearts", rank: "queen", pos: 1 },
      { suit: "hearts", rank: "8", pos: 2 },
      { suit: "hearts", rank: "7", pos: 3 },
    ],
    [
      { suit: "spades", rank: "ace", pos: 0 },
      { suit: "spades", rank: "10", pos: 1 },
      { suit: "spades", rank: "king", pos: 2 },
      { suit: "spades", rank: "queen", pos: 3 },
    ],
    [
      { suit: "spades", rank: "jack", pos: 0 },
      { suit: "spades", rank: "9", pos: 1 },
      { suit: "spades", rank: "8", pos: 2 },
      { suit: "spades", rank: "7", pos: 3 },
    ],
    [
      { suit: "diamonds", rank: "ace", pos: 0 },
      { suit: "diamonds", rank: "10", pos: 1 },
      { suit: "diamonds", rank: "king", pos: 2 },
      { suit: "diamonds", rank: "queen", pos: 3 },
    ],
    [
      { suit: "diamonds", rank: "jack", pos: 0 },
      { suit: "diamonds", rank: "9", pos: 1 },
      { suit: "diamonds", rank: "8", pos: 2 },
      { suit: "diamonds", rank: "7", pos: 3 },
    ],
    [
      { suit: "clubs", rank: "ace", pos: 0 },
      { suit: "clubs", rank: "10", pos: 1 },
      { suit: "clubs", rank: "king", pos: 2 },
      { suit: "clubs", rank: "queen", pos: 3 },
    ],
    [
      { suit: "clubs", rank: "jack", pos: 0 },
      { suit: "clubs", rank: "9", pos: 1 },
      { suit: "clubs", rank: "8", pos: 2 },
      { suit: "clubs", rank: "7", pos: 3 },
    ],
  ];
  return template.map((c) => makeTrick("hearts", c, 0 as PlayerPosition));
}

describe("calculateRoundScore — unannounced capot bonus", () => {
  it("regular contract bidder wins all 8 tricks → score = 250 + bid value", () => {
    // bidder (pos 0) wins all 8 tricks on a 90-point contract (162 card pts ≥ 90)
    const tricks = eightScoringTricksAllBidder();
    const contract = regularContract(90, "hearts", 0, 1);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(true);
    // 250 + 90 = 340
    expect(result.contractingTeamFinalScore).toBe(340);
    expect(result.opponentTeamFinalScore).toBe(0);
  });

  it("unannounced capot on 100-point contract → score = 250 + 100 = 350", () => {
    const tricks = eightScoringTricksAllBidder();
    const contract = regularContract(100, "hearts", 0, 1);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractingTeamFinalScore).toBe(350);
  });
});

// ── Belote preserved ──────────────────────────────────────────────────────────

describe("calculateRoundScore — belote +20 preserved with capot", () => {
  it("capot made + belote: contractingTeamFinalScore = 500 + 20 = 520", () => {
    // Build 8 tricks where bidder wins all, and king+queen of trump are played by bidder
    const tricks = [
      makeTrick(
        "hearts",
        [
          { suit: "hearts", rank: "king", pos: 0 as PlayerPosition },
          { suit: "spades", rank: "7", pos: 1 as PlayerPosition },
          { suit: "diamonds", rank: "7", pos: 2 as PlayerPosition },
          { suit: "clubs", rank: "7", pos: 3 as PlayerPosition },
        ],
        0 as PlayerPosition,
      ),
      makeTrick(
        "hearts",
        [
          { suit: "hearts", rank: "queen", pos: 0 as PlayerPosition },
          { suit: "spades", rank: "8", pos: 1 as PlayerPosition },
          { suit: "diamonds", rank: "8", pos: 2 as PlayerPosition },
          { suit: "clubs", rank: "8", pos: 3 as PlayerPosition },
        ],
        0 as PlayerPosition,
      ),
      ...eightZeroTricks([0, 0, 0, 0, 0, 0]).slice(0, 6),
    ];
    const contract = capotContract("hearts", 0, 1);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(true);
    expect(result.contractingTeamFinalScore).toBe(520);
  });
});

// ── Additional helper for unannounced capot ───────────────────────────────────
// 8 tricks with scoring cards (aces + 10s = 44+40+10=94 pts, easily > 90).
// Bidder is position 0 (south/north team), all tricks won by pos 0.
