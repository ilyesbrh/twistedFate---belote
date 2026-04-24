import { describe, it, expect, beforeEach } from "vitest";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";
import { createCard, createDeck, shuffleDeck } from "../../src/models/card.js";
import type { Card, Suit, Rank } from "../../src/models/card.js";
import { createPlayer } from "../../src/models/player.js";
import type { Player, PlayerPosition } from "../../src/models/player.js";
import {
  createSuitBid,
  createPassBid,
  createCoincheBid,
  createSurcoincheBid,
} from "../../src/models/bid.js";
import type { BidValue } from "../../src/models/bid.js";
import { createRound, placeBidInRound, playCardInRound } from "../../src/models/round.js";
import type { Round } from "../../src/models/round.js";

// ==============================================================
// Test Helpers
// ==============================================================

let idGen: IdGenerator;

// Seeded RNG for shuffleDeck (deterministic)
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

beforeEach(() => {
  idGen = createIdGenerator({ seed: 42 });
});

function makePlayers(): readonly [Player, Player, Player, Player] {
  return [
    createPlayer("North", 0, idGen),
    createPlayer("East", 1, idGen),
    createPlayer("South", 2, idGen),
    createPlayer("West", 3, idGen),
  ] as const;
}

function makeDeck(): Card[] {
  const deck = createDeck(idGen);
  return shuffleDeck(deck, mulberry32(123));
}

function makeRoundInBidding(dealerPosition: PlayerPosition = 0): Round {
  return createRound(1, dealerPosition, makePlayers(), makeDeck(), idGen);
}

/**
 * Completes bidding: bid 80 hearts from dealer+1, then 3 passes.
 * Returns round in "playing" phase.
 */
function completeBidding(round: Round): Round {
  const firstBidder = round.biddingRound.currentPlayerPosition;
  const secondBidder = ((firstBidder + 1) % 4) as PlayerPosition;
  const thirdBidder = ((firstBidder + 2) % 4) as PlayerPosition;
  const fourthBidder = ((firstBidder + 3) % 4) as PlayerPosition;

  let r = placeBidInRound(round, createSuitBid(firstBidder, 90, "hearts", idGen), idGen);
  r = placeBidInRound(r, createPassBid(secondBidder, idGen), idGen);
  r = placeBidInRound(r, createPassBid(thirdBidder, idGen), idGen);
  r = placeBidInRound(r, createPassBid(fourthBidder, idGen), idGen);
  return r;
}

/**
 * All 4 players pass. Returns round in "cancelled" phase.
 */
function allPassBidding(round: Round): Round {
  const firstBidder = round.biddingRound.currentPlayerPosition;
  const secondBidder = ((firstBidder + 1) % 4) as PlayerPosition;
  const thirdBidder = ((firstBidder + 2) % 4) as PlayerPosition;
  const fourthBidder = ((firstBidder + 3) % 4) as PlayerPosition;

  let r = placeBidInRound(round, createPassBid(firstBidder, idGen), idGen);
  r = placeBidInRound(r, createPassBid(secondBidder, idGen), idGen);
  r = placeBidInRound(r, createPassBid(thirdBidder, idGen), idGen);
  r = placeBidInRound(r, createPassBid(fourthBidder, idGen), idGen);
  return r;
}

/**
 * Finds a card in a player's hand matching the suit. Falls back to any card.
 */
function findCardInHand(player: Player, preferredSuit?: Suit): Card {
  if (preferredSuit) {
    const suited = player.hand.find((c) => c.suit === preferredSuit);
    if (suited) return suited;
  }
  const card = player.hand[0];
  if (!card) throw new Error(`Player ${player.name} has no cards`);
  return card;
}

/**
 * Gets the player at a given position from the round.
 */
function getPlayer(round: Round, position: PlayerPosition): Player {
  const player = round.players.find((p) => p.position === position);
  if (!player) throw new Error(`No player at position ${String(position)}`);
  return player;
}

/**
 * Plays a valid card for the given player position.
 * Tries to follow suit (led suit or trump), falls back to any card.
 */
