export { createIdGenerator, generateId } from "./utils/index.js";
export type { EntityType, IdGenerator, IdGeneratorConfig } from "./utils/index.js";

export {
  ALL_SUITS,
  ALL_RANKS,
  TRUMP_POINTS,
  NON_TRUMP_POINTS,
  TRUMP_ORDER,
  NON_TRUMP_ORDER,
  createCard,
  getCardPoints,
  getCardRankOrder,
  createDeck,
  shuffleDeck,
} from "./models/index.js";
export type { Suit, Rank, Card } from "./models/index.js";

export { createPlayer, setPlayerHand, createTeam, dealCards } from "./models/index.js";
export type { PlayerPosition, Player, Team } from "./models/index.js";

export {
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
} from "./models/index.js";
export type {
  BidType,
  BidValue,
  Bid,
  BiddingState,
  BiddingRound,
  Contract,
} from "./models/index.js";
