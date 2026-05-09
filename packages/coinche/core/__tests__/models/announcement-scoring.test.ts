/**
 * Iteration 057 — Announcement scoring integration tests
 *
 * Tests that:
 * 1. After bidding completes, nsAnnouncements/ewAnnouncements are populated on Round
 * 2. Winner + points are computed correctly at bidding-complete time
 * 3. calculateRoundScore adds announcement points to the right team's final score
 * 4. Announcement points survive even when the contract fails
 * 5. No announcements → no change to final scores
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";
import { createCard, createDeck, shuffleDeck } from "../../src/models/card.js";
import type { Card, Suit, Rank } from "../../src/models/card.js";
import { createPlayer, setPlayerHand } from "../../src/models/player.js";
import type { Player, PlayerPosition } from "../../src/models/player.js";
import { createSuitBid, createPassBid } from "../../src/models/bid.js";
import type { Contract } from "../../src/models/bid.js";
import { createRound, placeBidInRound, playCardInRound } from "../../src/models/round.js";
import type { Round } from "../../src/models/round.js";
import { calculateRoundScore } from "../../src/models/scoring.js";
import type { Trick, PlayedCard } from "../../src/models/trick.js";

// ── Helpers ─────────────────────────────────────────────────────

let idGen: IdGenerator;

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

function c(suit: Suit, rank: Rank): Card {
  return createCard(suit, rank, idGen);
}

function makePlayers(): [Player, Player, Player, Player] {
  return [
    createPlayer("North", 0, idGen),
    createPlayer("East", 1, idGen),
    createPlayer("South", 2, idGen),
    createPlayer("West", 3, idGen),
  ];
}

function makeDeck(): Card[] {
  const deck = createDeck(idGen);
  return shuffleDeck(deck, mulberry32(123));
}

/**
 * Builds a round where players have specific hands, then completes bidding.
 * Player 0 (North) bids 80 hearts from position, passes fill the rest.
 * Returns the round in "playing" phase so we can inspect the populated fields.
 *
 * hands[i] = hand for player i (if undefined, keeps dealt hand)
 */
function buildRoundWithHands(
  hands: [readonly Card[], readonly Card[], readonly Card[], readonly Card[]],
): Round {
  const players = makePlayers();
  // We'll use a standard deck but override hands after creating the round
  const deck = makeDeck();
  let round = createRound(1, 0, players as readonly [Player, Player, Player, Player], deck, idGen);

  // Override hands using setPlayerHand — we need players with the right hands
  const newPlayers: [Player, Player, Player, Player] = [
    setPlayerHand(round.players[0]!, hands[0]),
    setPlayerHand(round.players[1]!, hands[1]),
    setPlayerHand(round.players[2]!, hands[2]),
    setPlayerHand(round.players[3]!, hands[3]),
  ];

  // Re-create the round with overridden hands
  // We do this by rebuilding the object — but createRound re-deals,
  // so we must use a different approach: create round, then patch players.
  // Since Round is frozen, we need to create a test-only variant.
  // Instead, let's use the round's biddingRound as-is but replace players.
  // We can do this by creating the round normally and then overriding via
  // a helper that mimics internal structure (for test purposes).

  // Simpler approach: set hands on the players array directly by creating a new round
  // that uses the overridden players. We use the internal round shape.
  const patchedRound: Round = Object.freeze({
    ...round,
    players: Object.freeze(newPlayers) as unknown as readonly [Player, Player, Player, Player],
  });

  // Now complete bidding: player 1 (dealer+1) bids 80 hearts, rest pass
  const firstBidder = patchedRound.biddingRound.currentPlayerPosition; // 1
  const p2 = ((firstBidder + 1) % 4) as PlayerPosition;
  const p3 = ((firstBidder + 2) % 4) as PlayerPosition;
  const p4 = ((firstBidder + 3) % 4) as PlayerPosition;

  let r = placeBidInRound(patchedRound, createSuitBid(firstBidder, 90, "hearts", idGen), idGen);
  r = placeBidInRound(r, createPassBid(p2, idGen), idGen);
  r = placeBidInRound(r, createPassBid(p3, idGen), idGen);
  r = placeBidInRound(r, createPassBid(p4, idGen), idGen);
  return r; // now in "playing" phase, announcements populated
}

/** Build a minimal completed Trick for score calculation tests. */
function makeTrick(
  cards: Array<{ suit: Suit; rank: Rank; pos: PlayerPosition }>,
  winner: PlayerPosition,
  trumpSuit: Suit,
): Trick {
  const playedCards: PlayedCard[] = cards.map((e) =>
    Object.freeze({ card: c(e.suit, e.rank), playerPosition: e.pos }),
  );
  return Object.freeze({
    id: idGen.generateId("trick"),
    leadingPlayerPosition: cards[0]!.pos,
    trumpSuit,
    contractType: "suit" as const,
    cards: Object.freeze(playedCards),
    state: "completed" as const,
    winnerPosition: winner,
  });
}

