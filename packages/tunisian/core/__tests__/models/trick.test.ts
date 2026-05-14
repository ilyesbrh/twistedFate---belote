import { describe, it, expect, beforeEach } from "vitest";
import {
  createTrick,
  playCard,
  isValidPlay,
  getValidPlays,
  getTrickWinner,
  removeCardFromHand,
} from "../../src/models/trick.js";
import type { Trick, PlayedCard, TrickState } from "../../src/models/trick.js";
import { createCard } from "../../src/models/card.js";
import type { Card, Suit } from "../../src/models/card.js";
import { createPlayer, setPlayerHand } from "../../src/models/player.js";
import type { Player, PlayerPosition } from "../../src/models/player.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";

// ==============================================================
// Helpers
// ==============================================================

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 42 });
});

function card(suit: Suit, rank: Card["rank"]): Card {
  return createCard(suit, rank, idGen);
}

function playerWithHand(position: PlayerPosition, cards: Card[]): Player {
  const p = createPlayer(`Player${String(position)}`, position, idGen);
  return setPlayerHand(p, cards);
}

// ==============================================================
// Trick Creation
// ==============================================================

describe("Trick Creation", () => {
  it("should assign an ID with trick_ prefix", () => {
    const trick = createTrick(0, "hearts", idGen);
    expect(trick.id).toMatch(/^trick_[a-z0-9]+$/);
  });

  it("should set the correct leading player position", () => {
    const trick = createTrick(2, "hearts", idGen);
    expect(trick.leadingPlayerPosition).toBe(2);
  });

  it("should store the trump suit", () => {
    const trick = createTrick(0, "spades", idGen);
    expect(trick.trumpSuit).toBe("spades");
  });

  it("should start with an empty cards array", () => {
    const trick = createTrick(0, "hearts", idGen);
    expect(trick.cards).toHaveLength(0);
  });

  it("should have state in_progress", () => {
    const trick = createTrick(0, "hearts", idGen);
    expect(trick.state).toBe("in_progress");
  });

  it("should have winnerPosition as null initially", () => {
    const trick = createTrick(0, "hearts", idGen);
    expect(trick.winnerPosition).toBeNull();
  });

  it("should return a frozen trick with frozen cards array", () => {
    const trick = createTrick(0, "hearts", idGen);
    expect(Object.isFrozen(trick)).toBe(true);
    expect(Object.isFrozen(trick.cards)).toBe(true);
  });
});

// ==============================================================
// PlayedCard Tracking
// ==============================================================

describe("PlayedCard Tracking", () => {
  it("should add a played card with the correct player position", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c = card("spades", "ace");
    const hand = [c, card("spades", "7")];
    const player = playerWithHand(0, hand);

    const updated = playCard(trick, c, 0, player.hand);
    expect(updated.cards).toHaveLength(1);
    expect(updated.cards[0]!.card.id).toBe(c.id);
    expect(updated.cards[0]!.playerPosition).toBe(0);
  });

  it("should track the leading suit from the first card played", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c = card("diamonds", "king");
    const hand = [c];
    const player = playerWithHand(0, hand);

    const updated = playCard(trick, c, 0, player.hand);
    expect(updated.cards[0]!.card.suit).toBe("diamonds");
  });

  it("should maintain order of played cards", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("spades", "ace");
    const c1 = card("spades", "king");

    const t1 = playCard(trick, c0, 0, [c0]);
    const t2 = playCard(t1, c1, 1, [c1]);

    expect(t2.cards[0]!.playerPosition).toBe(0);
    expect(t2.cards[1]!.playerPosition).toBe(1);
  });

  it("should return a new frozen trick without mutating the original", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c = card("spades", "ace");

    const updated = playCard(trick, c, 0, [c]);
    expect(trick.cards).toHaveLength(0);
    expect(updated.cards).toHaveLength(1);
    expect(Object.isFrozen(updated)).toBe(true);
    expect(Object.isFrozen(updated.cards)).toBe(true);
  });
});

