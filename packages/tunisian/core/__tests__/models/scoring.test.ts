import { describe, it, expect, beforeEach } from "vitest";
import {
  LAST_TRICK_BONUS,
  BELOTE_BONUS,
  TOTAL_CARD_POINTS,
  TOTAL_ROUND_POINTS,
  FAILED_CONTRACT_POINTS,
  roundToNearestTen,
  calculateTrickPoints,
  calculateTeamPoints,
  detectBeloteRebelote,
  calculateRoundScore,
} from "../../src/models/scoring.js";
import type { TeamPoints, RoundScore } from "../../src/models/scoring.js";
import { createCard } from "../../src/models/card.js";
import type { Card, Suit, Rank } from "../../src/models/card.js";
import type { PlayerPosition } from "../../src/models/player.js";
import type { Trick, PlayedCard } from "../../src/models/trick.js";
import type { Contract } from "../../src/models/bid.js";
import type { BidValue } from "../../src/models/bid.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";

// ==============================================================
// Helpers
// ==============================================================

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 42 });
});

function c(suit: Suit, rank: Rank): Card {
  return createCard(suit, rank, idGen);
}

/** Build a completed trick directly (scoring reads data, doesn't re-validate plays). */
function makeTrick(
  trumpSuit: Suit,
  cards: Array<{ suit: Suit; rank: Rank; position: PlayerPosition }>,
  winnerPosition: PlayerPosition,
): Trick {
  const playedCards: PlayedCard[] = cards.map((entry) =>
    Object.freeze({ card: c(entry.suit, entry.rank), playerPosition: entry.position }),
  );
  return Object.freeze({
    id: idGen.generateId("trick"),
    leadingPlayerPosition: cards[0]!.position,
    trumpSuit,
    cards: Object.freeze(playedCards),
    state: "completed" as const,
    winnerPosition,
  });
}

/** Build an in-progress trick for error tests. */
function makeInProgressTrick(trumpSuit: Suit): Trick {
  return Object.freeze({
    id: idGen.generateId("trick"),
    leadingPlayerPosition: 0 as PlayerPosition,
    trumpSuit,
    cards: Object.freeze([]),
    state: "in_progress" as const,
    winnerPosition: null,
  });
}

/** Build a simple contract. */
function makeContract(
  value: BidValue,
  suit: Suit,
  bidderPosition: PlayerPosition,
  coincheLevel: 1 | 2 | 4 = 1,
): Contract {
  return Object.freeze({
    id: idGen.generateId("contract"),
    suit,
    value,
    bidderPosition,
    coincheLevel,
  });
}

/**
 * Build 8 tricks for a full round. Uses simple filler cards (7s and 8s)
 * for non-scoring tricks, with explicit control over who wins what.
 *
 * @param trumpSuit - The trump suit
 * @param config - Array of 8 entries, each with card details and winner
 */
function makeEightTricks(
  trumpSuit: Suit,
  config: Array<{
    cards: Array<{ suit: Suit; rank: Rank; position: PlayerPosition }>;
    winner: PlayerPosition;
  }>,
): Trick[] {
  return config.map((entry) => makeTrick(trumpSuit, entry.cards, entry.winner));
}

// Standard filler trick (all zero-point non-trump cards)
function fillerTrick(trumpSuit: Suit, winner: PlayerPosition): Trick {
  // Use diamonds as filler if trump is not diamonds, else use clubs
  const fillerSuit: Suit = trumpSuit === "diamonds" ? "clubs" : "diamonds";
  return makeTrick(
    trumpSuit,
    [
      { suit: fillerSuit, rank: "7", position: 0 as PlayerPosition },
      { suit: fillerSuit, rank: "8", position: 1 as PlayerPosition },
      { suit: fillerSuit, rank: "7", position: 2 as PlayerPosition },
      { suit: fillerSuit, rank: "8", position: 3 as PlayerPosition },
    ],
    winner,
  );
}

// ==============================================================
// calculateTrickPoints
// ==============================================================

