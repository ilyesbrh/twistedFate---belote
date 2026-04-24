import { describe, it, expect, beforeEach } from "vitest";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";
import { createCard } from "../../src/models/card.js";
import type { Card, Suit, Rank } from "../../src/models/card.js";
import type { PlayerPosition } from "../../src/models/player.js";
import { createPlayer, setPlayerHand } from "../../src/models/player.js";
import { createTrick, playCard, isValidPlay } from "../../src/models/trick.js";
import type { Trick } from "../../src/models/trick.js";
import {
  createBiddingRound,
  createSuitBid,
  createPassBid,
  createCoincheBid,
  placeBid,
} from "../../src/models/bid.js";
import type { BiddingRound } from "../../src/models/bid.js";
import {
  chooseCard,
  chooseCardForRound,
  chooseBid,
  evaluateHandForSuit,
} from "../../src/ai/strategy.js";

// ==============================================================
// Helpers
// ==============================================================

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 42 });
});

function card(suit: Suit, rank: Rank): Card {
  return createCard(suit, rank, idGen);
}

/**
 * Creates a trick with some cards already played.
 * Each entry is [suit, rank, playerPosition].
 */
function makeTrickWith(
  leader: PlayerPosition,
  trumpSuit: Suit,
  plays: readonly [Suit, Rank, PlayerPosition][],
): Trick {
  let trick = createTrick(leader, trumpSuit, idGen);
  for (const [suit, rank, pos] of plays) {
    const c = card(suit, rank);
    trick = playCard(trick, c, pos, [c]);
  }
  return trick;
}

// ==============================================================
// chooseCard — Leading
// ==============================================================

describe("chooseCard — Leading", () => {
  it("should play a non-trump ace when available", () => {
    const aceSpades = card("spades", "ace");
    const sevenHearts = card("hearts", "7"); // trump
    const eightClubs = card("clubs", "8");
    const hand = [sevenHearts, eightClubs, aceSpades];

    const trick = createTrick(0, "hearts", idGen);
    const chosen = chooseCard(hand, trick, "hearts", 0 as PlayerPosition);
    expect(chosen.id).toBe(aceSpades.id);
  });

  it("should prefer aces over tens when leading", () => {
    const aceSpades = card("spades", "ace");
    const tenClubs = card("clubs", "10");
    const sevenDiamonds = card("diamonds", "7");
    const hand = [tenClubs, aceSpades, sevenDiamonds];

    const trick = createTrick(0, "hearts", idGen);
    const chosen = chooseCard(hand, trick, "hearts", 0 as PlayerPosition);
    expect(chosen.id).toBe(aceSpades.id);
  });

  it("should lead trump when hand is all trump", () => {
    const h7 = card("hearts", "7");
    const h8 = card("hearts", "8");
    const hQ = card("hearts", "queen");
    const hand = [h7, h8, hQ];

    const trick = createTrick(0, "hearts", idGen);
    const chosen = chooseCard(hand, trick, "hearts", 0 as PlayerPosition);
    // Should play some trump — all are trump
    expect(chosen.suit).toBe("hearts");
  });

  it("should avoid leading with trump when non-trump options exist", () => {
    const hJ = card("hearts", "jack"); // trump, strongest
    const sA = card("spades", "ace"); // non-trump ace
    const d7 = card("diamonds", "7");
    const hand = [hJ, sA, d7];

    const trick = createTrick(0, "hearts", idGen);
    const chosen = chooseCard(hand, trick, "hearts", 0 as PlayerPosition);
    expect(chosen.suit).not.toBe("hearts");
  });

  it("should play lowest value card when hand has only low non-trump cards", () => {
    const s7 = card("spades", "7"); // 0 pts
    const d8 = card("diamonds", "8"); // 0 pts
    const c9 = card("clubs", "9"); // 0 pts (non-trump)
    const hand = [s7, d8, c9];

    const trick = createTrick(0, "hearts", idGen);
    const chosen = chooseCard(hand, trick, "hearts", 0 as PlayerPosition);
    // Any of the 0-point cards is acceptable
    expect(hand.some((c) => c.id === chosen.id)).toBe(true);
  });

  it("should always return a card that passes isValidPlay", () => {
    const sA = card("spades", "ace");
    const hJ = card("hearts", "jack");
    const d10 = card("diamonds", "10");
    const cK = card("clubs", "king");
    const hand = [sA, hJ, d10, cK];

    const trick = createTrick(0, "hearts", idGen);
    const chosen = chooseCard(hand, trick, "hearts", 0 as PlayerPosition);
    expect(isValidPlay(trick, chosen, 0 as PlayerPosition, hand)).toBe(true);
  });
});