// ==============================================================
// Must Follow Suit
// ==============================================================

describe("Must Follow Suit", () => {
  it("should allow playing a card of the led suit", () => {
    // Player 0 leads with spades ace. Player 1 has spades king → valid.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const follow = card("spades", "king");
    const hand = [follow, card("diamonds", "7")];
    expect(isValidPlay(t1, follow, 1, hand)).toBe(true);
  });

  it("should reject a non-led-suit card when player has cards of the led suit", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const wrongSuit = card("diamonds", "7");
    const hand = [card("spades", "king"), wrongSuit];
    expect(isValidPlay(t1, wrongSuit, 1, hand)).toBe(false);
  });

  it("should allow any led-suit card (not forced to play highest)", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const lowCard = card("spades", "7");
    const hand = [lowCard, card("spades", "king")];
    expect(isValidPlay(t1, lowCard, 1, hand)).toBe(true);
  });

  it("should allow non-led-suit card when player has no cards of the led suit", () => {
    // Trump is hearts. Led suit is spades. Player 1 has no spades and no hearts → can play anything.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const offSuit = card("diamonds", "7");
    const hand = [offSuit, card("clubs", "8")];
    expect(isValidPlay(t1, offSuit, 1, hand)).toBe(true);
  });

  it("should allow the leading player to play any card", () => {
    const trick = createTrick(0, "hearts", idGen);
    const anyCard = card("clubs", "9");
    const hand = [anyCard, card("spades", "ace"), card("hearts", "jack")];
    expect(isValidPlay(trick, anyCard, 0, hand)).toBe(true);
  });

  it("should validate against the player's actual hand", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c = card("spades", "ace");
    // Card is NOT in hand
    const hand = [card("diamonds", "7")];
    expect(isValidPlay(trick, c, 0, hand)).toBe(false);
  });

  it("should reject a card not in the player's hand", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const notInHand = card("spades", "king");
    const hand = [card("spades", "7")];
    expect(isValidPlay(t1, notInHand, 1, hand)).toBe(false);
  });

  it("should follow suit when led suit is trump (follow suit takes priority)", () => {
    // Trump is hearts. Player 0 leads hearts ace (led suit = trump suit).
    // Player 1 has hearts 7 and spades king → must follow suit (hearts).
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("hearts", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const heartsFollow = card("hearts", "7");
    const offSuit = card("spades", "king");
    const hand = [heartsFollow, offSuit];
    expect(isValidPlay(t1, heartsFollow, 1, hand)).toBe(true);
    expect(isValidPlay(t1, offSuit, 1, hand)).toBe(false);
  });
});

// ==============================================================
// Must Trump When Unable to Follow Suit
// ==============================================================

describe("Must Trump", () => {
  it("should require playing a trump card when unable to follow suit and has trump", () => {
    // Trump is hearts. Led suit is spades. Player 1 has no spades but has hearts.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const trump = card("hearts", "7");
    const hand = [trump, card("diamonds", "king")];
    expect(isValidPlay(t1, trump, 1, hand)).toBe(true);
  });

  it("should reject a non-trump non-led-suit card when player has trump cards", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const offSuit = card("diamonds", "king");
    const hand = [card("hearts", "7"), offSuit];
    expect(isValidPlay(t1, offSuit, 1, hand)).toBe(false);
  });

  it("should allow any trump card when must trump and no trump on table yet", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    // Player has two trump cards, can play any of them (no overtrump needed — no trump on table)
    const lowTrump = card("hearts", "7");
    const highTrump = card("hearts", "jack");
    const hand = [lowTrump, highTrump];
    expect(isValidPlay(t1, lowTrump, 1, hand)).toBe(true);
    expect(isValidPlay(t1, highTrump, 1, hand)).toBe(true);
  });

  it("should allow any card when unable to follow suit AND has no trump", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const offSuit = card("diamonds", "7");
    const hand = [offSuit, card("clubs", "8")];
    expect(isValidPlay(t1, offSuit, 1, hand)).toBe(true);
  });

  it("should not require trumping when player can follow suit", () => {
    // Follow suit takes priority over must-trump.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const followCard = card("spades", "7");
    const trumpCard = card("hearts", "jack");
    const hand = [followCard, trumpCard];
    // Must follow suit — trump is NOT valid here
    expect(isValidPlay(t1, followCard, 1, hand)).toBe(true);
    expect(isValidPlay(t1, trumpCard, 1, hand)).toBe(false);
  });

  it("should correctly identify trump cards based on the trick's trumpSuit", () => {
    // Trump is diamonds (not hearts).
    const trick = createTrick(0, "diamonds", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const diamondCard = card("diamonds", "7");
    const heartCard = card("hearts", "jack");
    const hand = [diamondCard, heartCard];
    // diamonds is trump → must play diamond
    expect(isValidPlay(t1, diamondCard, 1, hand)).toBe(true);
    expect(isValidPlay(t1, heartCard, 1, hand)).toBe(false);
  });
});