describe("calculateTrickPoints", () => {
  it("should sum card points for a trick with all non-trump cards", () => {
    // Trump=hearts. Play 4 spades: ace=11, 10=10, king=4, queen=3
    const trick = makeTrick(
      "hearts",
      [
        { suit: "spades", rank: "ace", position: 0 },
        { suit: "spades", rank: "10", position: 1 },
        { suit: "spades", rank: "king", position: 2 },
        { suit: "spades", rank: "queen", position: 3 },
      ],
      0,
    );
    expect(calculateTrickPoints(trick, "hearts")).toBe(28); // 11+10+4+3
  });

  it("should sum card points for a trick with all trump cards", () => {
    // Trump=hearts. Play 4 hearts: jack=20, 9=14, ace=11, 10=10
    const trick = makeTrick(
      "hearts",
      [
        { suit: "hearts", rank: "jack", position: 0 },
        { suit: "hearts", rank: "9", position: 1 },
        { suit: "hearts", rank: "ace", position: 2 },
        { suit: "hearts", rank: "10", position: 3 },
      ],
      0,
    );
    expect(calculateTrickPoints(trick, "hearts")).toBe(55); // 20+14+11+10
  });

  it("should use trump scoring for trump cards and non-trump for others", () => {
    // Trump=hearts. hearts 9=14(trump), spades ace=11, spades 7=0, spades 8=0
    const trick = makeTrick(
      "hearts",
      [
        { suit: "hearts", rank: "9", position: 0 },
        { suit: "spades", rank: "ace", position: 1 },
        { suit: "spades", rank: "7", position: 2 },
        { suit: "spades", rank: "8", position: 3 },
      ],
      0,
    );
    expect(calculateTrickPoints(trick, "hearts")).toBe(25); // 14+11+0+0
  });

  it("should return 0 for a trick with all zero-point cards", () => {
    const trick = makeTrick(
      "hearts",
      [
        { suit: "spades", rank: "7", position: 0 },
        { suit: "spades", rank: "8", position: 1 },
        { suit: "clubs", rank: "7", position: 2 },
        { suit: "clubs", rank: "8", position: 3 },
      ],
      0,
    );
    expect(calculateTrickPoints(trick, "hearts")).toBe(0);
  });

  it("should correctly score trump jack at 20 points (not non-trump 2)", () => {
    // Trump=hearts. hearts jack=20, spades 7=0, spades 8=0, clubs 7=0
    const trick = makeTrick(
      "hearts",
      [
        { suit: "hearts", rank: "jack", position: 0 },
        { suit: "spades", rank: "7", position: 1 },
        { suit: "spades", rank: "8", position: 2 },
        { suit: "clubs", rank: "7", position: 3 },
      ],
      0,
    );
    expect(calculateTrickPoints(trick, "hearts")).toBe(20);
  });

  it("should throw if trick is not completed", () => {
    const trick = makeInProgressTrick("hearts");
    expect(() => calculateTrickPoints(trick, "hearts")).toThrow(/not completed|in_progress/i);
  });
});

// ==============================================================
// calculateTeamPoints
// ==============================================================

