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
} from "./card.js";
export type { Suit, Rank, Card } from "./card.js";

export { createPlayer, setPlayerHand, createTeam, dealCards } from "./player.js";
export type { PlayerPosition, Player, Team } from "./player.js";

export { getNextPlayerPosition, isOnSameTeam } from "./player-helpers.js";

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
} from "./bid.js";
export type { BidType, BidValue, Bid, BiddingState, BiddingRound, Contract } from "./bid.js";

export {
  createTrick,
  playCard,
  isValidPlay,
  getValidPlays,
  getTrickWinner,
  removeCardFromHand,
} from "./trick.js";
export type { TrickState, PlayedCard, Trick } from "./trick.js";

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
} from "./scoring.js";
export type { TeamPoints, RoundScore } from "./scoring.js";

export { createRound, placeBidInRound, playCardInRound } from "./round.js";
export type { RoundPhase, Round } from "./round.js";

export { DEFAULT_TARGET_SCORE, createGame, addCompletedRound } from "./game.js";
export type { GameState, Game } from "./game.js";