// ==============================================================
// chooseCard — Following suit
// ==============================================================

describe("chooseCard — Following suit", () => {
  it("should play cheapest winning card when can win the trick", () => {
    // Led suit is spades. Player 0 led spades 7. Player 1 must follow.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "7");
    const t1 = playCard(trick, lead, 0, [lead]);

    // Player 1 has spades king (rank 5), spades ace (rank 7), spades 10 (rank 6)
    // All beat spades 7 (rank 0). Cheapest winner = king (lowest rank that still wins).
    const sK = card("spades", "king");
    const sA = card("spades", "ace");
    const s10 = card("spades", "10");
    const hand = [sA, s10, sK];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    // Should pick king (4 pts) over 10 (10 pts) or ace (11 pts)
    expect(chosen.id).toBe(sK.id);
  });

  it("should play lowest card of suit when cannot win", () => {
    // Led suit is spades. Player 0 led spades ace (rank 7, highest).
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    // Player 1 has spades 7 and spades 8 — neither beats ace
    const s7 = card("spades", "7");
    const s8 = card("spades", "8");
    const hand = [s8, s7];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    // Should dump lowest value card: both are 0 pts, pick lowest rank
    expect(chosen.id).toBe(s7.id);
  });

  it("should play low when partner is currently winning", () => {
    // Player 0 leads spades king. Player 1 plays spades 7.
    // Player 2 (partner of player 0) follows suit.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "king");
    const t1 = playCard(trick, lead, 0, [lead]);
    const p1Card = card("spades", "7");
    const t2 = playCard(t1, p1Card, 1, [p1Card]);

    // Player 2 has spades ace and spades 8. Partner (player 0) is winning.
    const sA = card("spades", "ace");
    const s8 = card("spades", "8");
    const hand = [sA, s8];

    const chosen = chooseCard(hand, t2, "hearts", 2 as PlayerPosition);
    // Should play low since partner is winning
    expect(chosen.id).toBe(s8.id);
  });

  it("should play ace to win when it beats all played cards", () => {
    // Player 0 leads spades 10 (rank 6). Player 1 follows.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "10");
    const t1 = playCard(trick, lead, 0, [lead]);

    // Player 1 has spades ace (rank 7, beats 10) and spades 7
    const sA = card("spades", "ace");
    const s7 = card("spades", "7");
    const hand = [s7, sA];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    // Ace is the cheapest winner (it's the only winner here)
    expect(chosen.id).toBe(sA.id);
  });

  it("should handle single valid suit card (forced play)", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    // Player 1 has only one spade
    const sK = card("spades", "king");
    const d7 = card("diamonds", "7"); // can't play this (must follow suit)
    const hand = [sK, d7];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    expect(chosen.id).toBe(sK.id);
  });

  it("should always return a valid play when following suit", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const sK = card("spades", "king");
    const s7 = card("spades", "7");
    const d10 = card("diamonds", "10");
    const hand = [sK, s7, d10];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    expect(isValidPlay(t1, chosen, 1 as PlayerPosition, hand)).toBe(true);
  });
});

// ==============================================================
// chooseCard — Must trump
// ==============================================================