function playValidCard(round: Round): Round {
  if (!round.currentTrick) throw new Error("No current trick");

  const trick = round.currentTrick;
  let currentPos: PlayerPosition;

  if (trick.cards.length === 0) {
    currentPos = trick.leadingPlayerPosition;
  } else {
    const lastCard = trick.cards[trick.cards.length - 1]!;
    currentPos = ((lastCard.playerPosition + 1) % 4) as PlayerPosition;
  }

  const player = getPlayer(round, currentPos);

  // Try to find a valid card by following the led suit
  if (trick.cards.length > 0) {
    const ledSuit = trick.cards[0]!.card.suit;
    // Try led suit first
    for (const card of player.hand) {
      if (card.suit === ledSuit) {
        return playCardInRound(round, card, currentPos, idGen);
      }
    }
    // Try trump
    for (const card of player.hand) {
      if (card.suit === trick.trumpSuit) {
        return playCardInRound(round, card, currentPos, idGen);
      }
    }
  }

  // Play any card (leading player or no constraints)
  const card = player.hand[0]!;
  return playCardInRound(round, card, currentPos, idGen);
}

/**
 * Plays a full trick (4 cards) using valid plays.
 */
function playFullTrick(round: Round): Round {
  let r = round;
  for (let i = 0; i < 4; i++) {
    r = playValidCard(r);
  }
  return r;
}

/**
 * Plays all 8 tricks to completion.
 */
function playAllTricks(round: Round): Round {
  let r = round;
  for (let t = 0; t < 8; t++) {
    r = playFullTrick(r);
  }
  return r;
}

// ==============================================================
// createRound
// ==============================================================

describe("createRound", () => {
  it("should assign an ID with round_ prefix", () => {
    const round = makeRoundInBidding();
    expect(round.id).toMatch(/^round_[a-z0-9]+$/);
  });

  it("should set the roundNumber", () => {
    const round = createRound(5, 0, makePlayers(), makeDeck(), idGen);
    expect(round.roundNumber).toBe(5);
  });

  it("should deal 8 cards to each player", () => {
    const round = makeRoundInBidding();
    for (const player of round.players) {
      expect(player.hand).toHaveLength(8);
    }
  });

  it("should create a bidding round with the correct dealer position", () => {
    const round = createRound(1, 2, makePlayers(), makeDeck(), idGen);
    expect(round.biddingRound.dealerPosition).toBe(2);
  });

  it("should set dealer+1 as the first bidder", () => {
    const round = createRound(1, 2, makePlayers(), makeDeck(), idGen);
    expect(round.biddingRound.currentPlayerPosition).toBe(3);
  });

  it("should set phase to 'bidding'", () => {
    const round = makeRoundInBidding();
    expect(round.phase).toBe("bidding");
  });

  it("should return a frozen Round with frozen arrays", () => {
    const round = makeRoundInBidding();
    expect(Object.isFrozen(round)).toBe(true);
    expect(Object.isFrozen(round.players)).toBe(true);
    expect(Object.isFrozen(round.tricks)).toBe(true);
    expect(round.contract).toBeNull();
    expect(round.currentTrick).toBeNull();
    expect(round.roundScore).toBeNull();
  });
});

// ==============================================================
// placeBidInRound — bidding phase
// ==============================================================