// ==============================================================
// Must Overtrump
// ==============================================================

describe("Must Overtrump", () => {
  it("should require a higher trump when trump has already been played", () => {
    // Trump is hearts. Led suit is clubs. Player 1 plays hearts 9 (trump).
    // Player 2 has no clubs, has hearts jack (higher) and hearts 8 (lower).
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trump9 = card("hearts", "9");
    const t2 = playCard(t1, trump9, 1, [trump9]);

    const trumpJack = card("hearts", "jack");
    const trump8 = card("hearts", "8");
    const hand = [trumpJack, trump8];
    // Must overtrump with jack (higher than 9)
    expect(isValidPlay(t2, trumpJack, 2, hand)).toBe(true);
    expect(isValidPlay(t2, trump8, 2, hand)).toBe(false);
  });

  it("should reject a lower trump when player has a higher trump available", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trumpAce = card("hearts", "ace");
    const t2 = playCard(t1, trumpAce, 1, [trumpAce]);

    // Player 2 has hearts 9 (rank 6, higher than ace rank 5) and hearts 7 (rank 0, lower)
    const trump9 = card("hearts", "9");
    const trump7 = card("hearts", "7");
    const hand = [trump9, trump7];
    expect(isValidPlay(t2, trump7, 2, hand)).toBe(false);
    expect(isValidPlay(t2, trump9, 2, hand)).toBe(true);
  });

  it("should allow a lower trump when player has no higher trump available", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    // Trump jack is the highest (rank 7). Player 2 has only hearts 7 (rank 0).
    const trumpJack = card("hearts", "jack");
    const t2 = playCard(t1, trumpJack, 1, [trumpJack]);

    const trump7 = card("hearts", "7");
    const hand = [trump7];
    // Cannot overtrump → any trump is acceptable
    expect(isValidPlay(t2, trump7, 2, hand)).toBe(true);
  });

  it("should require overtrumping even when partner is currently winning (PO decision)", () => {
    // Trump is hearts. Led suit is clubs.
    // Player 0 leads clubs 7.
    // Player 1 can't follow suit, plays hearts ace (trump, rank 5). Currently winning.
    // Player 2 can't follow suit. Has hearts 8 only → can't overtrump ace → lower trump OK.
    // Player 3 is PARTNER of player 1 (positions 1 & 3). Player 1 is currently winning.
    // Player 3 can't follow clubs. Has hearts jack (rank 7 > ace rank 5).
    // PO decision: MUST overtrump even though partner is winning.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "7");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trumpAce = card("hearts", "ace");
    const t2 = playCard(t1, trumpAce, 1, [trumpAce]);
    const trump8 = card("hearts", "8");
    const t3 = playCard(t2, trump8, 2, [trump8]);

    // Player 3 (partner of player 1 who is winning) has hearts jack and hearts 7
    const trumpJack = card("hearts", "jack");
    const trump7 = card("hearts", "7");
    const hand = [trumpJack, trump7];
    // Must overtrump ace: jack is valid, 7 is not (7 < ace)
    expect(isValidPlay(t3, trumpJack, 3, hand)).toBe(true);
    expect(isValidPlay(t3, trump7, 3, hand)).toBe(false);
  });

  it("should allow any card when unable to follow suit AND has no trump", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trumpJack = card("hearts", "jack");
    const t2 = playCard(t1, trumpJack, 1, [trumpJack]);

    // Player 2 has no clubs and no hearts (trump) → can play anything
    const offSuit = card("diamonds", "7");
    const hand = [offSuit, card("spades", "8")];
    expect(isValidPlay(t2, offSuit, 2, hand)).toBe(true);
  });

  it("should correctly compare trump rank using getCardRankOrder", () => {
    // Trump order: 7(0) < 8(1) < queen(2) < king(3) < 10(4) < ace(5) < 9(6) < jack(7)
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    // Hearts 10 on table (rank 4 in trump order)
    const trump10 = card("hearts", "10");
    const t2 = playCard(t1, trump10, 1, [trump10]);

    // Player 2: has hearts king (rank 3 < 4) and hearts ace (rank 5 > 4)
    const trumpKing = card("hearts", "king");
    const trumpAce = card("hearts", "ace");
    const hand = [trumpKing, trumpAce];
    // Must overtrump: ace OK (5>4), king rejected (3<4)
    expect(isValidPlay(t2, trumpAce, 2, hand)).toBe(true);
    expect(isValidPlay(t2, trumpKing, 2, hand)).toBe(false);
  });

  it("should handle overtrumping when multiple trumps have been played", () => {
    // Trump is hearts. Led suit is clubs.
    // Player 0 leads clubs 7.
    // Player 1 plays hearts 8 (trump, rank 1).
    // Player 2 plays hearts ace (trump, rank 5). Now highest trump is ace.
    // Player 3 must overtrump the ace if able.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "7");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trump8 = card("hearts", "8");
    const t2 = playCard(t1, trump8, 1, [trump8]);
    const trumpAce = card("hearts", "ace");
    const t3 = playCard(t2, trumpAce, 2, [trumpAce]);

    // Player 3 has hearts 9 (rank 6 > ace rank 5) → must play it
    const trump9 = card("hearts", "9");
    const trumpQueen = card("hearts", "queen");
    const hand = [trump9, trumpQueen];
    expect(isValidPlay(t3, trump9, 3, hand)).toBe(true);
    expect(isValidPlay(t3, trumpQueen, 3, hand)).toBe(false);
  });

  it("should not require overtrumping when following led suit", () => {
    // If a player CAN follow suit, they must follow suit — overtrumping does not apply.
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    // Player 1 plays hearts 9 (trump)
    const trumpCard = card("hearts", "9");
    const t2 = playCard(t1, trumpCard, 1, [trumpCard]);

    // Player 2 has spades 7 (can follow suit) — must follow, not overtrump
    const spades7 = card("spades", "7");
    const heartsJack = card("hearts", "jack");
    const hand = [spades7, heartsJack];
    expect(isValidPlay(t2, spades7, 2, hand)).toBe(true);
    expect(isValidPlay(t2, heartsJack, 2, hand)).toBe(false);
  });
});