/** Build 8 completed tricks where pos 0 wins all of them. Suit contract, hearts trump. */
function makeAllTricksWonBy(winnerPos: PlayerPosition): Trick[] {
  const tricks: Trick[] = [];
  // 8 tricks, each 4 cards — minimal valid card values
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["7", "8", "9", "10", "jack", "queen", "king", "ace"];
  for (let t = 0; t < 8; t++) {
    const suit = suits[t % 4]!;
    const cards = [0, 1, 2, 3].map((i) => ({
      suit,
      rank: ranks[t]!,
      pos: ((winnerPos + i) % 4) as PlayerPosition,
    }));
    // Simplify: winner leads and plays the highest card — but for scoring we
    // just need winnerPosition to be set correctly. We pass winner directly.
    tricks.push(makeTrick(cards, winnerPos, "hearts"));
  }
  return tricks;
}

/** Build a minimal Contract for NS contracting team (bidder = 0). */
function makeContract(bidderPos: PlayerPosition, value = 90): Contract {
  return Object.freeze({
    id: idGen.generateId("contract"),
    bidderPosition: bidderPos,
    suit: "hearts",
    value,
    contractType: "suit" as const,
    coincheLevel: 1,
    isCapot: false,
  });
}

// ══════════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════════

describe("Iteration 057 — Announcement scoring in Round", () => {
  // ── Test 1: nsAnnouncements/ewAnnouncements populated after bidding ──

  it("1. nsAnnouncements/ewAnnouncements are populated when bidding completes", () => {
    // Position 0 (NS) has a tierce in hearts
    const nsHand0: readonly Card[] = [
      c("hearts", "ace"),
      c("hearts", "king"),
      c("hearts", "queen"),
      c("spades", "7"),
      c("diamonds", "8"),
      c("clubs", "9"),
      c("spades", "10"),
      c("diamonds", "jack"),
    ];
    // Position 2 (NS partner) has no announcements
    const nsHand2: readonly Card[] = [
      c("spades", "ace"),
      c("clubs", "8"),
      c("diamonds", "7"),
      c("hearts", "7"),
      c("clubs", "7"),
      c("spades", "8"),
      c("diamonds", "9"),
      c("clubs", "10"),
    ];
    const ewHand: readonly Card[] = [
      c("hearts", "8"),
      c("spades", "9"),
      c("clubs", "king"),
      c("diamonds", "king"),
      c("clubs", "queen"),
      c("spades", "queen"),
      c("hearts", "9"),
      c("spades", "king"),
    ];
    const ewHand3: readonly Card[] = [
      c("diamonds", "queen"),
      c("clubs", "ace"),
      c("diamonds", "ace"),
      c("hearts", "10"),
      c("spades", "10"),
      c("clubs", "jack"),
      c("diamonds", "jack"),
      c("hearts", "king"),
    ];

    const playingRound = buildRoundWithHands([nsHand0, ewHand, nsHand2, ewHand3]);

    // Fields must exist and be arrays
    expect(Array.isArray(playingRound.nsAnnouncements)).toBe(true);
    expect(Array.isArray(playingRound.ewAnnouncements)).toBe(true);
  });

  // ── Test 2: tierce in NS (pos 0 only) → announcementWinner === "ns", announcementPoints === 20 ──

  it("2. NS tierce → announcementWinner = 'ns', announcementPoints = 20", () => {
    // Position 0 (NS) has a tierce in hearts
    const nsHand0: readonly Card[] = [
      c("hearts", "ace"),
      c("hearts", "king"),
      c("hearts", "queen"),
      c("spades", "7"),
      c("diamonds", "8"),
      c("clubs", "9"),
      c("spades", "10"),
      c("diamonds", "jack"),
    ];
    // Position 2 (NS partner) has no announcements
    const nsHand2: readonly Card[] = [
      c("spades", "ace"),
      c("clubs", "8"),
      c("diamonds", "7"),
      c("hearts", "7"),
      c("clubs", "7"),
      c("spades", "8"),
      c("diamonds", "9"),
      c("clubs", "10"),
    ];
    // EW players have no announcements
    const ewHand: readonly Card[] = [
      c("hearts", "8"),
      c("spades", "9"),
      c("clubs", "king"),
      c("diamonds", "king"),
      c("clubs", "queen"),
      c("spades", "queen"),
      c("hearts", "9"),
      c("spades", "king"),
    ];
    const ewHand3: readonly Card[] = [
      c("diamonds", "queen"),
      c("clubs", "ace"),
      c("diamonds", "ace"),
      c("hearts", "10"),
      c("spades", "10"),
      c("clubs", "jack"),
      c("diamonds", "jack"),
      c("hearts", "king"),
    ];

    const playingRound = buildRoundWithHands([nsHand0, ewHand, nsHand2, ewHand3]);

    expect(playingRound.announcementWinner).toBe("ns");
    expect(playingRound.announcementPoints).toBe(20);
  });

  // ── Test 3: carré of jacks in EW (all 4 jacks in pos 1) vs tierce in NS → EW wins, 200 pts ──

  it("3. EW carré of jacks vs NS tierce → announcementWinner = 'ew', announcementPoints = 200", () => {
    // NS player 0 has a tierce in hearts (20 pts)
    const nsHand0: readonly Card[] = [
      c("hearts", "ace"),
      c("hearts", "king"),
      c("hearts", "queen"),
      c("spades", "7"),
      c("diamonds", "8"),
      c("clubs", "9"),
      c("spades", "10"),
      c("diamonds", "9"),
    ];
    // NS player 2 has nothing special
    const nsHand2: readonly Card[] = [
      c("spades", "ace"),
      c("clubs", "8"),
      c("diamonds", "7"),
      c("hearts", "7"),
      c("clubs", "7"),
      c("spades", "8"),
      c("diamonds", "10"),
      c("clubs", "10"),
    ];
    // EW player 1 has all 4 jacks → carré of jacks (200 pts)
    // Note: carré detection requires all 4 in ONE hand
    const ewHand1: readonly Card[] = [
      c("hearts", "jack"),
      c("spades", "jack"),
      c("clubs", "jack"),
      c("diamonds", "jack"),
      c("clubs", "queen"),
      c("spades", "queen"),
      c("hearts", "8"),
      c("spades", "9"),
    ];
    // EW player 3 has no announcements
    const ewHand3: readonly Card[] = [
      c("diamonds", "queen"),
      c("clubs", "ace"),
      c("hearts", "9"),
      c("spades", "king"),
      c("hearts", "10"),
      c("diamonds", "7"),
      c("clubs", "king"),
      c("spades", "7"),
    ];

    const playingRound = buildRoundWithHands([nsHand0, ewHand1, nsHand2, ewHand3]);

    expect(playingRound.announcementWinner).toBe("ew");
    expect(playingRound.announcementPoints).toBe(200);
  });

  // ── Test 4: NS announcement winner, NS is contracting team → +20 to contracting ──

  it("4. calculateRoundScore: NS contracts + NS wins announcements → contracting gets +20", () => {
    // NS bidder at position 0
    const contract = makeContract(0, 80);
    // NS wins all 8 tricks → contract met, contractingTeamPoints = 152 + 10 = 162
    const tricks = makeAllTricksWonBy(0);

    // Without announcements
    const base = calculateRoundScore(tricks, contract);

    // With NS announcement winner (+20)
    const withAnn = calculateRoundScore(tricks, contract, "ns", 20);

    expect(withAnn.contractingTeamFinalScore).toBe(base.contractingTeamFinalScore + 20);
    expect(withAnn.opponentTeamFinalScore).toBe(base.opponentTeamFinalScore);
  });

  // ── Test 5: EW wins announcements (50 pts), NS is contracting → +50 to opponent ──

  it("5. calculateRoundScore: NS contracts + EW wins 50pts announcements → opponent gets +50", () => {
    const contract = makeContract(0, 80);
    const tricks = makeAllTricksWonBy(0);

    const base = calculateRoundScore(tricks, contract);
    const withAnn = calculateRoundScore(tricks, contract, "ew", 50);

    expect(withAnn.opponentTeamFinalScore).toBe(base.opponentTeamFinalScore + 50);
    expect(withAnn.contractingTeamFinalScore).toBe(base.contractingTeamFinalScore);
  });

  // ── Test 6: Contract fails but opponent (EW) wins announcements → EW still gets points ──

  it("6. Contract fails + EW wins announcements → EW still gets announcement points", () => {
    // NS bids 80 hearts but opponent wins all tricks → contract fails
    const contract = makeContract(0, 80);
    // EW (pos 1) wins all tricks
    const tricks = makeAllTricksWonBy(1);

    const base = calculateRoundScore(tricks, contract);
    // EW won the announcements too
    const withAnn = calculateRoundScore(tricks, contract, "ew", 50);

    // When contract fails: opponent (EW) gets coinchePayout
    // EW won announcements → opponent (EW) gets +50 on top
    expect(withAnn.opponentTeamFinalScore).toBe(base.opponentTeamFinalScore + 50);
    expect(withAnn.contractingTeamFinalScore).toBe(base.contractingTeamFinalScore);
  });

  // ── Test 7: No announcements → announcementWinner = null, final scores unchanged ──

  it("7. No announcements → announcementWinner = null, scores unchanged", () => {
    const contract = makeContract(0, 80);
    const tricks = makeAllTricksWonBy(0);

    const base = calculateRoundScore(tricks, contract);
    const withNull = calculateRoundScore(tricks, contract, null, 0);

    expect(withNull.announcementWinner).toBeNull();
    expect(withNull.contractingTeamFinalScore).toBe(base.contractingTeamFinalScore);
    expect(withNull.opponentTeamFinalScore).toBe(base.opponentTeamFinalScore);
  });

  // ── Test 7b: No announcement args → backward compat ──

  it("7b. calculateRoundScore without announcement args → backward compat, announcementWinner = null", () => {
    const contract = makeContract(0, 80);
    const tricks = makeAllTricksWonBy(0);

    const score = calculateRoundScore(tricks, contract);

    expect(score.announcementWinner).toBeNull();
    expect(score.announcementPoints).toBe(0);
  });
});
