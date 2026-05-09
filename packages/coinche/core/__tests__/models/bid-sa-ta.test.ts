/**
 * Iteration 049 — Sans-Atout and Tout-Atout bid type tests.
 *
 * Pins the bidding model for SA/TA:
 *   - createSansAtoutBid / createToutAtoutBid factories
 *   - isValidBid: SA/TA follow same value-escalation rules as suit bids
 *   - placeBid: SA/TA advance highestBid like suit bids
 *   - getValidBids: includes SA/TA at each valid value
 *   - getContract: derives contractType from winning bid type
 *
 * Written RED before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createSansAtoutBid,
  createToutAtoutBid,
  createSuitBid,
  createPassBid,
  createCoincheBid,
  createBiddingRound,
  placeBid,
  isValidBid,
  getValidBids,
  getContract,
} from "../../src/models/bid.js";
import { createCard } from "../../src/models/card.js";
import { calculateRoundScore } from "../../src/models/scoring.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";
import type { PlayerPosition } from "../../src/models/player.js";
import type { Trick, PlayedCard } from "../../src/models/trick.js";
import type { Suit, Rank } from "../../src/models/card.js";

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 1 });
});

// ── Factories ─────────────────────────────────────────────────────────────────

describe("createSansAtoutBid", () => {
  it("has type sans-atout, the given value, and null suit", () => {
    const bid = createSansAtoutBid(0, 90, idGen);
    expect(bid.type).toBe("sans-atout");
    expect(bid.value).toBe(90);
    expect(bid.suit).toBeNull();
    expect(bid.playerPosition).toBe(0);
  });
});

describe("createToutAtoutBid", () => {
  it("has type tout-atout, the given value, and null suit", () => {
    const bid = createToutAtoutBid(1, 100, idGen);
    expect(bid.type).toBe("tout-atout");
    expect(bid.value).toBe(100);
    expect(bid.suit).toBeNull();
    expect(bid.playerPosition).toBe(1);
  });
});

// ── isValidBid ────────────────────────────────────────────────────────────────

describe("isValidBid — SA/TA bids", () => {
  it("SA bid is valid as opening bid (no previous bids)", () => {
    const round = createBiddingRound(0, idGen);
    const saBid = createSansAtoutBid(1, 90, idGen);
    expect(isValidBid(round, saBid)).toBe(true);
  });

  it("SA bid is valid when value is strictly greater than current highest", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSuitBid(1, 90, "hearts", idGen));
    const saBid = createSansAtoutBid(2, 100, idGen);
    expect(isValidBid(round, saBid)).toBe(true);
  });

  it("SA bid is invalid when value is equal to current highest", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSuitBid(1, 90, "hearts", idGen));
    const saBid = createSansAtoutBid(2, 90, idGen);
    expect(isValidBid(round, saBid)).toBe(false);
  });

  it("SA bid is invalid when value is lower than current highest", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSuitBid(1, 100, "hearts", idGen));
    const saBid = createSansAtoutBid(2, 90, idGen);
    expect(isValidBid(round, saBid)).toBe(false);
  });

  it("TA bid is valid when value is strictly greater than SA bid", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSansAtoutBid(1, 90, idGen));
    const taBid = createToutAtoutBid(2, 100, idGen);
    expect(isValidBid(round, taBid)).toBe(true);
  });
});

// ── placeBid ─────────────────────────────────────────────────────────────────

describe("placeBid — SA/TA bids", () => {
  it("SA bid becomes the new highestBid", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSansAtoutBid(1, 90, idGen));
    expect(round.highestBid?.type).toBe("sans-atout");
    expect(round.highestBid?.value).toBe(90);
  });

  it("TA bid over SA bid replaces highestBid", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSansAtoutBid(1, 90, idGen));
    round = placeBid(round, createToutAtoutBid(2, 100, idGen));
    expect(round.highestBid?.type).toBe("tout-atout");
    expect(round.highestBid?.value).toBe(100);
  });

  it("SA/TA bid resets consecutivePasses to 0", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createPassBid(1, idGen));
    round = placeBid(round, createSansAtoutBid(2, 90, idGen));
    expect(round.consecutivePasses).toBe(0);
  });
});

// ── getValidBids ──────────────────────────────────────────────────────────────

describe("getValidBids includes SA and TA options", () => {
  it("includes SA bids when bidding is open", () => {
    const round = createBiddingRound(0, idGen);
    const bids = getValidBids(round, 1, idGen);
    const saBids = bids.filter((b) => b.type === "sans-atout");
    expect(saBids.length).toBeGreaterThan(0);
  });

  it("includes TA bids when bidding is open", () => {
    const round = createBiddingRound(0, idGen);
    const bids = getValidBids(round, 1, idGen);
    const taBids = bids.filter((b) => b.type === "tout-atout");
    expect(taBids.length).toBeGreaterThan(0);
  });

  it("SA bids only appear at values above current highest", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSuitBid(1, 100, "hearts", idGen));
    const bids = getValidBids(round, 2, idGen);
    const saBids = bids.filter((b) => b.type === "sans-atout");
    expect(saBids.every((b) => (b.value ?? 0) > 100)).toBe(true);
  });
});

// ── getContract ───────────────────────────────────────────────────────────────

describe("getContract derives contractType from bid type", () => {
  it("SA winning bid yields contractType sans-atout", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSansAtoutBid(1, 90, idGen));
    round = placeBid(round, createPassBid(2, idGen));
    round = placeBid(round, createPassBid(3, idGen));
    round = placeBid(round, createPassBid(0, idGen));

    const contract = getContract(round, createIdGenerator({ seed: 200 }));
    expect(contract.contractType).toBe("sans-atout");
    expect(contract.value).toBe(90);
    expect(contract.coincheLevel).toBe(1);
  });

  it("TA winning bid yields contractType tout-atout", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createToutAtoutBid(1, 90, idGen));
    round = placeBid(round, createPassBid(2, idGen));
    round = placeBid(round, createPassBid(3, idGen));
    round = placeBid(round, createPassBid(0, idGen));

    const contract = getContract(round, createIdGenerator({ seed: 200 }));
    expect(contract.contractType).toBe("tout-atout");
  });

  it("regular suit bid still yields contractType suit", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSuitBid(1, 90, "hearts", idGen));
    round = placeBid(round, createPassBid(2, idGen));
    round = placeBid(round, createPassBid(3, idGen));
    round = placeBid(round, createPassBid(0, idGen));

    const contract = getContract(round, createIdGenerator({ seed: 200 }));
    expect(contract.contractType).toBe("suit");
    expect(contract.suit).toBe("hearts");
  });
});

// ── coinche on SA ─────────────────────────────────────────────────────────────

describe("coinche is valid after SA bid", () => {
  it("opponent can coinche an SA bid", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSansAtoutBid(1, 90, idGen));
    const coinche = createCoincheBid(2, idGen);
    expect(isValidBid(round, coinche)).toBe(true);
  });
});

// ── end-to-end: SA contract scoring ──────────────────────────────────────────

describe("calculateRoundScore with SA contract from getContract", () => {
  it("jacks score 0 when contract came from a SA winning bid", () => {
    // Build bidding round won by an SA bid
    let biddingRound = createBiddingRound(0, idGen);
    biddingRound = placeBid(biddingRound, createSansAtoutBid(1, 90, idGen));
    biddingRound = placeBid(biddingRound, createPassBid(2, idGen));
    biddingRound = placeBid(biddingRound, createPassBid(3, idGen));
    biddingRound = placeBid(biddingRound, createPassBid(0, idGen));
    const contract = getContract(biddingRound, createIdGenerator({ seed: 200 }));

    // 8 tricks each containing one heart jack (0 pts in SA) + three 7s (0 pts each)
    const tricks: Trick[] = [];
    for (let i = 0; i < 8; i++) {
      const played: PlayedCard[] = [
        {
          card: createCard("hearts", "jack", idGen),
          playerPosition: 1 as PlayerPosition,
        },
        {
          card: createCard("spades", "7", idGen),
          playerPosition: 2 as PlayerPosition,
        },
        {
          card: createCard("diamonds", "7", idGen),
          playerPosition: 3 as PlayerPosition,
        },
        {
          card: createCard("clubs", "7", idGen),
          playerPosition: 0 as PlayerPosition,
        },
      ];
      tricks.push(
        Object.freeze({
          id: idGen.generateId("trick"),
          leadingPlayerPosition: 1 as PlayerPosition,
          trumpSuit: "hearts" as Suit,
          contractType: "sans-atout" as const,
          cards: Object.freeze(played),
          state: "completed" as const,
          winnerPosition: 1 as PlayerPosition,
        }),
      );
    }

    const result = calculateRoundScore(tricks, contract);
    // Bidder (pos 1) wins all 8 tricks: 8 × J(0) + 10 last-trick = 10 pts
    expect(result.contractingTeamPoints).toBe(10);
  });
});