describe("calculateTeamPoints", () => {
  it("should assign all trick points to contracting team when they win all tricks", () => {
    // Bidder=0, contracting team={0,2}. All 8 tricks won by position 0.
    // Use 7 filler tricks (0 points each) + 1 trick with all 4 aces non-trump (44 points)
    // But we need total=152 card points. Simpler: just make 8 tricks with known totals.
    // Actually, let's build a full 32-card round properly.
    // For simplicity, use fillers that still contribute to 152.

    // Approach: one trick has non-trump aces (4×11=44), another has non-trump 10s (4×10=40),
    // another has non-trump kings (4×4=16), etc. Sum must be 152.
    // trump=hearts, bidder=0

    // Trump cards: jack=20, 9=14, ace=11, 10=10, king=4, queen=3, 8=0, 7=0 = 62
    // Non-trump (×3 suits): ace=11, 10=10, king=4, queen=3, jack=2, 9=0, 8=0, 7=0 = 30 each = 90
    // Total: 62 + 90 = 152 ✓

    // 8 tricks, all won by contracting team (position 0)
    const trumpSuit: Suit = "hearts";
    const tricks = [
      // Trick 1: trump high cards (jack=20, 9=14, ace=11, 10=10) = 55
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "jack", position: 0 },
          { suit: "hearts", rank: "9", position: 1 },
          { suit: "hearts", rank: "ace", position: 2 },
          { suit: "hearts", rank: "10", position: 3 },
        ],
        0,
      ),
      // Trick 2: trump low + non-trump (king=4, queen=3, 8=0, 7=0) = 7
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "hearts", rank: "queen", position: 1 },
          { suit: "hearts", rank: "8", position: 2 },
          { suit: "hearts", rank: "7", position: 3 },
        ],
        0,
      ),
      // Trick 3: spades (ace=11, 10=10, king=4, queen=3) = 28
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "ace", position: 0 },
          { suit: "spades", rank: "10", position: 1 },
          { suit: "spades", rank: "king", position: 2 },
          { suit: "spades", rank: "queen", position: 3 },
        ],
        0,
      ),
      // Trick 4: spades (jack=2, 9=0, 8=0, 7=0) = 2
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "jack", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "spades", rank: "7", position: 3 },
        ],
        0,
      ),
      // Trick 5: diamonds (ace=11, 10=10, king=4, queen=3) = 28
      makeTrick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "ace", position: 0 },
          { suit: "diamonds", rank: "10", position: 1 },
          { suit: "diamonds", rank: "king", position: 2 },
          { suit: "diamonds", rank: "queen", position: 3 },
        ],
        0,
      ),
      // Trick 6: diamonds (jack=2, 9=0, 8=0, 7=0) = 2
      makeTrick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "jack", position: 0 },
          { suit: "diamonds", rank: "9", position: 1 },
          { suit: "diamonds", rank: "8", position: 2 },
          { suit: "diamonds", rank: "7", position: 3 },
        ],
        0,
      ),
      // Trick 7: clubs (ace=11, 10=10, king=4, queen=3) = 28
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "ace", position: 0 },
          { suit: "clubs", rank: "10", position: 1 },
          { suit: "clubs", rank: "king", position: 2 },
          { suit: "clubs", rank: "queen", position: 3 },
        ],
        0,
      ),
      // Trick 8: clubs (jack=2, 9=0, 8=0, 7=0) = 2
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "jack", position: 0 },
          { suit: "clubs", rank: "9", position: 1 },
          { suit: "clubs", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        0,
      ),
    ];
    // Total card points: 55+7+28+2+28+2+28+2 = 152 ✓
    const result = calculateTeamPoints(tricks, trumpSuit, 0);
    expect(result.contractingTeamPoints).toBe(162); // 152 + 10 last trick bonus
    expect(result.opponentTeamPoints).toBe(0);
  });

  it("should assign all trick points to opponent when they win all tricks", () => {
    const trumpSuit: Suit = "hearts";
    // 8 filler tricks all won by position 1 (opponent when bidder=0)
    // All 0-point cards → 0 card points + 10 last trick bonus = 10 for opponent
    // But we need to test with real card points too. Let's use a simpler approach:
    // same 8-trick structure as above but all won by position 1
    const tricks = [
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "jack", position: 0 },
          { suit: "hearts", rank: "9", position: 1 },
          { suit: "hearts", rank: "ace", position: 2 },
          { suit: "hearts", rank: "10", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "hearts", rank: "queen", position: 1 },
          { suit: "hearts", rank: "8", position: 2 },
          { suit: "hearts", rank: "7", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "ace", position: 0 },
          { suit: "spades", rank: "10", position: 1 },
          { suit: "spades", rank: "king", position: 2 },
          { suit: "spades", rank: "queen", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "jack", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "spades", rank: "7", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "ace", position: 0 },
          { suit: "diamonds", rank: "10", position: 1 },
          { suit: "diamonds", rank: "king", position: 2 },
          { suit: "diamonds", rank: "queen", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "jack", position: 0 },
          { suit: "diamonds", rank: "9", position: 1 },
          { suit: "diamonds", rank: "8", position: 2 },
          { suit: "diamonds", rank: "7", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "ace", position: 0 },
          { suit: "clubs", rank: "10", position: 1 },
          { suit: "clubs", rank: "king", position: 2 },
          { suit: "clubs", rank: "queen", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "jack", position: 0 },
          { suit: "clubs", rank: "9", position: 1 },
          { suit: "clubs", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        1,
      ),
    ];
    const result = calculateTeamPoints(tricks, trumpSuit, 0);
    expect(result.contractingTeamPoints).toBe(0);
    expect(result.opponentTeamPoints).toBe(162);
  });

  it("should split points across teams based on trick winners", () => {
    const trumpSuit: Suit = "hearts";
    // Contracting team (bidder=0) wins tricks 1-4, opponent wins tricks 5-8
    // Trick 1: trump high = 55, won by pos 0 (contracting)
    // Trick 2: trump low = 7, won by pos 2 (contracting)
    // Trick 3: spades high = 28, won by pos 0 (contracting)
    // Trick 4: spades low = 2, won by pos 2 (contracting)
    // Contracting card points: 55+7+28+2 = 92
    // Trick 5-8: diamonds+clubs = 28+2+28+2 = 60, won by opponent
    // Opponent card points: 60
    // Total: 92+60 = 152 ✓
    // Last trick (8) won by opponent → opponent gets +10
    const tricks = [
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "jack", position: 0 },
          { suit: "hearts", rank: "9", position: 1 },
          { suit: "hearts", rank: "ace", position: 2 },
          { suit: "hearts", rank: "10", position: 3 },
        ],
        0,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "hearts", rank: "queen", position: 1 },
          { suit: "hearts", rank: "8", position: 2 },
          { suit: "hearts", rank: "7", position: 3 },
        ],
        2,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "ace", position: 0 },
          { suit: "spades", rank: "10", position: 1 },
          { suit: "spades", rank: "king", position: 2 },
          { suit: "spades", rank: "queen", position: 3 },
        ],
        0,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "jack", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "spades", rank: "7", position: 3 },
        ],
        2,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "ace", position: 0 },
          { suit: "diamonds", rank: "10", position: 1 },
          { suit: "diamonds", rank: "king", position: 2 },
          { suit: "diamonds", rank: "queen", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "jack", position: 0 },
          { suit: "diamonds", rank: "9", position: 1 },
          { suit: "diamonds", rank: "8", position: 2 },
          { suit: "diamonds", rank: "7", position: 3 },
        ],
        3,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "ace", position: 0 },
          { suit: "clubs", rank: "10", position: 1 },
          { suit: "clubs", rank: "king", position: 2 },
          { suit: "clubs", rank: "queen", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "jack", position: 0 },
          { suit: "clubs", rank: "9", position: 1 },
          { suit: "clubs", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        3,
      ),
    ];
    const result = calculateTeamPoints(tricks, trumpSuit, 0);
    expect(result.contractingTeamPoints).toBe(92);
    expect(result.opponentTeamPoints).toBe(70); // 60 + 10 last trick bonus
  });

  it("should add last trick bonus to contracting team when they win the 8th trick", () => {
    const trumpSuit: Suit = "hearts";
    // 7 filler tricks (0 pts) won by opponent + 1 last trick won by contracting
    const tricks: Trick[] = [];
    for (let i = 0; i < 7; i++) {
      tricks.push(fillerTrick(trumpSuit, 1));
    }
    // Last trick has some points: spades ace=11
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "ace", position: 0 },
          { suit: "spades", rank: "7", position: 1 },
          { suit: "clubs", rank: "7", position: 2 },
          { suit: "clubs", rank: "8", position: 3 },
        ],
        0,
      ),
    );
    const result = calculateTeamPoints(tricks, trumpSuit, 0);
    // Contracting: 11 (card pts from last trick) + 10 (bonus) = 21
    expect(result.contractingTeamPoints).toBe(21);
  });

  it("should add last trick bonus to opponent when they win the 8th trick", () => {
    const trumpSuit: Suit = "hearts";
    const tricks: Trick[] = [];
    for (let i = 0; i < 7; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    tricks.push(fillerTrick(trumpSuit, 1));
    const result = calculateTeamPoints(tricks, trumpSuit, 0);
    // Opponent: 0 (card pts) + 10 (bonus) = 10
    expect(result.opponentTeamPoints).toBe(10);
  });

  it("should ensure total points always equal 162", () => {
    const trumpSuit: Suit = "hearts";
    // Use the split scenario from above
    const tricks = [
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "jack", position: 0 },
          { suit: "hearts", rank: "9", position: 1 },
          { suit: "hearts", rank: "ace", position: 2 },
          { suit: "hearts", rank: "10", position: 3 },
        ],
        0,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "hearts", rank: "queen", position: 1 },
          { suit: "hearts", rank: "8", position: 2 },
          { suit: "hearts", rank: "7", position: 3 },
        ],
        2,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "ace", position: 0 },
          { suit: "spades", rank: "10", position: 1 },
          { suit: "spades", rank: "king", position: 2 },
          { suit: "spades", rank: "queen", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "jack", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "spades", rank: "7", position: 3 },
        ],
        3,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "ace", position: 0 },
          { suit: "diamonds", rank: "10", position: 1 },
          { suit: "diamonds", rank: "king", position: 2 },
          { suit: "diamonds", rank: "queen", position: 3 },
        ],
        0,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "diamonds", rank: "jack", position: 0 },
          { suit: "diamonds", rank: "9", position: 1 },
          { suit: "diamonds", rank: "8", position: 2 },
          { suit: "diamonds", rank: "7", position: 3 },
        ],
        1,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "ace", position: 0 },
          { suit: "clubs", rank: "10", position: 1 },
          { suit: "clubs", rank: "king", position: 2 },
          { suit: "clubs", rank: "queen", position: 3 },
        ],
        2,
      ),
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "jack", position: 0 },
          { suit: "clubs", rank: "9", position: 1 },
          { suit: "clubs", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        3,
      ),
    ];
    const result = calculateTeamPoints(tricks, trumpSuit, 0);
    expect(result.contractingTeamPoints + result.opponentTeamPoints).toBe(162);
  });

  it("should throw if fewer than 8 tricks provided", () => {
    const tricks = [fillerTrick("hearts", 0)];
    expect(() => calculateTeamPoints(tricks, "hearts", 0)).toThrow(/8 tricks/i);
  });

  it("should throw if any trick is not completed", () => {
    const tricks: Trick[] = [];
    for (let i = 0; i < 7; i++) {
      tricks.push(fillerTrick("hearts", 0));
    }
    tricks.push(makeInProgressTrick("hearts"));
    expect(() => calculateTeamPoints(tricks, "hearts", 0)).toThrow(/not completed|in_progress/i);
  });
});

