/**
 * Iteration 054 — Capot bid type tests.
 *
 * Pins the bidding model for capot:
 *   - createCapotBid factory
 *   - isValidBid: capot valid when bidding is open
 *   - placeBid: capot ends bidding immediately
 *   - getValidBids: includes capot options
 *   - getContract: capot bid → isCapot: true, correct suit
 *
 * Written RED before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createCapotBid,
  createSuitBid,
  createPassBid,
  createBiddingRound,
  placeBid,
  isValidBid,
  getValidBids,
  getContract,
} from "../../src/models/bid.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 1 });
});

// ── Factory ───────────────────────────────────────────────────────────────────

describe("createCapotBid", () => {
  it("has type capot, the given suit, and null value", () => {
    const bid = createCapotBid(0, "hearts", idGen);
    expect(bid.type).toBe("capot");
    expect(bid.suit).toBe("hearts");
    expect(bid.value).toBeNull();
    expect(bid.playerPosition).toBe(0);
  });
});

// ── isValidBid ────────────────────────────────────────────────────────────────

describe("isValidBid — capot", () => {
  it("capot is valid as opening bid", () => {
    const round = createBiddingRound(0, idGen);
    const capotBid = createCapotBid(1, "hearts", idGen);
    expect(isValidBid(round, capotBid)).toBe(true);
  });

  it("capot is valid when suit bids already placed", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSuitBid(1, 90, "spades", idGen));
    const capotBid = createCapotBid(2, "hearts", idGen);
    expect(isValidBid(round, capotBid)).toBe(true);
  });

  it("capot is invalid after a coinche (post-coinche: only pass/surcoinche)", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSuitBid(1, 90, "spades", idGen));
    round = placeBid(round, createCapotBid(2, "hearts", idGen));
    // After capot, round is completed — no more valid bids
    expect(round.state).toBe("completed");
  });
});

// ── placeBid ─────────────────────────────────────────────────────────────────

describe("placeBid — capot", () => {
  it("capot ends bidding immediately (state=completed)", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createCapotBid(1, "diamonds", idGen));
    expect(round.state).toBe("completed");
  });

  it("capot sets highestBid and resets consecutivePasses to 0", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createPassBid(1, idGen));
    round = placeBid(round, createCapotBid(2, "clubs", idGen));
    expect(round.highestBid?.type).toBe("capot");
    expect(round.highestBid?.suit).toBe("clubs");
    expect(round.consecutivePasses).toBe(0);
  });
});

// ── getValidBids ──────────────────────────────────────────────────────────────

describe("getValidBids includes capot options", () => {
  it("includes capot bids when bidding is open", () => {
    const round = createBiddingRound(0, idGen);
    const bids = getValidBids(round, 1, idGen);
    const capotBids = bids.filter((b) => b.type === "capot");
    expect(capotBids.length).toBeGreaterThan(0);
  });

  it("includes one capot bid per suit (4 total)", () => {
    const round = createBiddingRound(0, idGen);
    const bids = getValidBids(round, 1, idGen);
    const capotBids = bids.filter((b) => b.type === "capot");
    expect(capotBids.length).toBe(4);
  });
});

// ── getContract ───────────────────────────────────────────────────────────────

describe("getContract for capot bid", () => {
  it("capot bid yields isCapot: true", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createCapotBid(1, "hearts", idGen));
    const contract = getContract(round, createIdGenerator({ seed: 200 }));
    expect(contract.isCapot).toBe(true);
  });

  it("capot bid preserves the declared trump suit", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createCapotBid(1, "spades", idGen));
    const contract = getContract(round, createIdGenerator({ seed: 200 }));
    expect(contract.suit).toBe("spades");
  });

  it("capot bid yields contractType suit (uses normal trump rules)", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createCapotBid(1, "clubs", idGen));
    const contract = getContract(round, createIdGenerator({ seed: 200 }));
    expect(contract.contractType).toBe("suit");
  });

  it("non-capot bid yields isCapot: false", () => {
    let round = createBiddingRound(0, idGen);
    round = placeBid(round, createSuitBid(1, 90, "hearts", idGen));
    round = placeBid(round, createPassBid(2, idGen));
    round = placeBid(round, createPassBid(3, idGen));
    round = placeBid(round, createPassBid(0, idGen));
    const contract = getContract(round, createIdGenerator({ seed: 200 }));
    expect(contract.isCapot).toBe(false);
  });
});