describe("chooseCard — Must trump", () => {
  it("should play lowest winning trump when can overtrump", () => {
    // Led clubs. Player 1 trumped with hearts 8 (rank 1).
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trump8 = card("hearts", "8");
    const t2 = playCard(t1, trump8, 1, [trump8]);

    // Player 2 has no clubs. Has hearts queen (rank 2), hearts ace (rank 5).
    // Both beat 8. Should pick queen (lowest winning trump).
    const hQ = card("hearts", "queen");
    const hA = card("hearts", "ace");
    const hand = [hA, hQ];

    const chosen = chooseCard(hand, t2, "hearts", 2 as PlayerPosition);
    expect(chosen.id).toBe(hQ.id);
  });

  it("should play lowest trump when cannot overtrump", () => {
    // Led clubs. Player 1 trumped with hearts jack (rank 7, highest).
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trumpJ = card("hearts", "jack");
    const t2 = playCard(t1, trumpJ, 1, [trumpJ]);

    // Player 2 has no clubs. Has hearts 7 (rank 0) and hearts 8 (rank 1).
    // Neither beats jack. Should play lowest (7).
    const h7 = card("hearts", "7");
    const h8 = card("hearts", "8");
    const hand = [h8, h7];

    const chosen = chooseCard(hand, t2, "hearts", 2 as PlayerPosition);
    expect(chosen.id).toBe(h7.id);
  });

  it("should play any trump when no trump on table yet", () => {
    // Led clubs. Player 1 can't follow suit and must trump.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    // Player 1 has no clubs, has hearts 7 and hearts jack
    const h7 = card("hearts", "7");
    const hJ = card("hearts", "jack");
    const hand = [h7, hJ];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    // Should play a trump — lowest is preferred
    expect(chosen.suit).toBe("hearts");
  });

  it("should prefer economy (lowest winning trump, not highest)", () => {
    // Led clubs. Player 1 trumped with hearts queen (rank 2).
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "7");
    const t1 = playCard(trick, lead, 0, [lead]);
    const hQ = card("hearts", "queen");
    const t2 = playCard(t1, hQ, 1, [hQ]);

    // Player 2: hearts king (rank 3), hearts ace (rank 5), hearts 9 (rank 6)
    // All beat queen. Should pick king (rank 3) — cheapest winner.
    const hK = card("hearts", "king");
    const hA = card("hearts", "ace");
    const h9 = card("hearts", "9");
    const hand = [h9, hA, hK];

    const chosen = chooseCard(hand, t2, "hearts", 2 as PlayerPosition);
    expect(chosen.id).toBe(hK.id);
  });

  it("should always return a valid play when trumping", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const h7 = card("hearts", "7");
    const h9 = card("hearts", "9");
    const dK = card("diamonds", "king");
    const hand = [h7, h9, dK];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    expect(isValidPlay(t1, chosen, 1 as PlayerPosition, hand)).toBe(true);
  });
});

// ==============================================================
// chooseCard — Discarding
// ==============================================================

describe("chooseCard — Discarding", () => {
  it("should play lowest value card", () => {
    // Led spades. Player 1 has no spades and no trump (hearts).
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const dK = card("diamonds", "king"); // 4 pts
    const c7 = card("clubs", "7"); // 0 pts
    const d10 = card("diamonds", "10"); // 10 pts
    const hand = [dK, c7, d10];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    expect(chosen.id).toBe(c7.id);
  });

  it("should prefer zero-point cards", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const d8 = card("diamonds", "8"); // 0 pts
    const cQ = card("clubs", "queen"); // 3 pts
    const hand = [cQ, d8];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    expect(chosen.id).toBe(d8.id);
  });

  it("should handle single card in hand", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const d7 = card("diamonds", "7");
    const hand = [d7];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    expect(chosen.id).toBe(d7.id);
  });

  it("should always return a valid play when discarding", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const dK = card("diamonds", "king");
    const c7 = card("clubs", "7");
    const hand = [dK, c7];

    const chosen = chooseCard(hand, t1, "hearts", 1 as PlayerPosition);
    expect(isValidPlay(t1, chosen, 1 as PlayerPosition, hand)).toBe(true);
  });
});

// ==============================================================
// chooseCardForRound
// ==============================================================