// ==============================================================
// detectBeloteRebelote
// ==============================================================

describe("detectBeloteRebelote", () => {
  it("should return 'contracting' when contracting team plays both K and Q of trump", () => {
    const trumpSuit: Suit = "hearts";
    // King played by pos 0 (bidder), Queen by pos 2 (partner). Both contracting team.
    const tricks: Trick[] = [];
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "spades", rank: "7", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        0,
      ),
    );
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "queen", position: 2 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "clubs", rank: "8", position: 0 },
          { suit: "clubs", rank: "9", position: 3 },
        ],
        2,
      ),
    );
    for (let i = 0; i < 6; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    expect(detectBeloteRebelote(tricks, trumpSuit, 0)).toBe("contracting");
  });

  it("should return 'opponent' when opponent team plays both K and Q of trump", () => {
    const trumpSuit: Suit = "hearts";
    // King by pos 1, Queen by pos 3. Both opponent team (bidder=0).
    const tricks: Trick[] = [];
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "7", position: 0 },
          { suit: "hearts", rank: "king", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        1,
      ),
    );
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "8", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "clubs", rank: "9", position: 2 },
          { suit: "hearts", rank: "queen", position: 3 },
        ],
        3,
      ),
    );
    for (let i = 0; i < 6; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    expect(detectBeloteRebelote(tricks, trumpSuit, 0)).toBe("opponent");
  });

  it("should return null when K and Q of trump are played by different teams", () => {
    const trumpSuit: Suit = "hearts";
    // King by pos 0 (contracting), Queen by pos 1 (opponent)
    const tricks: Trick[] = [];
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "spades", rank: "7", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        0,
      ),
    );
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "8", position: 0 },
          { suit: "hearts", rank: "queen", position: 1 },
          { suit: "clubs", rank: "9", position: 2 },
          { suit: "spades", rank: "9", position: 3 },
        ],
        1,
      ),
    );
    for (let i = 0; i < 6; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    expect(detectBeloteRebelote(tricks, trumpSuit, 0)).toBeNull();
  });

  it("should detect belote when K and Q are in different tricks", () => {
    const trumpSuit: Suit = "hearts";
    // King in trick 1 by pos 0, Queen in trick 5 by pos 2. Both contracting.
    const tricks: Trick[] = [];
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "spades", rank: "7", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        0,
      ),
    );
    for (let i = 0; i < 3; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "8", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "hearts", rank: "queen", position: 2 },
          { suit: "clubs", rank: "9", position: 3 },
        ],
        2,
      ),
    );
    for (let i = 0; i < 3; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    expect(detectBeloteRebelote(tricks, trumpSuit, 0)).toBe("contracting");
  });

  it("should detect belote when same player plays both K and Q", () => {
    const trumpSuit: Suit = "hearts";
    // Pos 0 plays both king and queen of trump in different tricks
    const tricks: Trick[] = [];
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "spades", rank: "7", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        0,
      ),
    );
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "queen", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "clubs", rank: "8", position: 2 },
          { suit: "clubs", rank: "9", position: 3 },
        ],
        0,
      ),
    );
    for (let i = 0; i < 6; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    expect(detectBeloteRebelote(tricks, trumpSuit, 0)).toBe("contracting");
  });

  it("should handle bidder at different positions", () => {
    const trumpSuit: Suit = "hearts";
    // Bidder=1. K+Q by pos 1 and 3 (contracting team when bidder=1)
    const tricks: Trick[] = [];
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "spades", rank: "7", position: 0 },
          { suit: "hearts", rank: "king", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        1,
      ),
    );
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "8", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "clubs", rank: "9", position: 2 },
          { suit: "hearts", rank: "queen", position: 3 },
        ],
        3,
      ),
    );
    for (let i = 0; i < 6; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    expect(detectBeloteRebelote(tricks, trumpSuit, 1)).toBe("contracting");
  });

  it("should handle bidder at position 3 with opponent belote", () => {
    const trumpSuit: Suit = "hearts";
    // Bidder=3. K+Q by pos 0 and 2 (opponent team when bidder=3)
    const tricks: Trick[] = [];
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "hearts", rank: "king", position: 0 },
          { suit: "spades", rank: "7", position: 1 },
          { suit: "spades", rank: "8", position: 2 },
          { suit: "clubs", rank: "7", position: 3 },
        ],
        0,
      ),
    );
    tricks.push(
      makeTrick(
        trumpSuit,
        [
          { suit: "clubs", rank: "8", position: 0 },
          { suit: "spades", rank: "9", position: 1 },
          { suit: "hearts", rank: "queen", position: 2 },
          { suit: "clubs", rank: "9", position: 3 },
        ],
        2,
      ),
    );
    for (let i = 0; i < 6; i++) {
      tricks.push(fillerTrick(trumpSuit, 0));
    }
    expect(detectBeloteRebelote(tricks, trumpSuit, 3)).toBe("opponent");
  });
});

