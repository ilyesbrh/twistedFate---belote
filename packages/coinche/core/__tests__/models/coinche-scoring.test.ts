/**
 * Coinche-specific scoring tests.
 *
 * These tests pin the CORRECT Coinche formula:
 *   failure (any level) → opponents score (contract.value + 160) × coincheLevel
 *   success coinched (×2/×4) → bidder scores (contract.value + 160) × coincheLevel
 *   success plain (×1) → each team scores their own card points (unchanged)
 *
 * The existing scoring.test.ts has wrong expected values inherited from
 * the @belote/core copy (uses 160 × level instead of (contract + 160) × level).
 * Those tests will be updated once this file drives the implementation fix.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateRoundScore,
  FAILED_CONTRACT_POINTS,
  BELOTE_BONUS,
} from "../../src/models/scoring.js";
import { createCard } from "../../src/models/card.js";
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

function contract(
  value: BidValue,
  suit: Suit,
  bidder: PlayerPosition,
  level: 1 | 2 | 4 = 1,
): Contract {
  return Object.freeze({
    id: idGen.generateId("contract"),
    suit,
    value,
    bidderPosition: bidder,
    coincheLevel: level,
    contractType: "suit" as const,
  });
}

/**
 * 8 tricks covering all 32 cards. Trump = hearts.
 * Trick point values (hearts as trump):
 *   T0: J♥(20)+9♥(14)+A♥(11)+10♥(10) = 55
 *   T1: K♥(4)+Q♥(3)+8♥(0)+7♥(0)      = 7
 *   T2: A♠(11)+10♠(10)+K♠(4)+Q♠(3)   = 28
 *   T3: J♠(2)+9♠(0)+8♠(0)+7♠(0)      = 2
 *   T4: A♦(11)+10♦(10)+K♦(4)+Q♦(3)   = 28
 *   T5: J♦(2)+9♦(0)+8♦(0)+7♦(0)      = 2
 *   T6: A♣(11)+10♣(10)+K♣(4)+Q♣(3)   = 28
 *   T7: J♣(2)+9♣(0)+8♣(0)+7♣(0)      = 2
 *   Sum = 152 ✓
 */