// ==============================================================
// Trick Winner Determination
// ==============================================================

describe("Trick Winner Determination", () => {
  it("should determine winner as highest card of led suit when no trump played", () => {
    // Trump is hearts. All spades played (no trump).
    // Non-trump order: 7(0) < 8(1) < 9(2) < jack(3) < queen(4) < king(5) < 10(6) < ace(7)
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("spades", "10");
    const c1 = card("spades", "ace");
    const c2 = card("spades", "king");
    const c3 = card("spades", "7");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(t.state).toBe("completed");
    expect(getTrickWinner(t)).toBe(1); // ace (rank 7) is highest
  });

  it("should determine winner as highest trump when trump is played", () => {
    // Trump is hearts. Led suit is clubs.
    // Trump order: 7(0) < 8(1) < queen(2) < king(3) < 10(4) < ace(5) < 9(6) < jack(7)
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("clubs", "ace");
    const c1 = card("hearts", "8");
    const c2 = card("hearts", "9");
    const c3 = card("clubs", "king");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(getTrickWinner(t)).toBe(2); // hearts 9 (rank 6) beats hearts 8 (rank 1)
  });

  it("should ignore non-led-suit non-trump cards for winning", () => {
    // Led suit is spades, trump is hearts.
    // Player 2 plays diamonds ace — it doesn't count since it's neither led suit nor trump.
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("spades", "7");
    const c1 = card("spades", "8");
    const c2 = card("diamonds", "ace");
    const c3 = card("spades", "9");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(getTrickWinner(t)).toBe(3); // spades 9 (rank 2 in non-trump) is highest spade
  });

  it("should use trump ranking for trump comparison (jack highest)", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("clubs", "7");
    const c1 = card("hearts", "ace");
    const c2 = card("hearts", "jack");
    const c3 = card("hearts", "9");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(getTrickWinner(t)).toBe(2); // jack (rank 7) > 9 (rank 6) > ace (rank 5)
  });

  it("should use non-trump ranking for non-trump comparison (ace highest)", () => {
    // All playing spades (non-trump). Trump is hearts.
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("spades", "jack");
    const c1 = card("spades", "ace");
    const c2 = card("spades", "10");
    const c3 = card("spades", "king");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(getTrickWinner(t)).toBe(1); // ace (rank 7) is highest non-trump
  });

  it("should throw if trick is not completed", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("spades", "ace");
    const t1 = playCard(trick, c0, 0, [c0]);

    expect(() => getTrickWinner(t1)).toThrow(/not completed|in_progress/i);
  });

  it("should handle case where only one trump is played", () => {
    // Even a low trump beats all non-trump cards.
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("spades", "ace");
    const c1 = card("hearts", "7");
    const c2 = card("spades", "king");
    const c3 = card("spades", "10");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(getTrickWinner(t)).toBe(1); // hearts 7 (only trump) beats all spades
  });

  it("should handle case where multiple trumps are played", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("clubs", "7");
    const c1 = card("hearts", "queen");
    const c2 = card("hearts", "king");
    const c3 = card("hearts", "10");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    // Trump order: queen(2) < king(3) < 10(4)
    expect(getTrickWinner(t)).toBe(3); // hearts 10 (rank 4) is highest
  });
});