describe("placeBidInRound", () => {
  it("should forward a bid to the inner BiddingRound", () => {
    const round = makeRoundInBidding();
    const firstBidder = round.biddingRound.currentPlayerPosition;
    const bid = createSuitBid(firstBidder, 90, "hearts", idGen);
    const updated = placeBidInRound(round, bid, idGen);
    expect(updated.biddingRound.bids).toHaveLength(1);
    expect(updated.biddingRound.highestBid?.value).toBe(90);
  });

  it("should keep phase as 'bidding' while bidding is in progress", () => {
    const round = makeRoundInBidding();
    const firstBidder = round.biddingRound.currentPlayerPosition;
    const bid = createSuitBid(firstBidder, 90, "hearts", idGen);
    const updated = placeBidInRound(round, bid, idGen);
    expect(updated.phase).toBe("bidding");
    expect(updated.biddingRound.state).toBe("in_progress");
  });

  it("should auto-transition to 'playing' when bidding completes", () => {
    const round = makeRoundInBidding();
    const playing = completeBidding(round);
    expect(playing.phase).toBe("playing");
  });

  it("should extract the contract when transitioning to playing", () => {
    const round = makeRoundInBidding();
    const playing = completeBidding(round);
    expect(playing.contract).not.toBeNull();
    expect(playing.contract!.suit).toBe("hearts");
    expect(playing.contract!.value).toBe(90);
  });

  it("should create the first trick with dealer+1 as leader", () => {
    // Dealer=0 → first trick leader = 1
    const round = makeRoundInBidding(0);
    const playing = completeBidding(round);
    expect(playing.currentTrick).not.toBeNull();
    expect(playing.currentTrick!.leadingPlayerPosition).toBe(1);
  });

  it("should use contract trump suit for the first trick", () => {
    const round = makeRoundInBidding();
    const playing = completeBidding(round);
    expect(playing.currentTrick!.trumpSuit).toBe("hearts");
  });

  it("should auto-transition to 'cancelled' when all 4 players pass", () => {
    const round = makeRoundInBidding();
    const cancelled = allPassBidding(round);
    expect(cancelled.phase).toBe("cancelled");
  });

  it("should throw if trying to place a bid when not in bidding phase", () => {
    const round = makeRoundInBidding();
    const playing = completeBidding(round);
    expect(() => placeBidInRound(playing, createPassBid(0, idGen), idGen)).toThrow(
      /not.*bidding|phase/i,
    );
  });

  it("should handle coinche flow correctly", () => {
    const round = makeRoundInBidding(0);
    // Player 1 bids 80 hearts
    let r = placeBidInRound(round, createSuitBid(1, 90, "hearts", idGen), idGen);
    // Player 2 coinches (opponent of bidder)
    r = placeBidInRound(r, createCoincheBid(2, idGen), idGen);
    // Player 3 (bidder's team) passes → bidding completes
    r = placeBidInRound(r, createPassBid(3, idGen), idGen);
    expect(r.phase).toBe("playing");
    expect(r.contract!.coincheLevel).toBe(2);
  });

  it("should handle surcoinche flow correctly", () => {
    const round = makeRoundInBidding(0);
    let r = placeBidInRound(round, createSuitBid(1, 90, "hearts", idGen), idGen);
    r = placeBidInRound(r, createCoincheBid(2, idGen), idGen);
    // Player 3 (bidder's team) surcoinches → bidding completes immediately
    r = placeBidInRound(r, createSurcoincheBid(3, idGen), idGen);
    expect(r.phase).toBe("playing");
    expect(r.contract!.coincheLevel).toBe(4);
  });

  it("should return a frozen Round", () => {
    const round = makeRoundInBidding();
    const firstBidder = round.biddingRound.currentPlayerPosition;
    const bid = createSuitBid(firstBidder, 90, "hearts", idGen);
    const updated = placeBidInRound(round, bid, idGen);
    expect(Object.isFrozen(updated)).toBe(true);
    expect(Object.isFrozen(updated.biddingRound)).toBe(true);
  });
});

// ==============================================================
// playCardInRound — playing phase
// ==============================================================