const TRICK_TEMPLATE: Array<Array<{ suit: Suit; rank: Rank; pos: PlayerPosition }>> = [
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

function round(winners: readonly PlayerPosition[]): Trick[] {
  if (winners.length !== 8) throw new Error("need 8 winners");
  return TRICK_TEMPLATE.map((cards, i) => trick("hearts", cards, winners[i]!));
}

// ── Tests ──────────────────────────────────────────────────────────────────

// Plain (×1) — success: card-based scoring, no formula change.
describe("calculateRoundScore — Coinche plain success (×1)", () => {
  it("bidder gets their rounded card points; opponent gets theirs", () => {
    // Bidder wins T0–T3: 55+7+28+2 = 92 → rounded 90.
    // Opponent wins T4–T7: 28+2+28+2 = 60 + last-trick bonus 10 = 70.
    const tricks = round([0, 0, 0, 0, 1, 1, 1, 1]);
    const c = contract(90, "hearts", 0, 1);
    const result = calculateRoundScore(tricks, c);
    expect(result.contractMet).toBe(true);
    expect(result.contractingTeamFinalScore).toBe(90);
    expect(result.opponentTeamFinalScore).toBe(70);
  });
});

// Plain (×1) — failure: opponents get (contract + 160) × 1.
describe("calculateRoundScore — Coinche plain failure (×1)", () => {
  it("opponents score contract.value + 160 (not just 160)", () => {
    const tricks = round([1, 1, 1, 1, 1, 1, 1, 1]);
    const c = contract(100, "hearts", 0, 1);
    const result = calculateRoundScore(tricks, c);
    expect(result.contractMet).toBe(false);
    expect(result.contractingTeamFinalScore).toBe(0);
    // (100 + 160) × 1 = 260, NOT 160
    expect(result.opponentTeamFinalScore).toBe(260);
  });

  it("different contract values produce different failure scores", () => {
    const tricks80 = round([1, 1, 1, 1, 1, 1, 1, 1]);
    const c80 = contract(90, "hearts", 0, 1);
    const r80 = calculateRoundScore(tricks80, c80);
    // (90 + 160) × 1 = 250
    expect(r80.opponentTeamFinalScore).toBe(250);

    const tricks160 = round([1, 1, 1, 1, 1, 1, 1, 1]);
    const c160 = contract(160, "hearts", 0, 1);
    const r160 = calculateRoundScore(tricks160, c160);
    // (160 + 160) × 1 = 320
    expect(r160.opponentTeamFinalScore).toBe(320);
  });
});

// Coinché (×2) — failure.
describe("calculateRoundScore — Coinché failure (×2)", () => {
  it("opponents score (contract + 160) × 2", () => {
    const tricks = round([1, 1, 1, 1, 1, 1, 1, 1]);
    const c = contract(100, "hearts", 0, 2);
    const result = calculateRoundScore(tricks, c);
    expect(result.contractMet).toBe(false);
    expect(result.contractingTeamFinalScore).toBe(0);
    // (100 + 160) × 2 = 520, NOT 320
    expect(result.opponentTeamFinalScore).toBe(520);
  });
});

// Coinché (×2) — success.
describe("calculateRoundScore — Coinché success (×2)", () => {
  it("bidder scores (contract + 160) × 2; opponent scores 0", () => {
    // Bidder wins all 8 tricks.
    const tricks = round([0, 0, 0, 0, 0, 0, 0, 0]);
    const c = contract(100, "hearts", 0, 2);
    const result = calculateRoundScore(tricks, c);
    expect(result.contractMet).toBe(true);
    // (100 + 160) × 2 = 520, NOT 320
    expect(result.contractingTeamFinalScore).toBe(520);
    expect(result.opponentTeamScore).toBe(0);
  });
});

// Surcoinché (×4) — failure.
describe("calculateRoundScore — Surcoinché failure (×4)", () => {
  it("opponents score (contract + 160) × 4", () => {
    const tricks = round([1, 1, 1, 1, 1, 1, 1, 1]);
    const c = contract(100, "hearts", 0, 4);
    const result = calculateRoundScore(tricks, c);
    // (100 + 160) × 4 = 1040, NOT 640
    expect(result.opponentTeamFinalScore).toBe(1040);
    expect(result.contractingTeamFinalScore).toBe(0);
  });
});

// Surcoinché (×4) — success.
describe("calculateRoundScore — Surcoinché success (×4)", () => {
  it("bidder scores (contract + 160) × 4; opponent scores 0", () => {
    const tricks = round([0, 0, 0, 0, 0, 0, 0, 0]);
    const c = contract(100, "hearts", 0, 4);
    const result = calculateRoundScore(tricks, c);
    // (100 + 160) × 4 = 1040, NOT 640
    expect(result.contractingTeamFinalScore).toBe(1040);
    expect(result.opponentTeamFinalScore).toBe(0);
  });
});

// Belote bonus: always applies to the holding team, unaffected by coinche level.
describe("calculateRoundScore — belote bonus unaffected by coinche level", () => {
  it("belote +20 added to bidder even when coinched success", () => {
    // Build a round where bidder (pos 0 or 2) holds K+Q of hearts.
    // Template trick 1 has K♥ at pos 0 and Q♥ at pos 1. We need them on the SAME team.
    // Contracting team = pos 0 + pos 2. So swap Q to pos 2 by adjusting winners.
    // Actually detectBeloteRebelote finds K+Q in played cards regardless of winner.
    // Template has K♥ pos 0 (contracting) and Q♥ pos 1 (opponent) — different teams → no belote.
    // Use a custom trick set where K♥ and Q♥ both go to contracting (pos 0 and pos 2).
    const trumpSuit: Suit = "hearts";
    const customTricks: Trick[] = [
      // T0: J♥(20)+9♥(14)+A♥(11)+10♥(10) = 55 — bidder wins
      trick(
        trumpSuit,
        [
          { suit: "hearts", rank: "jack", pos: 0 },
          { suit: "hearts", rank: "9", pos: 1 },
          { suit: "hearts", rank: "ace", pos: 2 },
          { suit: "hearts", rank: "10", pos: 3 },
        ],
        0,
      ),
      // T1: K♥(4) pos 0 + Q♥(3) pos 2 + 8♥(0) + 7♥(0) — bidder wins; K+Q both contracting
      trick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", pos: 0 },
          { suit: "hearts", rank: "queen", pos: 2 },
          { suit: "hearts", rank: "8", pos: 1 },
          { suit: "hearts", rank: "7", pos: 3 },
        ],
        0,
      ),
      // T2–T7: zero-point filler, all won by opponent
      trick(
        trumpSuit,
        [
          { suit: "spades", rank: "ace", pos: 0 },
          { suit: "spades", rank: "10", pos: 1 },
          { suit: "spades", rank: "king", pos: 2 },
          { suit: "spades", rank: "queen", pos: 3 },
        ],
        1,
      ),
      trick(
        trumpSuit,
        [
          { suit: "spades", rank: "jack", pos: 0 },
          { suit: "spades", rank: "9", pos: 1 },
          { suit: "spades", rank: "8", pos: 2 },
          { suit: "spades", rank: "7", pos: 3 },
        ],
        1,
      ),
      trick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "ace", pos: 0 },
          { suit: "diamonds", rank: "10", pos: 1 },
          { suit: "diamonds", rank: "king", pos: 2 },
          { suit: "diamonds", rank: "queen", pos: 3 },
        ],
        1,
      ),
      trick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "jack", pos: 0 },
          { suit: "diamonds", rank: "9", pos: 1 },
          { suit: "diamonds", rank: "8", pos: 2 },
          { suit: "diamonds", rank: "7", pos: 3 },
        ],
        1,
      ),
      trick(
        trumpSuit,
        [
          { suit: "clubs", rank: "ace", pos: 0 },
          { suit: "clubs", rank: "10", pos: 1 },
          { suit: "clubs", rank: "king", pos: 2 },
          { suit: "clubs", rank: "queen", pos: 3 },
        ],
        1,
      ),
      trick(
        trumpSuit,
        [
          { suit: "clubs", rank: "jack", pos: 0 },
          { suit: "clubs", rank: "9", pos: 1 },
          { suit: "clubs", rank: "8", pos: 2 },
          { suit: "clubs", rank: "7", pos: 3 },
        ],
        1,
      ),
    ];
    // Bidder earns T0(55)+T1(7) = 62 → rounded 60. Contract = 90 → FAILS.
    // With belote: 60 + 20 = 80 < 90 → still fails.
    // Coinched (×2) failure: opponents get (90 + 160) × 2 = 500.
    // Bidder gets 0 base + 20 (belote) = 20.
    const c = contract(90, "hearts", 0, 2);
    const result = calculateRoundScore(customTricks, c);
    expect(result.beloteBonusTeam).toBe("contracting");
    expect(result.contractMet).toBe(false);
    // Belote bonus preserved for bidder despite failure
    expect(result.contractingTeamFinalScore).toBe(BELOTE_BONUS); // 20
    // Opponents get full coinche formula
    expect(result.opponentTeamFinalScore).toBe((90 + FAILED_CONTRACT_POINTS) * 2); // 500
  });

  it("belote +20 is NOT multiplied by coinche level", () => {
    // Same setup, but verify the bonus is flat 20, not 20 × level.
    const tricks = round([1, 1, 1, 1, 1, 1, 1, 1]);
    const c = contract(100, "hearts", 0, 4);
    const result = calculateRoundScore(tricks, c);
    // No belote (template has K♥ at pos 0 contracting; Q♥ at pos 1 opponent → different teams).
    expect(result.beloteBonusTeam).toBeNull();
    expect(result.contractingTeamFinalScore).toBe(0);
    expect(result.opponentTeamFinalScore).toBe((100 + FAILED_CONTRACT_POINTS) * 4); // 1040
  });
});

// Regression guard: formula clearly differs from 160-only.
describe("calculateRoundScore — formula regression guard", () => {
  it("contract=80, coinched failure gives 480 not 320", () => {
    const tricks = round([1, 1, 1, 1, 1, 1, 1, 1]);
    const c = contract(90, "hearts", 0, 2);
    const result = calculateRoundScore(tricks, c);
    // (90 + 160) × 2 = 500. 160-only would give 320.
    expect(result.opponentTeamFinalScore).toBe(500);
    expect(result.opponentTeamFinalScore).not.toBe(320);
  });
});