// ==============================================================
// Hand Management
// ==============================================================

describe("Hand Management (removeCardFromHand)", () => {
  it("should remove the played card from the player's hand", () => {
    const c1 = card("spades", "ace");
    const c2 = card("hearts", "king");
    const c3 = card("diamonds", "7");
    const player = playerWithHand(0, [c1, c2, c3]);

    const updated = removeCardFromHand(player, c2);
    expect(updated.hand).toHaveLength(2);
    expect(updated.hand.some((c) => c.id === c2.id)).toBe(false);
    expect(updated.hand.some((c) => c.id === c1.id)).toBe(true);
    expect(updated.hand.some((c) => c.id === c3.id)).toBe(true);
  });

  it("should return a new player without mutating the original", () => {
    const c1 = card("spades", "ace");
    const c2 = card("hearts", "king");
    const player = playerWithHand(0, [c1, c2]);

    const updated = removeCardFromHand(player, c1);
    expect(player.hand).toHaveLength(2);
    expect(updated.hand).toHaveLength(1);
  });

  it("should preserve player id, name, and position", () => {
    const c1 = card("spades", "ace");
    const player = playerWithHand(2, [c1]);

    const updated = removeCardFromHand(player, c1);
    expect(updated.id).toBe(player.id);
    expect(updated.name).toBe(player.name);
    expect(updated.position).toBe(player.position);
  });

  it("should throw if the card is not in the player's hand", () => {
    const c1 = card("spades", "ace");
    const notInHand = card("hearts", "jack");
    const player = playerWithHand(0, [c1]);

    expect(() => removeCardFromHand(player, notInHand)).toThrow(/not found/i);
  });

  it("should return a frozen player", () => {
    const c1 = card("spades", "ace");
    const player = playerWithHand(0, [c1]);

    const updated = removeCardFromHand(player, c1);
    expect(Object.isFrozen(updated)).toBe(true);
    expect(Object.isFrozen(updated.hand)).toBe(true);
  });
});