// ==============================================================
// roundToNearestTen
// ==============================================================

describe("roundToNearestTen", () => {
  it.each([
    [0, 0],
    [4, 0],
    [5, 10],
    [9, 10],
    [10, 10],
    [14, 10],
    [15, 20],
    [54, 50],
    [55, 60],
    [56, 60],
    [57, 60],
    [105, 110],
    [106, 110],
    [107, 110],
    [108, 110],
    [152, 150],
    [162, 160],
  ])("rounds %i to %i", (input, expected) => {
    expect(roundToNearestTen(input)).toBe(expected);
  });
});

// ==============================================================
// Round-building helper
// ==============================================================

/**
 * Template round: trump=hearts. Per-trick raw point totals are
 * [55, 7, 28, 2, 28, 2, 28, 2] (sum 152). Assign each trick to a winner
 * position to craft scenarios precisely.
 */
function buildTemplatedRound(trumpSuit: Suit, trickWinners: readonly PlayerPosition[]): Trick[] {
  if (trickWinners.length !== 8) {
    throw new Error("buildTemplatedRound expects exactly 8 winner positions");
  }
  const template: Array<Array<{ suit: Suit; rank: Rank; position: PlayerPosition }>> = [
    [
      { suit: "hearts", rank: "jack", position: 0 },
      { suit: "hearts", rank: "9", position: 1 },
      { suit: "hearts", rank: "ace", position: 2 },
      { suit: "hearts", rank: "10", position: 3 },
    ],
    [
      { suit: "hearts", rank: "king", position: 0 },
      { suit: "hearts", rank: "queen", position: 1 },
      { suit: "hearts", rank: "8", position: 2 },
      { suit: "hearts", rank: "7", position: 3 },
    ],
    [
      { suit: "spades", rank: "ace", position: 0 },
      { suit: "spades", rank: "10", position: 1 },
      { suit: "spades", rank: "king", position: 2 },
      { suit: "spades", rank: "queen", position: 3 },
    ],
    [
      { suit: "spades", rank: "jack", position: 0 },
      { suit: "spades", rank: "9", position: 1 },
      { suit: "spades", rank: "8", position: 2 },
      { suit: "spades", rank: "7", position: 3 },
    ],
    [
      { suit: "diamonds", rank: "ace", position: 0 },
      { suit: "diamonds", rank: "10", position: 1 },
      { suit: "diamonds", rank: "king", position: 2 },
      { suit: "diamonds", rank: "queen", position: 3 },
    ],
    [
      { suit: "diamonds", rank: "jack", position: 0 },
      { suit: "diamonds", rank: "9", position: 1 },
      { suit: "diamonds", rank: "8", position: 2 },
      { suit: "diamonds", rank: "7", position: 3 },
    ],
    [
      { suit: "clubs", rank: "ace", position: 0 },
      { suit: "clubs", rank: "10", position: 1 },
      { suit: "clubs", rank: "king", position: 2 },
      { suit: "clubs", rank: "queen", position: 3 },
    ],
    [
      { suit: "clubs", rank: "jack", position: 0 },
      { suit: "clubs", rank: "9", position: 1 },
      { suit: "clubs", rank: "8", position: 2 },
      { suit: "clubs", rank: "7", position: 3 },
    ],
  ];
  return template.map((cards, i) => makeTrick(trumpSuit, cards, trickWinners[i]!));
}