describe("chooseCardForRound", () => {
  it("should throw if round phase is not 'playing'", () => {
    // Manually construct a minimal round in bidding phase
    const fakeBiddingRound = Object.freeze({
      id: idGen.generateId("bidding_round"),
      dealerPosition: 0 as PlayerPosition,
      bids: Object.freeze([]),
      currentPlayerPosition: 1 as PlayerPosition,
      state: "in_progress" as const,
      consecutivePasses: 0,
      highestBid: null,
      coinched: false,
      surcoinched: false,
    });

    const players = Object.freeze([
      setPlayerHand(createPlayer("N", 0, idGen), [card("spades", "ace")]),
      setPlayerHand(createPlayer("E", 1, idGen), [card("spades", "king")]),
      setPlayerHand(createPlayer("S", 2, idGen), [card("spades", "queen")]),
      setPlayerHand(createPlayer("W", 3, idGen), [card("spades", "jack")]),
    ]) as readonly [
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
    ];

    const round = Object.freeze({
      id: idGen.generateId("round"),
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players,
      biddingRound: fakeBiddingRound,
      contract: null,
      tricks: Object.freeze([]),
      currentTrick: null,
      roundScore: null,
      phase: "bidding" as const,
    });

    expect(() => chooseCardForRound(round, 1 as PlayerPosition)).toThrow(/not.*playing/i);
  });

  it("should throw if no current trick exists", () => {
    const players = Object.freeze([
      setPlayerHand(createPlayer("N", 0, idGen), [card("spades", "ace")]),
      setPlayerHand(createPlayer("E", 1, idGen), [card("spades", "king")]),
      setPlayerHand(createPlayer("S", 2, idGen), [card("spades", "queen")]),
      setPlayerHand(createPlayer("W", 3, idGen), [card("spades", "jack")]),
    ]) as readonly [
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
    ];

    const round = Object.freeze({
      id: idGen.generateId("round"),
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players,
      biddingRound: Object.freeze({
        id: idGen.generateId("bidding_round"),
        dealerPosition: 0 as PlayerPosition,
        bids: Object.freeze([]),
        currentPlayerPosition: 1 as PlayerPosition,
        state: "completed" as const,
        consecutivePasses: 3,
        highestBid: null,
        coinched: false,
        surcoinched: false,
      }),
      contract: Object.freeze({
        id: idGen.generateId("contract"),
        suit: "hearts" as const,
        value: 90 as const,
        bidderPosition: 1 as PlayerPosition,
        coincheLevel: 1 as const,
      }),
      tricks: Object.freeze([]),
      currentTrick: null, // No current trick
      roundScore: null,
      phase: "playing" as const,
    });

    expect(() => chooseCardForRound(round, 1 as PlayerPosition)).toThrow(
      /no current trick|contract/i,
    );
  });

  it("should extract correct state from Round and return valid card", () => {
    const sA = card("spades", "ace");
    const sK = card("spades", "king");
    const sQ = card("spades", "queen");
    const sJ = card("spades", "jack");

    const currentTrick = createTrick(1, "hearts", idGen);

    const players = Object.freeze([
      setPlayerHand(createPlayer("N", 0, idGen), [sA]),
      setPlayerHand(createPlayer("E", 1, idGen), [sK]),
      setPlayerHand(createPlayer("S", 2, idGen), [sQ]),
      setPlayerHand(createPlayer("W", 3, idGen), [sJ]),
    ]) as readonly [
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
    ];

    const round = Object.freeze({
      id: idGen.generateId("round"),
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players,
      biddingRound: Object.freeze({
        id: idGen.generateId("bidding_round"),
        dealerPosition: 0 as PlayerPosition,
        bids: Object.freeze([]),
        currentPlayerPosition: 1 as PlayerPosition,
        state: "completed" as const,
        consecutivePasses: 3,
        highestBid: null,
        coinched: false,
        surcoinched: false,
      }),
      contract: Object.freeze({
        id: idGen.generateId("contract"),
        suit: "hearts" as const,
        value: 90 as const,
        bidderPosition: 1 as PlayerPosition,
        coincheLevel: 1 as const,
      }),
      tricks: Object.freeze([]),
      currentTrick,
      roundScore: null,
      phase: "playing" as const,
    });

    const chosen = chooseCardForRound(round, 1 as PlayerPosition);
    expect(chosen.id).toBe(sK.id); // Only card in hand
  });

  it("should find the correct player's hand by position", () => {
    const sA = card("spades", "ace");
    const h7 = card("hearts", "7");
    const d10 = card("diamonds", "10");
    const cK = card("clubs", "king");

    const currentTrick = createTrick(2, "hearts", idGen);

    const players = Object.freeze([
      setPlayerHand(createPlayer("N", 0, idGen), [sA]),
      setPlayerHand(createPlayer("E", 1, idGen), [h7]),
      setPlayerHand(createPlayer("S", 2, idGen), [d10]),
      setPlayerHand(createPlayer("W", 3, idGen), [cK]),
    ]) as readonly [
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
      ReturnType<typeof createPlayer>,
    ];

    const round = Object.freeze({
      id: idGen.generateId("round"),
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players,
      biddingRound: Object.freeze({
        id: idGen.generateId("bidding_round"),
        dealerPosition: 0 as PlayerPosition,
        bids: Object.freeze([]),
        currentPlayerPosition: 1 as PlayerPosition,
        state: "completed" as const,
        consecutivePasses: 3,
        highestBid: null,
        coinched: false,
        surcoinched: false,
      }),
      contract: Object.freeze({
        id: idGen.generateId("contract"),
        suit: "hearts" as const,
        value: 90 as const,
        bidderPosition: 1 as PlayerPosition,
        coincheLevel: 1 as const,
      }),
      tricks: Object.freeze([]),
      currentTrick,
      roundScore: null,
      phase: "playing" as const,
    });

    // Position 2 is leader with d10 in hand
    const chosen = chooseCardForRound(round, 2 as PlayerPosition);
    expect(chosen.id).toBe(d10.id);
  });
});

