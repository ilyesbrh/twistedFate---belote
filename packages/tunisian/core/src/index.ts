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

export { getNextPlayerPosition, isOnSameTeam } from "./models/index.js";

export {
  BID_VALUES,
  createPassBid,
  createSuitBid,
  createCoincheBid,
  createSurcoincheBid,
  createBiddingRound,
  placeBid,
  isValidBid,
  getValidBids,
  getContract,
} from "./models/index.js";
export type {
  BidType,
  BidValue,
  Bid,
  BiddingState,
  BiddingRound,
  Contract,
} from "./models/index.js";

export {
  createTrick,
  playCard,
  isValidPlay,
  getValidPlays,
  getTrickWinner,
  removeCardFromHand,
} from "./models/index.js";
export type { TrickState, PlayedCard, Trick } from "./models/index.js";

export {
  LAST_TRICK_BONUS,
  BELOTE_BONUS,
  TOTAL_CARD_POINTS,
  TOTAL_ROUND_POINTS,
  FAILED_CONTRACT_POINTS,
  roundToNearestTen,
  calculateRunningPoints,
  calculateTrickPoints,
  calculateTeamPoints,
  detectBeloteRebelote,
  calculateRoundScore,
} from "./models/index.js";
export type { TeamPoints, RoundScore } from "./models/index.js";

export { createRound, placeBidInRound, playCardInRound } from "./models/index.js";
export type { RoundPhase, Round } from "./models/index.js";

export { DEFAULT_TARGET_SCORE, createGame, addCompletedRound } from "./models/index.js";
export type { GameState, Game } from "./models/index.js";

export { chooseCard, chooseCardForRound, chooseBid, evaluateHandForSuit } from "./ai/index.js";