// ==============================================================
// calculateRoundScore — new scoring rules
// ==============================================================

describe("calculateRoundScore — contract met at level 1", () => {
  it("awards each team its rounded card points", () => {
    // Contracting wins tricks 1..4 (55+7+28+2 = 92). Opponent 3..8 → 60 + 10 last = 70.
    const tricks = buildTemplatedRound("hearts", [0, 0, 0, 0, 1, 1, 1, 1]);
    const contract = makeContract(90, "hearts", 0);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractingTeamPoints).toBe(92);
    expect(result.opponentTeamPoints).toBe(70);
    expect(result.contractingTeamRoundedPoints).toBe(90);
    expect(result.opponentTeamRoundedPoints).toBe(70);
    expect(result.contractMet).toBe(true);
    expect(result.contractingTeamScore).toBe(90);
    expect(result.opponentTeamScore).toBe(70);
    expect(result.contractingTeamFinalScore).toBe(90);
    expect(result.opponentTeamFinalScore).toBe(70);
  });
});

// ==============================================================
// Belote counted inside the contract check
// ==============================================================

describe("calculateRoundScore — belote inside contract", () => {
  // Custom round where pos 0 (contracting) plays K of trump in trick 1 and
  // pos 2 (contracting) plays Q of trump in trick 2.
  function roundWithContractingBelote(trickWinners: readonly PlayerPosition[]): Trick[] {
    if (trickWinners.length !== 8) throw new Error("expected 8 winners");
    const trumpSuit: Suit = "hearts";
    const custom: Array<Array<{ suit: Suit; rank: Rank; position: PlayerPosition }>> = [
      // Trick 1 — 55 pts. K of trump played by pos 0.
      [
        { suit: "hearts", rank: "jack", position: 1 },
        { suit: "hearts", rank: "9", position: 3 },
        { suit: "hearts", rank: "ace", position: 2 },
        { suit: "hearts", rank: "king", position: 0 },
      ],
      // Trick 2 — 7 pts (queen=3, 10=10? No: 10 of trump=10 which would be 13). Use queen+8+7+king? No K already played.
      // To keep pts=7 in trick 2 only queen + three zeros: queen(3) + 8(0) + 7(0) + 8(0). Need a 4th zero trump.
      // Trump has only one 8 and one 7. Use non-trump zero cards instead.
      [
        { suit: "hearts", rank: "queen", position: 2 },
        { suit: "spades", rank: "8", position: 3 },
        { suit: "clubs", rank: "8", position: 0 },
        { suit: "clubs", rank: "7", position: 1 },
      ],
      // Trick 3 — 28 pts (spades high). Note: spades 8 already in trick 2 so swap ranks.
      [
        { suit: "spades", rank: "ace", position: 0 },
        { suit: "spades", rank: "10", position: 1 },
        { suit: "spades", rank: "king", position: 2 },
        { suit: "spades", rank: "queen", position: 3 },
      ],
      // Trick 4 — 2 pts (spades low sans 8).
      [
        { suit: "spades", rank: "jack", position: 0 },
        { suit: "spades", rank: "9", position: 1 },
        { suit: "spades", rank: "7", position: 2 },
        { suit: "hearts", rank: "10", position: 3 },
      ],
      // Trick 5 — 28 pts (diamonds high).
      [
        { suit: "diamonds", rank: "ace", position: 0 },
        { suit: "diamonds", rank: "10", position: 1 },
        { suit: "diamonds", rank: "king", position: 2 },
        { suit: "diamonds", rank: "queen", position: 3 },
      ],
      // Trick 6 — 2 pts (diamonds low).
      [
        { suit: "diamonds", rank: "jack", position: 0 },
        { suit: "diamonds", rank: "9", position: 1 },
        { suit: "diamonds", rank: "8", position: 2 },
        { suit: "diamonds", rank: "7", position: 3 },
      ],
      // Trick 7 — 28 pts (clubs high minus 8/7 already used). Use ace+10+king+queen of clubs. Clubs 8+7 already gone but ace/10/king/queen still here.
      [
        { suit: "clubs", rank: "ace", position: 0 },
        { suit: "clubs", rank: "10", position: 1 },
        { suit: "clubs", rank: "king", position: 2 },
        { suit: "clubs", rank: "queen", position: 3 },
      ],
      // Trick 8 — 2 pts (clubs jack + trumps low remaining hearts 8+7 + a filler). Keep total=2.
      [
        { suit: "clubs", rank: "jack", position: 0 },
        { suit: "clubs", rank: "9", position: 1 },
        { suit: "hearts", rank: "8", position: 2 },
        { suit: "hearts", rank: "7", position: 3 },
      ],
    ];
    return custom.map((cards, i) => makeTrick(trumpSuit, cards, trickWinners[i]!));
  }

  // Trick raw point totals for the belote round:
  // T1 = trump jack(20)+9(14)+ace(11)+king(4)   = 49
  // T2 = queen trump(3)+three zeros              = 3
  // T3 = 28, T4 = 2+10(trump ten? no, 10 is non-trump here since trump=hearts, spades 10=10) = 12? wait spades 10=10.
  // Recompute: T4 cards = spades jack(2) + spades 9(0) + spades 7(0) + hearts 10 (trump 10=10) = 12.
  // T5 = 28, T6 = 2
  // T7 = 28, T8 = clubs jack(2) + clubs 9(0) + hearts 8(0 trump) + hearts 7(0 trump) = 2
  // Total = 49+3+28+12+28+2+28+2 = 152 ✓

  it("belote pushes contracting over the contract threshold", () => {
    // Winners: contracting wins T1 (49) + T3 (28) = 77. Opponent wins the rest → 75 + 10 last = 85.
    // Rounded: 80 / 80 (actually 75 rounds to 80, 85 to 90). Let's compute: roundToNearestTen(77)=80, roundToNearestTen(85)=90.
    const tricks = roundWithContractingBelote([0, 1, 0, 1, 1, 1, 1, 1]);
    const contract = makeContract(100, "hearts", 0);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractingTeamPoints).toBe(77);
    expect(result.opponentTeamPoints).toBe(85);
    expect(result.contractingTeamRoundedPoints).toBe(80);
    expect(result.opponentTeamRoundedPoints).toBe(90);
    expect(result.beloteBonusTeam).toBe("contracting");
    // 80 + belote 20 = 100 ≥ 100 → met.
    expect(result.contractMet).toBe(true);
    expect(result.contractingTeamScore).toBe(80);
    expect(result.opponentTeamScore).toBe(90);
    expect(result.contractingTeamFinalScore).toBe(100);
    expect(result.opponentTeamFinalScore).toBe(90);
  });

  it("without belote the same rounded points would fail the contract", () => {
    // Use the templated round with raw contracting 90 (winners [0,0,0,0,1,1,1,1] with certain trick selection).
    // Winners [0,1,0,0,1,1,1,1]: T1(55)+T3(28)+T4(2)=85. Rounded 90. No belote (K=pos0, Q=pos1 = different teams).
    const tricks = buildTemplatedRound("hearts", [0, 1, 0, 0, 1, 1, 1, 1]);
    const contract = makeContract(100, "hearts", 0);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractingTeamPoints).toBe(85);
    expect(result.contractingTeamRoundedPoints).toBe(90);
    expect(result.beloteBonusTeam).toBeNull();
    expect(result.contractMet).toBe(false);
  });
});

