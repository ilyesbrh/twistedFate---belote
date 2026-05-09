/**
 * Iteration 053 — SA/TA trick-winning order tests.
 * Written RED before implementation.
 *
 * SA (sans-atout): no trump suit; must follow led suit; any card if can't follow.
 * TA (tout-atout): all suits rank like trump; must follow led suit; must overtrump if can't follow.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createTrick, isValidPlay, playCard } from "../../src/models/trick.js";
import { createCard } from "../../src/models/card.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";
import type { Card, Suit, Rank } from "../../src/models/card.js";
import type { PlayerPosition } from "../../src/models/player.js";

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 1 });
});

function c(suit: Suit, rank: Rank): Card {
  return createCard(suit, rank, idGen);
}

// ── Sans-Atout ───────────────────────────────────────────────────────────────

describe("SA (sans-atout) — isValidPlay", () => {
  it("leading player can play any card including jack", () => {
    const trick = createTrick(0 as PlayerPosition, "hearts", "sans-atout", idGen);
    const jack = c("hearts", "jack");
    expect(isValidPlay(trick, jack, 0 as PlayerPosition, [jack])).toBe(true);
  });

  it("must follow led suit when player has it", () => {
    const trick = createTrick(0 as PlayerPosition, "hearts", "sans-atout", idGen);
    const led = c("hearts", "7");
    const t1 = playCard(trick, led, 0 as PlayerPosition, [led]);

    const heart = c("hearts", "ace");
    const spade = c("spades", "ace");
    const hand = [heart, spade];

    expect(isValidPlay(t1, heart, 1 as PlayerPosition, hand)).toBe(true);
    expect(isValidPlay(t1, spade, 1 as PlayerPosition, hand)).toBe(false);
  });

  it("can play any card when cannot follow led suit — no trump obligation", () => {
    const trick = createTrick(0 as PlayerPosition, "hearts", "sans-atout", idGen);
    const led = c("hearts", "7");
    const t1 = playCard(trick, led, 0 as PlayerPosition, [led]);

    const spadeJack = c("spades", "jack");
    const diamondAce = c("diamonds", "ace");
    const hand = [spadeJack, diamondAce];

    // No hearts in hand → can play anything (no trump overtrump required)
    expect(isValidPlay(t1, spadeJack, 1 as PlayerPosition, hand)).toBe(true);
    expect(isValidPlay(t1, diamondAce, 1 as PlayerPosition, hand)).toBe(true);
  });
});

describe("SA (sans-atout) — trick winner", () => {
  it("ace of led suit beats jack even though jack ranks higher in trump order", () => {
    // In SA, NON_TRUMP_ORDER applies: A > 10 > K > Q > J > 9 > 8 > 7
    // So ace beats jack of same suit
    const trick = createTrick(0 as PlayerPosition, "hearts", "sans-atout", idGen);
    const jackH = c("hearts", "jack");
    const aceH = c("hearts", "ace");
    const seven1 = c("spades", "7");
    const seven2 = c("diamonds", "7");

    const t1 = playCard(trick, jackH, 0 as PlayerPosition, [jackH]);
    const t2 = playCard(t1, aceH, 1 as PlayerPosition, [aceH]);
    const t3 = playCard(t2, seven1, 2 as PlayerPosition, [seven1]);
    const t4 = playCard(t3, seven2, 3 as PlayerPosition, [seven2]);

    // Ace (rank index 7 in NON_TRUMP_ORDER) beats Jack (rank index 4)
    expect(t4.winnerPosition).toBe(1);
  });

  it("card from different suit cannot win — even ace of spades cannot beat 7 of hearts (led suit)", () => {
    const trick = createTrick(0 as PlayerPosition, "hearts", "sans-atout", idGen);
    const sevenH = c("hearts", "7");
    const aceS = c("spades", "ace");
    const aceD = c("diamonds", "ace");
    const aceC = c("clubs", "ace");

    const t1 = playCard(trick, sevenH, 0 as PlayerPosition, [sevenH]);
    const t2 = playCard(t1, aceS, 1 as PlayerPosition, [aceS]);
    const t3 = playCard(t2, aceD, 2 as PlayerPosition, [aceD]);
    const t4 = playCard(t3, aceC, 3 as PlayerPosition, [aceC]);

    // 7 of hearts wins because it's the only led-suit card and there's no trump
    expect(t4.winnerPosition).toBe(0);
  });
});

// ── Tout-Atout ───────────────────────────────────────────────────────────────

describe("TA (tout-atout) — isValidPlay", () => {
  it("must follow led suit when player has it", () => {
    const trick = createTrick(0 as PlayerPosition, "hearts", "tout-atout", idGen);
    const led = c("hearts", "7");
    const t1 = playCard(trick, led, 0 as PlayerPosition, [led]);

    const heartCard = c("hearts", "ace");
    const spadeCard = c("spades", "ace");
    const hand = [heartCard, spadeCard];

    expect(isValidPlay(t1, heartCard, 1 as PlayerPosition, hand)).toBe(true);
    expect(isValidPlay(t1, spadeCard, 1 as PlayerPosition, hand)).toBe(false);
  });

  it("must overtrump when cannot follow led suit and can beat table", () => {
    const trick = createTrick(0 as PlayerPosition, "hearts", "tout-atout", idGen);
    // Led: 7 of hearts (rank 0 in TRUMP_ORDER)
    const led = c("hearts", "7");
    const t1 = playCard(trick, led, 0 as PlayerPosition, [led]);

    // Player has no hearts, but has spade-jack (rank 7, highest) and spade-7 (rank 0)
    const spadeJack = c("spades", "jack");
    const spade7 = c("spades", "7");
    const hand = [spadeJack, spade7];

    // Can overtrump (jack beats 7) → must play jack
    expect(isValidPlay(t1, spadeJack, 1 as PlayerPosition, hand)).toBe(true);
    // spade-7 has same rank as led 7 → cannot overtrump with it when jack is available
    expect(isValidPlay(t1, spade7, 1 as PlayerPosition, hand)).toBe(false);
  });

  it("any card valid when cannot follow and cannot overtrump", () => {
    const trick = createTrick(0 as PlayerPosition, "hearts", "tout-atout", idGen);
    // Led: jack of hearts (rank 7 = highest in TRUMP_ORDER)
    const led = c("hearts", "jack");
    const t1 = playCard(trick, led, 0 as PlayerPosition, [led]);

    // Player has no hearts, only low-rank non-hearts cards — cannot beat jack
    const spade7 = c("spades", "7");
    const diamond8 = c("diamonds", "8");
    const hand = [spade7, diamond8];

    // Cannot overtrump jack → any card valid
    expect(isValidPlay(t1, spade7, 1 as PlayerPosition, hand)).toBe(true);
    expect(isValidPlay(t1, diamond8, 1 as PlayerPosition, hand)).toBe(true);
  });
});

describe("TA (tout-atout) — trick winner", () => {
  it("jack of any suit beats ace of led suit", () => {
    // In TA: TRUMP_ORDER → jack is highest (rank 7), ace is rank 5
    const trick = createTrick(0 as PlayerPosition, "hearts", "tout-atout", idGen);
    const aceH = c("hearts", "ace"); // led suit, rank 5
    const jackS = c("spades", "jack"); // non-led, but rank 7
    const seven1 = c("diamonds", "7");
    const seven2 = c("clubs", "7");

    const t1 = playCard(trick, aceH, 0 as PlayerPosition, [aceH]);
    const t2 = playCard(t1, jackS, 1 as PlayerPosition, [jackS]);
    const t3 = playCard(t2, seven1, 2 as PlayerPosition, [seven1]);
    const t4 = playCard(t3, seven2, 3 as PlayerPosition, [seven2]);

    expect(t4.winnerPosition).toBe(1); // jack of spades wins
  });

  it("nine beats ace and 10 from any suit", () => {
    // TRUMP_ORDER: J(7) > 9(6) > A(5) > 10(4) > K(3) > Q(2) > 8(1) > 7(0)
    const trick = createTrick(0 as PlayerPosition, "hearts", "tout-atout", idGen);
    const aceH = c("hearts", "ace"); // rank 5
    const tenS = c("spades", "10"); // rank 4
    const nineD = c("diamonds", "9"); // rank 6 — beats both
    const sevenC = c("clubs", "7");

    const t1 = playCard(trick, aceH, 0 as PlayerPosition, [aceH]);
    const t2 = playCard(t1, tenS, 1 as PlayerPosition, [tenS]);
    const t3 = playCard(t2, nineD, 2 as PlayerPosition, [nineD]);
    const t4 = playCard(t3, sevenC, 3 as PlayerPosition, [sevenC]);

    expect(t4.winnerPosition).toBe(2); // 9 of diamonds wins
  });

  it("tie broken by led-suit card (two cards same TA rank, different suits)", () => {
    // Two 7s (both rank 0 in TRUMP_ORDER) — led-suit 7 should win
    const trick = createTrick(0 as PlayerPosition, "hearts", "tout-atout", idGen);
    const sevenH = c("hearts", "7"); // led suit, rank 0
    const sevenS = c("spades", "7"); // non-led, rank 0
    const eight1 = c("diamonds", "8"); // rank 1
    const eight2 = c("clubs", "8"); // rank 1

    // Actually let me make a cleaner tie: two 7s and fill remaining with lower cards...
    // Wait, 8 has rank 1 > 7 rank 0. Use all 7s:
    const sevenD = c("diamonds", "7");
    const sevenC = c("clubs", "7");

    const t1 = playCard(trick, sevenH, 0 as PlayerPosition, [sevenH]);
    const t2 = playCard(t1, sevenS, 1 as PlayerPosition, [sevenS]);
    const t3 = playCard(t2, sevenD, 2 as PlayerPosition, [sevenD]);
    const t4 = playCard(t3, sevenC, 3 as PlayerPosition, [sevenC]);

    // All rank 0 — led-suit (hearts) card wins → position 0
    expect(t4.winnerPosition).toBe(0);
  });
});