describe("playCardInRound", () => {
  it("should play a card on the current trick", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const leader = round.currentTrick!.leadingPlayerPosition;
    const player = getPlayer(round, leader);
    const card = player.hand[0]!;
    const updated = playCardInRound(round, card, leader, idGen);
    expect(updated.currentTrick!.cards).toHaveLength(1);
  });

  it("should remove the played card from the player's hand", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const leader = round.currentTrick!.leadingPlayerPosition;
    const player = getPlayer(round, leader);
    const card = player.hand[0]!;
    const updated = playCardInRound(round, card, leader, idGen);
    const updatedPlayer = getPlayer(updated, leader);
    expect(updatedPlayer.hand).toHaveLength(7);
    expect(updatedPlayer.hand.find((c) => c.id === card.id)).toBeUndefined();
  });

  it("should update the player in the players tuple", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const leader = round.currentTrick!.leadingPlayerPosition;
    const player = getPlayer(round, leader);
    const card = player.hand[0]!;
    const updated = playCardInRound(round, card, leader, idGen);
    // Verify it's a new reference
    const originalPlayer = getPlayer(round, leader);
    const newPlayer = getPlayer(updated, leader);
    expect(newPlayer).not.toBe(originalPlayer);
    expect(newPlayer.hand.length).toBe(originalPlayer.hand.length - 1);
  });

  it("should complete a trick after 4 cards", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const afterTrick = playFullTrick(round);
    // After 4 plays, trick should be completed and moved to tricks array
    expect(afterTrick.tricks).toHaveLength(1);
    expect(afterTrick.tricks[0]!.state).toBe("completed");
  });

  it("should move completed trick to tricks array", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const afterTrick = playFullTrick(round);
    expect(afterTrick.tricks).toHaveLength(1);
    expect(afterTrick.tricks[0]!.winnerPosition).not.toBeNull();
  });

  it("should create a new trick after the previous one completes", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const afterTrick = playFullTrick(round);
    // Should have a new current trick for trick #2
    expect(afterTrick.currentTrick).not.toBeNull();
    expect(afterTrick.currentTrick!.state).toBe("in_progress");
    expect(afterTrick.currentTrick!.cards).toHaveLength(0);
  });

  it("should set the winner of the previous trick as leader of the next trick", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const afterTrick = playFullTrick(round);
    const trick1Winner = afterTrick.tricks[0]!.winnerPosition!;
    expect(afterTrick.currentTrick!.leadingPlayerPosition).toBe(trick1Winner);
  });

  it("should transition to 'completed' after the 8th trick", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const completed = playAllTricks(round);
    expect(completed.phase).toBe("completed");
  });

  it("should calculate the round score on completion", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const completed = playAllTricks(round);
    expect(completed.roundScore).not.toBeNull();
    expect(typeof completed.roundScore!.contractMet).toBe("boolean");
    expect(typeof completed.roundScore!.contractingTeamFinalScore).toBe("number");
    expect(typeof completed.roundScore!.opponentTeamFinalScore).toBe("number");
  });

  it("should have empty hands for all players after 8 tricks", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const completed = playAllTricks(round);
    for (const player of completed.players) {
      expect(player.hand).toHaveLength(0);
    }
  });

  it("should throw if trying to play a card when not in playing phase", () => {
    const round = makeRoundInBidding(0);
    const player = getPlayer(round, 0);
    const card = player.hand[0]!;
    expect(() => playCardInRound(round, card, 0, idGen)).toThrow(/not.*playing|phase/i);
  });

  it("should throw if the wrong player tries to play", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const leader = round.currentTrick!.leadingPlayerPosition;
    const wrongPlayer = ((leader + 1) % 4) as PlayerPosition;
    const player = getPlayer(round, wrongPlayer);
    const card = player.hand[0]!;
    // The inner playCard validates turn order and will throw
    expect(() => playCardInRound(round, card, wrongPlayer, idGen)).toThrow();
  });

  it("should throw if card is not in the player's hand", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const leader = round.currentTrick!.leadingPlayerPosition;
    // Create a card that's not in anyone's hand
    const fakeCard = createCard("spades", "ace", idGen);
    expect(() => playCardInRound(round, fakeCard, leader, idGen)).toThrow();
  });

  it("should delegate play validation to inner playCard", () => {
    // The validation rules (must follow suit, etc.) are tested in trick.test.ts.
    // Here we just verify delegation happens — an invalid play should throw.
    const round = completeBidding(makeRoundInBidding(0));
    const leader = round.currentTrick!.leadingPlayerPosition;
    const player = getPlayer(round, leader);
    const card = player.hand[0]!;
    // Play the first card (leader)
    const r2 = playCardInRound(round, card, leader, idGen);
    // Try to play from a player who doesn't have the right suit
    // (this delegates to isValidPlay which will enforce suit-following)
    // We just verify that wrong-turn plays throw
    const wrongPos = ((leader + 2) % 4) as PlayerPosition;
    const wrongPlayer = getPlayer(r2, wrongPos);
    if (wrongPlayer.hand.length > 0) {
      expect(() => playCardInRound(r2, wrongPlayer.hand[0]!, wrongPos, idGen)).toThrow();
    }
  });

  it("should return a frozen Round after each play", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const leader = round.currentTrick!.leadingPlayerPosition;
    const player = getPlayer(round, leader);
    const card = player.hand[0]!;
    const updated = playCardInRound(round, card, leader, idGen);
    expect(Object.isFrozen(updated)).toBe(true);
    expect(Object.isFrozen(updated.players)).toBe(true);
    expect(Object.isFrozen(updated.tricks)).toBe(true);
    expect(Object.isFrozen(updated.currentTrick)).toBe(true);
  });
});

// ==============================================================
// playCardInRound — trick leader logic
// ==============================================================

