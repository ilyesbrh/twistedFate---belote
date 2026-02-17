import { describe, it, expect, beforeEach } from "vitest";
import {
  BID_VALUES,
  createPassBid,
  createSuitBid,
  createCoincheBid,
  createSurcoincheBid,
  createBiddingRound,
  placeBid,
  isValidBid,
  getContract,
  getNextPlayerPosition,
  isOnSameTeam,
} from "../../src/models/bid.js";
import type { Bid, BiddingRound, Contract } from "../../src/models/bid.js";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";

describe("Bidding System", () => {
  let idGenerator: IdGenerator;

  beforeEach(() => {
    idGenerator = createIdGenerator({ seed: 42 });
  });

  // ==================================================
  // SECTION 1: BID FACTORIES
  // ==================================================
  describe("Bid Factories", () => {
    it("should create a pass bid with correct type and null value/suit", () => {
      const bid = createPassBid(0, idGenerator);
      expect(bid.type).toBe("pass");
      expect(bid.playerPosition).toBe(0);
      expect(bid.value).toBeNull();
      expect(bid.suit).toBeNull();
    });

    it("should create a suit bid with correct type, value, and suit", () => {
      const bid = createSuitBid(1, 80, "hearts", idGenerator);
      expect(bid.type).toBe("suit");
      expect(bid.playerPosition).toBe(1);
      expect(bid.value).toBe(80);
      expect(bid.suit).toBe("hearts");
    });

    it("should create a coinche bid with correct type and null value/suit", () => {
      const bid = createCoincheBid(2, idGenerator);
      expect(bid.type).toBe("coinche");
      expect(bid.playerPosition).toBe(2);
      expect(bid.value).toBeNull();
      expect(bid.suit).toBeNull();
    });

    it("should create a surcoinche bid with correct type and null value/suit", () => {
      const bid = createSurcoincheBid(3, idGenerator);
      expect(bid.type).toBe("surcoinche");
      expect(bid.playerPosition).toBe(3);
      expect(bid.value).toBeNull();
      expect(bid.suit).toBeNull();
    });

    it("should assign unique IDs with bid_ prefix", () => {
      const b1 = createPassBid(0, idGenerator);
      const b2 = createSuitBid(1, 80, "hearts", idGenerator);
      const b3 = createCoincheBid(2, idGenerator);
      expect(b1.id).toMatch(/^bid_[a-z0-9]+$/);
      expect(b2.id).toMatch(/^bid_[a-z0-9]+$/);
      expect(b3.id).toMatch(/^bid_[a-z0-9]+$/);
      expect(new Set([b1.id, b2.id, b3.id]).size).toBe(3);
    });

    it("should produce deterministic IDs with seeded generator", () => {
      const gen1 = createIdGenerator({ seed: 99 });
      const gen2 = createIdGenerator({ seed: 99 });
      const b1 = createSuitBid(0, 80, "hearts", gen1);
      const b2 = createSuitBid(0, 80, "hearts", gen2);
      expect(b1.id).toBe(b2.id);
    });

    it("should return frozen bids", () => {
      const pass = createPassBid(0, idGenerator);
      const suit = createSuitBid(1, 80, "hearts", idGenerator);
      const coinche = createCoincheBid(2, idGenerator);
      const surcoinche = createSurcoincheBid(3, idGenerator);
      expect(Object.isFrozen(pass)).toBe(true);
      expect(Object.isFrozen(suit)).toBe(true);
      expect(Object.isFrozen(coinche)).toBe(true);
      expect(Object.isFrozen(surcoinche)).toBe(true);
    });

    it("should export valid BID_VALUES constant", () => {
      expect(BID_VALUES).toEqual([80, 90, 100, 110, 120, 130, 140, 150, 160]);
      expect(Object.isFrozen(BID_VALUES)).toBe(true);
    });
  });

  // ==================================================
  // SECTION 2: BIDDING ROUND CREATION
  // ==================================================
  describe("createBiddingRound", () => {
    it("should create a round with the correct dealer position", () => {
      const round = createBiddingRound(0, idGenerator);
      expect(round.dealerPosition).toBe(0);
    });

    it("should set current player to dealer + 1", () => {
      expect(createBiddingRound(0, idGenerator).currentPlayerPosition).toBe(1);
      const gen2 = createIdGenerator({ seed: 50 });
      expect(createBiddingRound(3, gen2).currentPlayerPosition).toBe(0);
    });

    it("should start with empty bids and in_progress state", () => {
      const round = createBiddingRound(2, idGenerator);
      expect(round.bids).toHaveLength(0);
      expect(round.state).toBe("in_progress");
      expect(round.consecutivePasses).toBe(0);
    });

    it("should start with no highest bid and not coinched", () => {
      const round = createBiddingRound(1, idGenerator);
      expect(round.highestBid).toBeNull();
      expect(round.coinched).toBe(false);
      expect(round.surcoinched).toBe(false);
    });

    it("should return a frozen round with frozen bids array", () => {
      const round = createBiddingRound(0, idGenerator);
      expect(Object.isFrozen(round)).toBe(true);
      expect(Object.isFrozen(round.bids)).toBe(true);
    });
  });

  // ==================================================
  // SECTION 3: HELPERS
  // ==================================================
  describe("getNextPlayerPosition", () => {
    it("should cycle clockwise: 0 → 1 → 2 → 3 → 0", () => {
      expect(getNextPlayerPosition(0)).toBe(1);
      expect(getNextPlayerPosition(1)).toBe(2);
      expect(getNextPlayerPosition(2)).toBe(3);
      expect(getNextPlayerPosition(3)).toBe(0);
    });
  });

  describe("isOnSameTeam", () => {
    it("should return true for partner positions (0,2) and (1,3)", () => {
      expect(isOnSameTeam(0, 2)).toBe(true);
      expect(isOnSameTeam(2, 0)).toBe(true);
      expect(isOnSameTeam(1, 3)).toBe(true);
      expect(isOnSameTeam(3, 1)).toBe(true);
    });

    it("should return false for opponent positions", () => {
      expect(isOnSameTeam(0, 1)).toBe(false);
      expect(isOnSameTeam(0, 3)).toBe(false);
      expect(isOnSameTeam(1, 2)).toBe(false);
      expect(isOnSameTeam(2, 3)).toBe(false);
    });

    it("should return true for same position (self)", () => {
      expect(isOnSameTeam(0, 0)).toBe(true);
      expect(isOnSameTeam(1, 1)).toBe(true);
    });
  });

  // ==================================================
  // SECTION 4: BID VALIDATION
  // ==================================================
  describe("isValidBid", () => {
    it("should accept a valid first suit bid", () => {
      const round = createBiddingRound(0, idGenerator);
      const bid = createSuitBid(1, 80, "hearts", idGenerator);
      expect(isValidBid(round, bid)).toBe(true);
    });

    it("should accept a pass at any time", () => {
      const round = createBiddingRound(0, idGenerator);
      const bid = createPassBid(1, idGenerator);
      expect(isValidBid(round, bid)).toBe(true);
    });

    it("should reject a bid from the wrong player position", () => {
      const round = createBiddingRound(0, idGenerator);
      // Current player is position 1 (dealer+1), bid from position 2 is invalid
      const bid = createSuitBid(2, 80, "hearts", idGenerator);
      expect(isValidBid(round, bid)).toBe(false);
    });

    it("should reject a bid when bidding is already complete", () => {
      let round = createBiddingRound(0, idGenerator);
      // Play a full round: bid then 3 passes
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createPassBid(2, idGenerator));
      round = placeBid(round, createPassBid(3, idGenerator));
      round = placeBid(round, createPassBid(0, idGenerator));
      expect(round.state).toBe("completed");

      const lateBid = createSuitBid(1, 90, "spades", idGenerator);
      expect(isValidBid(round, lateBid)).toBe(false);
    });

    it("should accept a suit bid with higher value than current highest", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      const higherBid = createSuitBid(2, 90, "spades", idGenerator);
      expect(isValidBid(round, higherBid)).toBe(true);
    });

    it("should reject a suit bid with equal value to current highest", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      const equalBid = createSuitBid(2, 80, "spades", idGenerator);
      expect(isValidBid(round, equalBid)).toBe(false);
    });

    it("should reject a suit bid with lower value than current highest", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 100, "hearts", idGenerator));
      const lowerBid = createSuitBid(2, 90, "spades", idGenerator);
      expect(isValidBid(round, lowerBid)).toBe(false);
    });

    it("should reject a suit bid with invalid value (not in BID_VALUES)", () => {
      const round = createBiddingRound(0, idGenerator);
      // 85 is not a valid bid value (must be multiples of 10 from 80-160)
      const invalidBid = createSuitBid(1, 85 as any, "hearts", idGenerator);
      expect(isValidBid(round, invalidBid)).toBe(false);
    });

    it("should accept a coinche from an opponent after a suit bid", () => {
      let round = createBiddingRound(0, idGenerator);
      // Position 1 bids (team 1,3)
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      // Position 2 is opponent of position 1 (team 0,2) → can coinche
      const coinche = createCoincheBid(2, idGenerator);
      expect(isValidBid(round, coinche)).toBe(true);
    });

    it("should reject a coinche from the same team as highest bidder", () => {
      let round = createBiddingRound(0, idGenerator);
      // Position 1 bids (team 1,3)
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createPassBid(2, idGenerator));
      // Position 3 is same team as position 1 → cannot coinche
      const coinche = createCoincheBid(3, idGenerator);
      expect(isValidBid(round, coinche)).toBe(false);
    });

    it("should reject a coinche when no suit bid has been made", () => {
      const round = createBiddingRound(0, idGenerator);
      const coinche = createCoincheBid(1, idGenerator);
      expect(isValidBid(round, coinche)).toBe(false);
    });

    it("should reject a coinche when already coinched", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createCoincheBid(2, idGenerator));
      // Now it's position 3's turn — cannot coinche again
      const doubleCoinche = createCoincheBid(3, idGenerator);
      expect(isValidBid(round, doubleCoinche)).toBe(false);
    });

    it("should reject a surcoinche when not coinched", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      const surcoinche = createSurcoincheBid(2, idGenerator);
      expect(isValidBid(round, surcoinche)).toBe(false);
    });

    it("should accept a surcoinche from bidding team member after coinche", () => {
      let round = createBiddingRound(0, idGenerator);
      // Position 1 bids (team 1,3)
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      // Position 2 coinches (opponent, team 0,2)
      round = placeBid(round, createCoincheBid(2, idGenerator));
      // Position 3 is same team as bidder (1,3) → can surcoinche
      const surcoinche = createSurcoincheBid(3, idGenerator);
      expect(isValidBid(round, surcoinche)).toBe(true);
    });

    it("should reject a surcoinche from opponent after coinche", () => {
      let round = createBiddingRound(0, idGenerator);
      // Position 1 bids (team 1,3)
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      // Position 2 coinches (team 0,2)
      round = placeBid(round, createCoincheBid(2, idGenerator));
      // Position 3 is team 1,3 (bidding team) — skip to test opponent
      // But position 3 IS on the bidding team. Let me set up where opponent is next:
      // Dealer=3, so current starts at 0
      const gen2 = createIdGenerator({ seed: 50 });
      let round2 = createBiddingRound(3, gen2);
      // Position 0 bids (team 0,2)
      round2 = placeBid(round2, createSuitBid(0, 80, "hearts", gen2));
      // Position 1 coinches (team 1,3, opponent)
      round2 = placeBid(round2, createCoincheBid(1, gen2));
      // Position 2 is on bidding team (0,2) → this should be valid
      // Position 3 would be opponent → invalid surcoinche
      // But we need position 2 to pass first to get to position 3
      // Actually after coinche, position 2 is next. Let's test that position 2 (team) is valid
      // and a different setup where opponent is next after coinche
      // Let me use: dealer=1, start at 2
      const gen3 = createIdGenerator({ seed: 60 });
      let round3 = createBiddingRound(1, gen3);
      // Position 2 bids (team 0,2)
      round3 = placeBid(round3, createSuitBid(2, 80, "hearts", gen3));
      // Position 3 coinches (team 1,3, opponent)
      round3 = placeBid(round3, createCoincheBid(3, gen3));
      // Position 0 is next, on bidding team (0,2) — skip via pass to get opponent
      round3 = placeBid(round3, createPassBid(0, gen3));
      // Position 1 (team 1,3, opponent) cannot surcoinche
      const invalidSurcoinche = createSurcoincheBid(1, gen3);
      expect(isValidBid(round3, invalidSurcoinche)).toBe(false);
    });

    it("should reject suit bid after coinche", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createCoincheBid(2, idGenerator));
      // Position 3 cannot make a new suit bid after coinche
      const suitBid = createSuitBid(3, 90, "spades", idGenerator);
      expect(isValidBid(round, suitBid)).toBe(false);
    });
  });

  // ==================================================
  // SECTION 5: PLACE BID
  // ==================================================
  describe("placeBid", () => {
    it("should add the bid to the round's bid array", () => {
      const round = createBiddingRound(0, idGenerator);
      const bid = createSuitBid(1, 80, "hearts", idGenerator);
      const updated = placeBid(round, bid);
      expect(updated.bids).toHaveLength(1);
      expect(updated.bids[0]!.id).toBe(bid.id);
    });

    it("should advance the current player position", () => {
      const round = createBiddingRound(0, idGenerator);
      const bid = createSuitBid(1, 80, "hearts", idGenerator);
      const updated = placeBid(round, bid);
      expect(updated.currentPlayerPosition).toBe(2);
    });

    it("should return a new frozen round without mutating the original", () => {
      const round = createBiddingRound(0, idGenerator);
      const bid = createPassBid(1, idGenerator);
      const updated = placeBid(round, bid);
      expect(updated).not.toBe(round);
      expect(Object.isFrozen(updated)).toBe(true);
      expect(Object.isFrozen(updated.bids)).toBe(true);
      expect(round.bids).toHaveLength(0);
    });

    it("should update highestBid when a suit bid is placed", () => {
      const round = createBiddingRound(0, idGenerator);
      const bid = createSuitBid(1, 80, "hearts", idGenerator);
      const updated = placeBid(round, bid);
      expect(updated.highestBid).not.toBeNull();
      expect(updated.highestBid!.value).toBe(80);
      expect(updated.highestBid!.suit).toBe("hearts");
    });

    it("should track consecutive passes and reset on suit bid", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createPassBid(1, idGenerator));
      expect(round.consecutivePasses).toBe(1);
      round = placeBid(round, createPassBid(2, idGenerator));
      expect(round.consecutivePasses).toBe(2);
      round = placeBid(round, createSuitBid(3, 80, "hearts", idGenerator));
      expect(round.consecutivePasses).toBe(0);
    });

    it("should set state to 'completed' after 3 consecutive passes following a suit bid", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      expect(round.state).toBe("in_progress");
      round = placeBid(round, createPassBid(2, idGenerator));
      round = placeBid(round, createPassBid(3, idGenerator));
      expect(round.state).toBe("in_progress");
      round = placeBid(round, createPassBid(0, idGenerator));
      expect(round.state).toBe("completed");
    });

    it("should set state to 'all_passed' when all 4 players pass without a bid", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createPassBid(1, idGenerator));
      round = placeBid(round, createPassBid(2, idGenerator));
      round = placeBid(round, createPassBid(3, idGenerator));
      expect(round.state).toBe("in_progress");
      round = placeBid(round, createPassBid(0, idGenerator));
      expect(round.state).toBe("all_passed");
    });

    it("should set coinched flag when coinche is placed", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      expect(round.coinched).toBe(false);
      round = placeBid(round, createCoincheBid(2, idGenerator));
      expect(round.coinched).toBe(true);
    });

    it("should complete with surcoinche and set surcoinched flag", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createCoincheBid(2, idGenerator));
      // Position 3 is on bidding team (1,3) → surcoinche
      round = placeBid(round, createSurcoincheBid(3, idGenerator));
      expect(round.surcoinched).toBe(true);
      expect(round.state).toBe("completed");
    });

    it("should complete when bidding team member passes after coinche", () => {
      let round = createBiddingRound(0, idGenerator);
      // Position 1 bids (team 1,3)
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      // Position 2 coinches (team 0,2)
      round = placeBid(round, createCoincheBid(2, idGenerator));
      // Position 3 is on bidding team (1,3) → pass declines surcoinche
      round = placeBid(round, createPassBid(3, idGenerator));
      expect(round.state).toBe("completed");
      expect(round.coinched).toBe(true);
      expect(round.surcoinched).toBe(false);
    });

    it("should throw on invalid bid", () => {
      const round = createBiddingRound(0, idGenerator);
      // Wrong player position (current is 1, bid from 2)
      const invalidBid = createSuitBid(2, 80, "hearts", idGenerator);
      expect(() => placeBid(round, invalidBid)).toThrow();
    });
  });

  // ==================================================
  // SECTION 6: GET CONTRACT
  // ==================================================
  describe("getContract", () => {
    it("should extract correct suit and value from completed round", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 100, "spades", idGenerator));
      round = placeBid(round, createPassBid(2, idGenerator));
      round = placeBid(round, createPassBid(3, idGenerator));
      round = placeBid(round, createPassBid(0, idGenerator));

      const contractGen = createIdGenerator({ seed: 200 });
      const contract = getContract(round, contractGen);
      expect(contract.suit).toBe("spades");
      expect(contract.value).toBe(100);
    });

    it("should extract the correct bidder position", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createSuitBid(2, 90, "diamonds", idGenerator));
      round = placeBid(round, createPassBid(3, idGenerator));
      round = placeBid(round, createPassBid(0, idGenerator));
      round = placeBid(round, createPassBid(1, idGenerator));

      const contractGen = createIdGenerator({ seed: 200 });
      const contract = getContract(round, contractGen);
      expect(contract.bidderPosition).toBe(2);
      expect(contract.suit).toBe("diamonds");
      expect(contract.value).toBe(90);
    });

    it("should return coincheLevel 1 for normal contract", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createPassBid(2, idGenerator));
      round = placeBid(round, createPassBid(3, idGenerator));
      round = placeBid(round, createPassBid(0, idGenerator));

      const contract = getContract(round, createIdGenerator({ seed: 200 }));
      expect(contract.coincheLevel).toBe(1);
    });

    it("should return coincheLevel 2 for coinched contract", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createCoincheBid(2, idGenerator));
      // Position 3 (bidding team) passes → coinche stands
      round = placeBid(round, createPassBid(3, idGenerator));

      const contract = getContract(round, createIdGenerator({ seed: 200 }));
      expect(contract.coincheLevel).toBe(2);
    });

    it("should return coincheLevel 4 for surcoinched contract", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createCoincheBid(2, idGenerator));
      round = placeBid(round, createSurcoincheBid(3, idGenerator));

      const contract = getContract(round, createIdGenerator({ seed: 200 }));
      expect(contract.coincheLevel).toBe(4);
    });

    it("should assign a unique ID with contract_ prefix", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createSuitBid(1, 80, "hearts", idGenerator));
      round = placeBid(round, createPassBid(2, idGenerator));
      round = placeBid(round, createPassBid(3, idGenerator));
      round = placeBid(round, createPassBid(0, idGenerator));

      const contract = getContract(round, createIdGenerator({ seed: 200 }));
      expect(contract.id).toMatch(/^contract_[a-z0-9]+$/);
      expect(Object.isFrozen(contract)).toBe(true);
    });

    it("should throw if bidding is not completed", () => {
      const round = createBiddingRound(0, idGenerator);
      expect(() => getContract(round, idGenerator)).toThrow();
    });

    it("should throw if all players passed (no contract)", () => {
      let round = createBiddingRound(0, idGenerator);
      round = placeBid(round, createPassBid(1, idGenerator));
      round = placeBid(round, createPassBid(2, idGenerator));
      round = placeBid(round, createPassBid(3, idGenerator));
      round = placeBid(round, createPassBid(0, idGenerator));
      expect(round.state).toBe("all_passed");
      expect(() => getContract(round, idGenerator)).toThrow();
    });
  });

  // ==================================================
  // SECTION 7: INTEGRATION
  // ==================================================
  describe("integration", () => {
    it("should support a full bidding round with multiple bids", () => {
      const gen = createIdGenerator({ seed: 1 });
      // Dealer at position 0, bidding starts at position 1
      let round = createBiddingRound(0, gen);

      // Position 1: bids 80 hearts
      round = placeBid(round, createSuitBid(1, 80, "hearts", gen));
      expect(round.state).toBe("in_progress");

      // Position 2: outbids 90 spades
      round = placeBid(round, createSuitBid(2, 90, "spades", gen));

      // Position 3: outbids 100 diamonds
      round = placeBid(round, createSuitBid(3, 100, "diamonds", gen));

      // Position 0: passes
      round = placeBid(round, createPassBid(0, gen));

      // Position 1: passes
      round = placeBid(round, createPassBid(1, gen));

      // Position 2: passes → 3 consecutive passes after position 3's bid
      round = placeBid(round, createPassBid(2, gen));

      expect(round.state).toBe("completed");
      expect(round.bids).toHaveLength(6);

      const contract = getContract(round, gen);
      expect(contract.suit).toBe("diamonds");
      expect(contract.value).toBe(100);
      expect(contract.bidderPosition).toBe(3);
      expect(contract.coincheLevel).toBe(1);
    });

    it("should handle all-pass scenario (dead round)", () => {
      const gen = createIdGenerator({ seed: 2 });
      let round = createBiddingRound(2, gen);

      // All 4 players pass (starting from position 3)
      round = placeBid(round, createPassBid(3, gen));
      round = placeBid(round, createPassBid(0, gen));
      round = placeBid(round, createPassBid(1, gen));
      round = placeBid(round, createPassBid(2, gen));

      expect(round.state).toBe("all_passed");
      expect(round.highestBid).toBeNull();
      expect(() => getContract(round, gen)).toThrow();
    });

    it("should handle coinche + surcoinche scenario", () => {
      const gen = createIdGenerator({ seed: 3 });
      let round = createBiddingRound(0, gen);

      // Position 1 bids 80 hearts (team 1,3)
      round = placeBid(round, createSuitBid(1, 80, "hearts", gen));
      // Position 2 coinches (team 0,2 — opponent)
      round = placeBid(round, createCoincheBid(2, gen));
      // Position 3 surcoinches (team 1,3 — bidding team)
      round = placeBid(round, createSurcoincheBid(3, gen));

      expect(round.state).toBe("completed");
      expect(round.coinched).toBe(true);
      expect(round.surcoinched).toBe(true);

      const contract = getContract(round, gen);
      expect(contract.coincheLevel).toBe(4);
      expect(contract.suit).toBe("hearts");
      expect(contract.value).toBe(80);
    });

    it("should handle coinche without surcoinche (team declines)", () => {
      const gen = createIdGenerator({ seed: 4 });
      let round = createBiddingRound(0, gen);

      // Position 1 bids 120 clubs (team 1,3)
      round = placeBid(round, createSuitBid(1, 120, "clubs", gen));
      // Position 2 coinches (team 0,2)
      round = placeBid(round, createCoincheBid(2, gen));
      // Position 3 (bidding team) passes → declines surcoinche → bidding ends
      round = placeBid(round, createPassBid(3, gen));

      expect(round.state).toBe("completed");
      expect(round.coinched).toBe(true);
      expect(round.surcoinched).toBe(false);

      const contract = getContract(round, gen);
      expect(contract.coincheLevel).toBe(2);
      expect(contract.suit).toBe("clubs");
      expect(contract.value).toBe(120);
    });
  });
});