// ==============================================================
// chooseBid — Hand evaluation
// ==============================================================

describe("chooseBid — Hand evaluation", () => {
  it("should pass with a weak hand (no strong suit)", () => {
    const gen = createIdGenerator({ seed: 200 });
    const round = createBiddingRound(0, gen);

    // Weak hand: low cards, no strong trump potential
    const hand = [
      card("spades", "7"),
      card("spades", "8"),
      card("diamonds", "7"),
      card("diamonds", "8"),
      card("clubs", "7"),
      card("clubs", "8"),
      card("hearts", "7"),
      card("hearts", "8"),
    ];

    const bid = chooseBid(hand, round, 1 as PlayerPosition, gen);
    expect(bid.type).toBe("pass");
  });

  it("should bid 80 with J+9+A of a suit (strong trump core)", () => {
    const gen = createIdGenerator({ seed: 201 });
    const round = createBiddingRound(0, gen);

    // Strong hearts: J(20) + 9(14) + A(11) = 45 trump pts + 3 cards * 5 length bonus = 60
    // Plus ace of spades = 11 support → total 71. Below 80 threshold.
    // Let's add more: J(20) + 9(14) + A(11) + 10(10) = 55 + 4*5 = 75 + ace support 11 = 86 >= 80
    const hand = [
      card("hearts", "jack"),
      card("hearts", "9"),
      card("hearts", "ace"),
      card("hearts", "10"),
      card("spades", "ace"),
      card("diamonds", "7"),
      card("clubs", "8"),
      card("clubs", "7"),
    ];

    const bid = chooseBid(hand, round, 1 as PlayerPosition, gen);
    expect(bid.type).toBe("suit");
    expect(bid.suit).toBe("hearts");
    expect(bid.value).toBe(90);
  });

  it("should choose the strongest suit as trump", () => {
    const gen = createIdGenerator({ seed: 202 });
    const round = createBiddingRound(0, gen);

    // Spades: J(20) + 9(14) + A(11) + 10(10) = 55 + 4*5 = 75 + ace support(11) = 86
    // Hearts: 7(0) + 8(0) = 0 + 2*5 = 10
    // Spades clearly stronger
    const hand = [
      card("spades", "jack"),
      card("spades", "9"),
      card("spades", "ace"),
      card("spades", "10"),
      card("hearts", "7"),
      card("hearts", "8"),
      card("diamonds", "ace"),
      card("clubs", "7"),
    ];

    const bid = chooseBid(hand, round, 1 as PlayerPosition, gen);
    expect(bid.type).toBe("suit");
    expect(bid.suit).toBe("spades");
  });

  it("should consider aces in other suits as support", () => {
    const gen = createIdGenerator({ seed: 203 });
    const round = createBiddingRound(0, gen);

    // Hearts: J(20) + 9(14) = 34 + 2*5 = 44 trump pts
    // Support: 3 aces × 11 = 33 → total 77. Still below 80.
    // Add hearts king: J(20) + 9(14) + K(4) = 38 + 3*5 = 53 + 33 aces = 86 >= 80
    const hand = [
      card("hearts", "jack"),
      card("hearts", "9"),
      card("hearts", "king"),
      card("spades", "ace"),
      card("diamonds", "ace"),
      card("clubs", "ace"),
      card("spades", "7"),
      card("diamonds", "8"),
    ];

    const bid = chooseBid(hand, round, 1 as PlayerPosition, gen);
    expect(bid.type).toBe("suit");
    expect(bid.suit).toBe("hearts");
  });

  it("should bid higher with a very strong hand (J+9+A+10+K)", () => {
    const gen = createIdGenerator({ seed: 204 });
    const round = createBiddingRound(0, gen);

    // Hearts: J(20) + 9(14) + A(11) + 10(10) + K(4) = 59 + 5*5 = 84
    // Support: 2 aces × 11 = 22 → total 106. Can bid up to 100.
    const hand = [
      card("hearts", "jack"),
      card("hearts", "9"),
      card("hearts", "ace"),
      card("hearts", "10"),
      card("hearts", "king"),
      card("spades", "ace"),
      card("diamonds", "ace"),
      card("clubs", "7"),
    ];

    const bid = chooseBid(hand, round, 1 as PlayerPosition, gen);
    expect(bid.type).toBe("suit");
    expect(bid.value).toBeGreaterThanOrEqual(90);
  });

  it("should pass when hand strength is below minimum outbid value", () => {
    const gen = createIdGenerator({ seed: 205 });
    let round = createBiddingRound(0, gen);
    // Position 1 bids 130 hearts
    round = placeBid(round, createSuitBid(1, 130, "hearts", gen));

    // Position 2 has a decent hand (~100 strength) but can't bid above 130
    const hand = [
      card("spades", "jack"),
      card("spades", "9"),
      card("spades", "ace"),
      card("spades", "10"),
      card("diamonds", "ace"),
      card("clubs", "7"),
      card("clubs", "8"),
      card("hearts", "7"),
    ];

    const bid = chooseBid(hand, round, 2 as PlayerPosition, gen);
    expect(bid.type).toBe("pass");
  });

  it("should bid next valid value above current highest bid", () => {
    const gen = createIdGenerator({ seed: 206 });
    let round = createBiddingRound(0, gen);
    // Position 1 bids 80 clubs
    round = placeBid(round, createSuitBid(1, 90, "clubs", gen));

    // Position 2 has very strong spades (strength ~106)
    const hand = [
      card("spades", "jack"),
      card("spades", "9"),
      card("spades", "ace"),
      card("spades", "10"),
      card("spades", "king"),
      card("diamonds", "ace"),
      card("clubs", "ace"),
      card("hearts", "7"),
    ];

    const bid = chooseBid(hand, round, 2 as PlayerPosition, gen);
    expect(bid.type).toBe("suit");
    // Must be > 80
    expect(bid.value).toBeGreaterThan(90);
  });

  it("should always pass when coinched (simple AI)", () => {
    const gen = createIdGenerator({ seed: 207 });
    let round = createBiddingRound(0, gen);
    // Position 1 bids 80 hearts
    round = placeBid(round, createSuitBid(1, 90, "hearts", gen));
    // Position 2 coinches
    round = placeBid(round, createCoincheBid(2, gen));

    // Position 3 has a very strong hand but simple AI always passes when coinched
    const hand = [
      card("hearts", "jack"),
      card("hearts", "9"),
      card("hearts", "ace"),
      card("hearts", "10"),
      card("hearts", "king"),
      card("spades", "ace"),
      card("diamonds", "ace"),
      card("clubs", "ace"),
    ];

    const bid = chooseBid(hand, round, 3 as PlayerPosition, gen);
    expect(bid.type).toBe("pass");
  });
});