// ==============================================================
// Failure awards FAILED_CONTRACT_POINTS × coincheLevel
// ==============================================================

describe("calculateRoundScore — failure awards", () => {
  it("level 1: opponent gets 160, contracting 0", () => {
    const tricks = buildTemplatedRound("hearts", [1, 1, 1, 1, 1, 1, 1, 1]);
    const contract = makeContract(100, "hearts", 0);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(false);
    expect(result.contractingTeamScore).toBe(0);
    expect(result.opponentTeamScore).toBe(160);
    expect(result.contractingTeamFinalScore).toBe(0);
    expect(result.opponentTeamFinalScore).toBe(160);
  });

  it("level 2 (contré): opponent gets 320", () => {
    const tricks = buildTemplatedRound("hearts", [1, 1, 1, 1, 1, 1, 1, 1]);
    const contract = makeContract(100, "hearts", 0, 2);
    const result = calculateRoundScore(tricks, contract);
    expect(result.opponentTeamScore).toBe(320);
    expect(result.contractingTeamScore).toBe(0);
  });

  it("level 4 (surcontré): opponent gets 640", () => {
    const tricks = buildTemplatedRound("hearts", [1, 1, 1, 1, 1, 1, 1, 1]);
    const contract = makeContract(100, "hearts", 0, 4);
    const result = calculateRoundScore(tricks, contract);
    expect(result.opponentTeamScore).toBe(640);
    expect(result.contractingTeamScore).toBe(0);
  });
});