// ==============================================================
// Integration
// ==============================================================

describe("Integration", () => {
  it("should play a complete 4-card trick with no trump (led suit wins)", () => {
    // Trump is hearts, all play spades → no trump involved
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("spades", "king");
    const c1 = card("spades", "ace");
    const c2 = card("spades", "7");
    const c3 = card("spades", "10");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(t.state).toBe("completed");
    expect(t.winnerPosition).toBe(1); // ace highest non-trump
    expect(t.cards).toHaveLength(4);
  });

  it("should play a complete trick where trump beats led suit", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("spades", "ace");
    const c1 = card("hearts", "7");
    const c2 = card("spades", "king");
    const c3 = card("spades", "10");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(t.state).toBe("completed");
    expect(t.winnerPosition).toBe(1); // only trump wins
  });

  it("should auto-complete trick state to completed after 4 cards", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("clubs", "7");
    const c1 = card("clubs", "8");
    const c2 = card("clubs", "9");
    const c3 = card("clubs", "10");
    let t = playCard(trick, c0, 0, [c0]);
    expect(t.state).toBe("in_progress");
    t = playCard(t, c1, 1, [c1]);
    expect(t.state).toBe("in_progress");
    t = playCard(t, c2, 2, [c2]);
    expect(t.state).toBe("in_progress");
    t = playCard(t, c3, 3, [c3]);
    expect(t.state).toBe("completed");
  });

  it("should reject playing a 5th card on a completed trick", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("clubs", "7");
    const c1 = card("clubs", "8");
    const c2 = card("clubs", "9");
    const c3 = card("clubs", "10");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    const extraCard = card("clubs", "ace");
    expect(isValidPlay(t, extraCard, 0, [extraCard])).toBe(false);
  });

  it("should enforce turn order", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c = card("spades", "ace");
    // Player 1 tries to play first (should be player 0)
    expect(isValidPlay(trick, c, 1, [c])).toBe(false);
    // Player 0 plays correctly
    const t1 = playCard(trick, c, 0, [c]);
    // Player 2 tries to play (should be player 1)
    const c2 = card("spades", "king");
    expect(isValidPlay(t1, c2, 2, [c2])).toBe(false);
  });

  it("should handle a full trick with overtrumping scenario", () => {
    // Trump is hearts. Led suit is clubs.
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("clubs", "7");
    const c1 = card("hearts", "8");
    const c2 = card("hearts", "ace");
    const c3 = card("hearts", "9");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(t.state).toBe("completed");
    expect(t.winnerPosition).toBe(3); // hearts 9 (rank 6) > hearts ace (rank 5)
  });

  it("should correctly track winner position in completed trick", () => {
    const trick = createTrick(2, "hearts", idGen);
    const c0 = card("diamonds", "7");
    const c1 = card("diamonds", "ace");
    const c2 = card("diamonds", "king");
    const c3 = card("diamonds", "8");
    let t = playCard(trick, c0, 2, [c0]);
    t = playCard(t, c1, 3, [c1]);
    t = playCard(t, c2, 0, [c2]);
    t = playCard(t, c3, 1, [c3]);

    expect(t.winnerPosition).toBe(3); // ace highest non-trump
    expect(getTrickWinner(t)).toBe(3);
  });
});