// ==============================================================
// chooseBid — Integration
// ==============================================================

describe("chooseBid — Integration", () => {
  it("should return a bid compatible with placeBid (no throw)", () => {
    const gen = createIdGenerator({ seed: 300 });
    const round = createBiddingRound(0, gen);

    const hand = [
      card("hearts", "jack"),
      card("hearts", "9"),
      card("hearts", "ace"),
      card("hearts", "10"),
      card("spades", "ace"),
      card("diamonds", "7"),
      card("clubs", "8"),
      card("clubs", "7"),
    ];

    const bid = chooseBid(hand, round, 1 as PlayerPosition, gen);
    // Should not throw when placed
    expect(() => placeBid(round, bid)).not.toThrow();
  });

  it("should handle being first bidder", () => {
    const gen = createIdGenerator({ seed: 301 });
    const round = createBiddingRound(0, gen);

    const hand = [
      card("spades", "7"),
      card("spades", "8"),
      card("diamonds", "7"),
      card("diamonds", "8"),
      card("clubs", "7"),
      card("clubs", "8"),
      card("hearts", "7"),
      card("hearts", "8"),
    ];

    const bid = chooseBid(hand, round, 1 as PlayerPosition, gen);
    // Weak hand → should pass
    expect(bid.type).toBe("pass");
    expect(bid.playerPosition).toBe(1);
  });

  it("should handle being subsequent bidder with existing bids", () => {
    const gen = createIdGenerator({ seed: 302 });
    let round = createBiddingRound(0, gen);
    // Position 1 bids 80 hearts
    round = placeBid(round, createSuitBid(1, 90, "hearts", gen));

    const hand = [
      card("spades", "7"),
      card("spades", "8"),
      card("diamonds", "7"),
      card("diamonds", "8"),
      card("clubs", "7"),
      card("clubs", "8"),
      card("hearts", "7"),
      card("hearts", "8"),
    ];

    const bid = chooseBid(hand, round, 2 as PlayerPosition, gen);
    expect(bid.type).toBe("pass"); // Weak hand
    expect(bid.playerPosition).toBe(2);
  });

  it("should pass when bidding round is not in progress", () => {
    const gen = createIdGenerator({ seed: 303 });
    let round = createBiddingRound(0, gen);
    // All pass → all_passed
    round = placeBid(round, createPassBid(1, gen));
    round = placeBid(round, createPassBid(2, gen));
    round = placeBid(round, createPassBid(3, gen));
    round = placeBid(round, createPassBid(0, gen));
    expect(round.state).toBe("all_passed");

    const hand = [
      card("hearts", "jack"),
      card("hearts", "9"),
      card("hearts", "ace"),
      card("hearts", "10"),
      card("hearts", "king"),
      card("spades", "ace"),
      card("diamonds", "ace"),
      card("clubs", "ace"),
    ];

    const bid = chooseBid(hand, round, 0 as PlayerPosition, gen);
    expect(bid.type).toBe("pass");
  });
});