// ==============================================================
// Contré / surcontré success: flat 160 × level, loser 0
// ==============================================================

describe("calculateRoundScore — contré/surcontré success", () => {
  it("level 2 met: contracting gets 320, opponent 0", () => {
    const tricks = buildTemplatedRound("hearts", [0, 0, 0, 0, 0, 0, 0, 0]);
    const contract = makeContract(100, "hearts", 0, 2);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractMet).toBe(true);
    expect(result.contractingTeamScore).toBe(320);
    expect(result.opponentTeamScore).toBe(0);
  });

  it("level 4 met: contracting gets 640, opponent 0", () => {
    const tricks = buildTemplatedRound("hearts", [0, 0, 0, 0, 0, 0, 0, 0]);
    const contract = makeContract(100, "hearts", 0, 4);
    const result = calculateRoundScore(tricks, contract);
    expect(result.contractingTeamScore).toBe(640);
    expect(result.opponentTeamScore).toBe(0);
  });
});

// ==============================================================
// Frozen result + constants
// ==============================================================

describe("calculateRoundScore — frozen result + constants", () => {
  it("returns a frozen object", () => {
    const tricks = buildTemplatedRound("hearts", [0, 0, 0, 0, 1, 1, 1, 1]);
    const contract = makeContract(90, "hearts", 0);
    expect(Object.isFrozen(calculateRoundScore(tricks, contract))).toBe(true);
  });

  it("exports the expected constants", () => {
    expect(LAST_TRICK_BONUS).toBe(10);
    expect(BELOTE_BONUS).toBe(20);
    expect(TOTAL_CARD_POINTS).toBe(152);
    expect(TOTAL_ROUND_POINTS).toBe(162);
    expect(FAILED_CONTRACT_POINTS).toBe(160);
  });
});