// ==============================================================
// getValidPlays
// ==============================================================

describe("getValidPlays", () => {
  it("should return all cards when player is leading (any card valid)", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c1 = card("spades", "ace");
    const c2 = card("hearts", "jack");
    const c3 = card("diamonds", "7");
    const hand = [c1, c2, c3];

    const validPlays = getValidPlays(trick, 0, hand);
    expect(validPlays).toHaveLength(3);
    expect(validPlays).toContain(c1);
    expect(validPlays).toContain(c2);
    expect(validPlays).toContain(c3);
  });

  it("should return only led-suit cards when player has that suit", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const s1 = card("spades", "king");
    const s2 = card("spades", "7");
    const d1 = card("diamonds", "10");
    const hand = [s1, s2, d1];

    const validPlays = getValidPlays(t1, 1, hand);
    expect(validPlays).toHaveLength(2);
    expect(validPlays).toContain(s1);
    expect(validPlays).toContain(s2);
  });

  it("should return only trump cards when player has no led suit but has trump", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const h1 = card("hearts", "7");
    const h2 = card("hearts", "jack");
    const d1 = card("diamonds", "10");
    const hand = [h1, h2, d1];

    const validPlays = getValidPlays(t1, 1, hand);
    expect(validPlays).toHaveLength(2);
    expect(validPlays).toContain(h1);
    expect(validPlays).toContain(h2);
  });

  it("should return all cards when player has neither led suit nor trump", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("spades", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);

    const d1 = card("diamonds", "7");
    const c1 = card("clubs", "king");
    const hand = [d1, c1];

    const validPlays = getValidPlays(t1, 1, hand);
    expect(validPlays).toHaveLength(2);
    expect(validPlays).toContain(d1);
    expect(validPlays).toContain(c1);
  });

  it("should return only higher trumps when must overtrump and can", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trump10 = card("hearts", "10"); // rank 4
    const t2 = playCard(t1, trump10, 1, [trump10]);

    // Player 2: hearts 9 (rank 6, higher), hearts 8 (rank 1, lower)
    const h9 = card("hearts", "9");
    const h8 = card("hearts", "8");
    const hand = [h9, h8];

    const validPlays = getValidPlays(t2, 2, hand);
    expect(validPlays).toHaveLength(1);
    expect(validPlays).toContain(h9);
  });

  it("should return all trumps when must trump but cannot overtrump", () => {
    const trick = createTrick(0, "hearts", idGen);
    const lead = card("clubs", "ace");
    const t1 = playCard(trick, lead, 0, [lead]);
    const trumpJack = card("hearts", "jack"); // rank 7 (highest)
    const t2 = playCard(t1, trumpJack, 1, [trumpJack]);

    // Player 2: hearts 7 (rank 0) and hearts 8 (rank 1) — both lower than jack
    const h7 = card("hearts", "7");
    const h8 = card("hearts", "8");
    const hand = [h7, h8];

    const validPlays = getValidPlays(t2, 2, hand);
    expect(validPlays).toHaveLength(2);
    expect(validPlays).toContain(h7);
    expect(validPlays).toContain(h8);
  });

  it("should return empty array for completed trick", () => {
    const trick = createTrick(0, "hearts", idGen);
    const c0 = card("clubs", "7");
    const c1 = card("clubs", "8");
    const c2 = card("clubs", "9");
    const c3 = card("clubs", "10");
    let t = playCard(trick, c0, 0, [c0]);
    t = playCard(t, c1, 1, [c1]);
    t = playCard(t, c2, 2, [c2]);
    t = playCard(t, c3, 3, [c3]);

    expect(t.state).toBe("completed");
    const validPlays = getValidPlays(t, 0, [card("clubs", "ace")]);
    expect(validPlays).toHaveLength(0);
  });
});