// ==============================================================
// evaluateHandForSuit
// ==============================================================

describe("evaluateHandForSuit", () => {
  it("should score J+9 of trump suit correctly (20+14 + length bonus)", () => {
    const hand = [card("hearts", "jack"), card("hearts", "9"), card("spades", "7")];

    const score = evaluateHandForSuit(hand, "hearts");
    // J=20 + 9=14 = 34 trump pts + 2 cards * 5 = 10 length bonus = 44
    expect(score).toBe(44);
  });

  it("should score aces in other suits as support", () => {
    const hand = [card("hearts", "jack"), card("spades", "ace"), card("diamonds", "ace")];

    const score = evaluateHandForSuit(hand, "hearts");
    // Hearts: J=20, 1 card * 5 = 5 → 25 trump
    // Support: 2 aces × 11 = 22
    // Total: 47
    expect(score).toBe(47);
  });

  it("should return 0 for suit with no cards", () => {
    const hand = [card("spades", "7"), card("diamonds", "8")];

    const score = evaluateHandForSuit(hand, "hearts");
    // No hearts cards, no non-trump aces → 0
    expect(score).toBe(0);
  });

  it("should handle 8-card all-trump hand", () => {
    const hand = [
      card("hearts", "7"),
      card("hearts", "8"),
      card("hearts", "9"),
      card("hearts", "10"),
      card("hearts", "jack"),
      card("hearts", "queen"),
      card("hearts", "king"),
      card("hearts", "ace"),
    ];

    const score = evaluateHandForSuit(hand, "hearts");
    // All 8 cards: 0+0+14+10+20+3+4+11 = 62 trump pts + 8*5 = 40 length bonus = 102
    expect(score).toBe(102);
  });
});