describe("playCardInRound — trick leader logic", () => {
  it("should set dealer+1 as leader of the first trick", () => {
    // Dealer=0 → first trick leader = 1
    const round = completeBidding(makeRoundInBidding(0));
    expect(round.currentTrick!.leadingPlayerPosition).toBe(1);
  });

  it("should set trick 1 winner as leader of trick 2", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const afterTrick1 = playFullTrick(round);
    const winner = afterTrick1.tricks[0]!.winnerPosition!;
    expect(afterTrick1.currentTrick!.leadingPlayerPosition).toBe(winner);
  });

  it("should chain trick leaders through multiple tricks", () => {
    const round = completeBidding(makeRoundInBidding(0));
    let r = round;
    for (let t = 0; t < 4; t++) {
      r = playFullTrick(r);
      const winner = r.tricks[t]!.winnerPosition!;
      if (t < 3) {
        // Next trick's leader should be this trick's winner
        expect(r.currentTrick!.leadingPlayerPosition).toBe(winner);
      }
    }
  });
});

// ==============================================================
// cancelled phase
// ==============================================================

describe("cancelled phase", () => {
  it("should have no contract, no tricks, no score", () => {
    const round = allPassBidding(makeRoundInBidding());
    expect(round.contract).toBeNull();
    expect(round.tricks).toHaveLength(0);
    expect(round.currentTrick).toBeNull();
    expect(round.roundScore).toBeNull();
  });

  it("should throw if trying to play a card in cancelled phase", () => {
    const round = allPassBidding(makeRoundInBidding());
    const player = getPlayer(round, 0);
    const card = player.hand[0]!;
    expect(() => playCardInRound(round, card, 0, idGen)).toThrow(/not.*playing|phase/i);
  });
});

// ==============================================================
// completed phase
// ==============================================================

describe("completed phase", () => {
  it("should have a non-null roundScore after completion", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const completed = playAllTricks(round);
    expect(completed.roundScore).not.toBeNull();
  });

  it("should have all 8 tricks in the tricks array", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const completed = playAllTricks(round);
    expect(completed.tricks).toHaveLength(8);
    for (const trick of completed.tricks) {
      expect(trick.state).toBe("completed");
    }
  });

  it("should have currentTrick set to null", () => {
    const round = completeBidding(makeRoundInBidding(0));
    const completed = playAllTricks(round);
    expect(completed.currentTrick).toBeNull();
  });
});

// ==============================================================
// Integration
// ==============================================================

describe("Round integration", () => {
  it("should execute a full round lifecycle: deal → bid → 8 tricks → score", () => {
    // Create round
    const round = makeRoundInBidding(0);
    expect(round.phase).toBe("bidding");
    expect(round.players.every((p) => p.hand.length === 8)).toBe(true);

    // Complete bidding
    const playing = completeBidding(round);
    expect(playing.phase).toBe("playing");
    expect(playing.contract).not.toBeNull();
    expect(playing.currentTrick).not.toBeNull();

    // Play 8 tricks
    const completed = playAllTricks(playing);
    expect(completed.phase).toBe("completed");
    expect(completed.tricks).toHaveLength(8);
    expect(completed.roundScore).not.toBeNull();
    expect(completed.players.every((p) => p.hand.length === 0)).toBe(true);

    // Score should sum to 162 (before multiplier/belote)
    const score = completed.roundScore!;
    expect(score.contractingTeamPoints + score.opponentTeamPoints).toBe(162);
  });

  it("should execute an all-passed round lifecycle: deal → 4 passes → cancelled", () => {
    const round = makeRoundInBidding(0);
    const cancelled = allPassBidding(round);
    expect(cancelled.phase).toBe("cancelled");
    expect(cancelled.contract).toBeNull();
    expect(cancelled.tricks).toHaveLength(0);
    expect(cancelled.roundScore).toBeNull();
    // Players still have their cards
    expect(cancelled.players.every((p) => p.hand.length === 8)).toBe(true);
  });

  it("should correctly track trick count through all 8 tricks", () => {
    const round = completeBidding(makeRoundInBidding(0));
    let r = round;
    for (let t = 0; t < 8; t++) {
      expect(r.tricks).toHaveLength(t);
      r = playFullTrick(r);
      expect(r.tricks).toHaveLength(t + 1);
    }
    expect(r.phase).toBe("completed");
  });

  it("should handle a round with different dealer positions", () => {
    // Dealer=2 → first bidder = 3, first trick leader = 3
    const round = makeRoundInBidding(2);
    expect(round.biddingRound.currentPlayerPosition).toBe(3);

    const playing = completeBidding(round);
    expect(playing.currentTrick!.leadingPlayerPosition).toBe(3);

    const completed = playAllTricks(playing);
    expect(completed.phase).toBe("completed");
    expect(completed.tricks).toHaveLength(8);
  });
});
