import type { IdGenerator } from "../utils/id.js";
import type { Suit } from "./card.js";
import type { PlayerPosition } from "./player.js";
import { getNextPlayerPosition, isOnSameTeam } from "./player-helpers.js";

export type BidType = "pass" | "suit" | "coinche" | "surcoinche";

export type BiddingState = "in_progress" | "completed" | "all_passed";

export const BID_VALUES = Object.freeze([80, 90, 100, 110, 120, 130, 140, 150, 160] as const);
export type BidValue = (typeof BID_VALUES)[number];

export interface Bid {
  readonly id: string;
  readonly type: BidType;
  readonly playerPosition: PlayerPosition;
  readonly value: BidValue | null;
  readonly suit: Suit | null;
}

export interface BiddingRound {
  readonly id: string;
  readonly dealerPosition: PlayerPosition;
  readonly bids: readonly Bid[];
  readonly currentPlayerPosition: PlayerPosition;
  readonly state: BiddingState;
  readonly consecutivePasses: number;
  readonly highestBid: Bid | null;
  readonly coinched: boolean;
  readonly surcoinched: boolean;
}

export interface Contract {
  readonly id: string;
  readonly suit: Suit;
  readonly value: BidValue;
  readonly bidderPosition: PlayerPosition;
  readonly coincheLevel: 1 | 2 | 4;
}

// ── Helpers (re-exported from shared module) ──

export { getNextPlayerPosition, isOnSameTeam } from "./player-helpers.js";

// ── Bid Factories ──

export function createPassBid(playerPosition: PlayerPosition, idGenerator: IdGenerator): Bid {
  return Object.freeze({
    id: idGenerator.generateId("bid"),
    type: "pass" as const,
    playerPosition,
    value: null,
    suit: null,
  });
}

export function createSuitBid(
  playerPosition: PlayerPosition,
  value: BidValue,
  suit: Suit,
  idGenerator: IdGenerator,
): Bid {
  return Object.freeze({
    id: idGenerator.generateId("bid"),
    type: "suit" as const,
    playerPosition,
    value,
    suit,
  });
}

export function createCoincheBid(playerPosition: PlayerPosition, idGenerator: IdGenerator): Bid {
  return Object.freeze({
    id: idGenerator.generateId("bid"),
    type: "coinche" as const,
    playerPosition,
    value: null,
    suit: null,
  });
}

export function createSurcoincheBid(playerPosition: PlayerPosition, idGenerator: IdGenerator): Bid {
  return Object.freeze({
    id: idGenerator.generateId("bid"),
    type: "surcoinche" as const,
    playerPosition,
    value: null,
    suit: null,
  });
}

// ── BiddingRound Factory ──

export function createBiddingRound(
  dealerPosition: PlayerPosition,
  idGenerator: IdGenerator,
): BiddingRound {
  return Object.freeze({
    id: idGenerator.generateId("round"),
    dealerPosition,
    bids: Object.freeze([]),
    currentPlayerPosition: getNextPlayerPosition(dealerPosition),
    state: "in_progress" as const,
    consecutivePasses: 0,
    highestBid: null,
    coinched: false,
    surcoinched: false,
  });
}

// ── Validation ──

function isValidBidValue(value: number): value is BidValue {
  return (BID_VALUES as readonly number[]).includes(value);
}

export function isValidBid(round: BiddingRound, bid: Bid): boolean {
  if (round.state !== "in_progress") {
    return false;
  }

  if (bid.playerPosition !== round.currentPlayerPosition) {
    return false;
  }

  // After coinche: only pass or surcoinche (by bidding team) are valid
  if (round.coinched && !round.surcoinched) {
    if (bid.type === "pass") {
      return true;
    }
    if (bid.type === "surcoinche") {
      return (
        round.highestBid !== null &&
        isOnSameTeam(bid.playerPosition, round.highestBid.playerPosition)
      );
    }
    return false;
  }

  switch (bid.type) {
    case "pass":
      return true;

    case "suit": {
      if (bid.value === null || bid.suit === null) {
        return false;
      }
      if (!isValidBidValue(bid.value)) {
        return false;
      }
      if (
        round.highestBid !== null &&
        round.highestBid.value !== null &&
        bid.value <= round.highestBid.value
      ) {
        return false;
      }
      return true;
    }

    case "coinche": {
      if (round.highestBid === null) {
        return false;
      }
      if (round.coinched) {
        return false;
      }
      return !isOnSameTeam(bid.playerPosition, round.highestBid.playerPosition);
    }

    case "surcoinche":
      return false;
  }
}

// ── State Transitions ──

export function placeBid(round: BiddingRound, bid: Bid): BiddingRound {
  if (!isValidBid(round, bid)) {
    throw new Error(
      `Invalid bid: type=${bid.type}, position=${String(bid.playerPosition)}, current=${String(round.currentPlayerPosition)}`,
    );
  }

  const newBids = [...round.bids, bid];
  let newConsecutivePasses = round.consecutivePasses;
  let newHighestBid = round.highestBid;
  let newCoinched = round.coinched;
  let newSurcoinched = round.surcoinched;
  let newState: BiddingState = "in_progress";

  switch (bid.type) {
    case "pass":
      newConsecutivePasses += 1;
      break;
    case "suit":
      newHighestBid = bid;
      newConsecutivePasses = 0;
      break;
    case "coinche":
      newCoinched = true;
      newConsecutivePasses = 0;
      break;
    case "surcoinche":
      newSurcoinched = true;
      newConsecutivePasses = 0;
      newState = "completed";
      break;
  }

  // Check completion conditions (if not already completed by surcoinche)
  if (newState === "in_progress") {
    if (newHighestBid !== null && newConsecutivePasses >= 3) {
      // 3 consecutive passes after a suit bid → completed
      newState = "completed";
    } else if (newHighestBid === null && newConsecutivePasses >= 4) {
      // All 4 players passed without bidding → dead round
      newState = "all_passed";
    } else if (
      newCoinched &&
      bid.type === "pass" &&
      newHighestBid !== null &&
      isOnSameTeam(bid.playerPosition, newHighestBid.playerPosition)
    ) {
      // Bidding team member passed after coinche → bidding ends with coinche
      newState = "completed";
    }
  }

  const nextPosition =
    newState === "in_progress"
      ? getNextPlayerPosition(round.currentPlayerPosition)
      : round.currentPlayerPosition;

  return Object.freeze({
    id: round.id,
    dealerPosition: round.dealerPosition,
    bids: Object.freeze(newBids),
    currentPlayerPosition: nextPosition,
    state: newState,
    consecutivePasses: newConsecutivePasses,
    highestBid: newHighestBid,
    coinched: newCoinched,
    surcoinched: newSurcoinched,
  });
}

// ── Contract Extraction ──

export function getContract(round: BiddingRound, idGenerator: IdGenerator): Contract {
  if (round.state !== "completed") {
    throw new Error(
      `Cannot extract contract: bidding state is "${round.state}", expected "completed"`,
    );
  }

  const { highestBid } = round;
  if (highestBid === null) {
    throw new Error("Cannot extract contract: no highest bid found");
  }
  if (highestBid.suit === null || highestBid.value === null) {
    throw new Error("Cannot extract contract: highest bid has no suit or value");
  }

  let coincheLevel: 1 | 2 | 4 = 1;
  if (round.surcoinched) {
    coincheLevel = 4;
  } else if (round.coinched) {
    coincheLevel = 2;
  }

  return Object.freeze({
    id: idGenerator.generateId("contract"),
    suit: highestBid.suit,
    value: highestBid.value,
    bidderPosition: highestBid.playerPosition,
    coincheLevel,
  });
}
