import type { BiddingRound, BidValue, Contract, Suit } from "@belote/core";
import type { GameSessionState } from "../../hooks/useGameSession.js";
import type { CardData, PlayerData, Position, TrickCardData } from "../../data/mockGame.js";
import type { GameMessage } from "../../messages/gameMessages.js";

const noop = (): void => {
  /* fixture: no-op */
};

const PLAYERS_DEFAULT: readonly PlayerData[] = [
  {
    name: "ElenaP",
    level: 14,
    avatarUrl: "https://i.pravatar.cc/150?u=elenap-belote",
    isVip: true,
    isDealer: false,
    position: "south",
    cardCount: 8,
  },
  {
    name: "Villy",
    level: 17,
    avatarUrl: "https://i.pravatar.cc/150?u=villy-belote",
    isVip: true,
    isDealer: false,
    position: "west",
    cardCount: 8,
  },
  {
    name: "DilyanaBl",
    level: 18,
    avatarUrl: "https://i.pravatar.cc/150?u=dilyanab-belote",
    isVip: false,
    isDealer: false,
    position: "north",
    cardCount: 8,
  },
  {
    name: "Vane_Bane",
    level: 10,
    avatarUrl: "https://i.pravatar.cc/150?u=vanebane-belote",
    isVip: true,
    isDealer: true,
    position: "east",
    cardCount: 8,
  },
];

const HAND_BIDDING: readonly CardData[] = [
  { suit: "hearts", rank: "ace" },
  { suit: "hearts", rank: "10" },
  { suit: "hearts", rank: "queen" },
  { suit: "spades", rank: "jack" },
  { suit: "spades", rank: "9" },
  { suit: "diamonds", rank: "king" },
  { suit: "clubs", rank: "ace" },
  { suit: "clubs", rank: "8" },
];

const HAND_PLAYING: readonly CardData[] = [
  { suit: "spades", rank: "jack" },
  { suit: "spades", rank: "9" },
  { suit: "spades", rank: "ace" },
  { suit: "hearts", rank: "ace" },
  { suit: "hearts", rank: "10" },
  { suit: "diamonds", rank: "king" },
  { suit: "clubs", rank: "queen" },
];

const EMPTY_BUBBLES: Record<Position, GameMessage | null> = {
  south: null,
  north: null,
  west: null,
  east: null,
};

function makeBiddingRound(over: Partial<BiddingRound> = {}): BiddingRound {
  return {
    id: "fixture-bidding",
    dealerPosition: 3,
    bids: [],
    currentPlayerPosition: 0,
    state: "active",
    consecutivePasses: 0,
    highestBid: null,
    coinched: false,
    surcoinched: false,
    ...over,
  };
}

const ALL_BID_VALUES: readonly BidValue[] = [80, 90, 100, 110, 120, 130, 140, 150, 160, 250];

function baseState(over: Partial<GameSessionState> = {}): GameSessionState {
  const base: GameSessionState = {
    phase: "playing",
    players: [...PLAYERS_DEFAULT],
    playerHand: [...HAND_PLAYING],
    trickCards: [],
    trickWinnerPosition: null,
    trumpSuit: null,
    activePosition: "south",
    targetScore: 501,
    usTotalScore: 0,
    themTotalScore: 0,
    usScore: 0,
    themScore: 0,
    dealerName: "Vane_Bane",
    isMyTurn: false,
    isDealing: false,
    roundNumber: 1,
    lastRoundResult: null,
    winnerTeamIndex: null,
    legalCardIndices: new Set(),
    biddingRound: null,
    validBidValues: [],
    contract: null,
    contractHolderPosition: null,
    messages: [],
    bubbles: { ...EMPTY_BUBBLES },
    dispatch: noop,
    playCard: noop,
    placeBid: noop,
    startNextRound: noop,
    startGame: noop,
  };
  return { ...base, ...over };
}

// ── Public builders ──────────────────────────────────────────────────────────

export function buildBiddingState(turnPosition: Position): GameSessionState {
  const positionIdx: Record<Position, 0 | 1 | 2 | 3> = {
    south: 0,
    west: 1,
    north: 2,
    east: 3,
  };
  const isHumanTurn = turnPosition === "south";
  return baseState({
    phase: "bidding",
    activePosition: turnPosition,
    isMyTurn: isHumanTurn,
    playerHand: [...HAND_BIDDING],
    biddingRound: isHumanTurn
      ? makeBiddingRound({ currentPlayerPosition: positionIdx[turnPosition] })
      : null,
    validBidValues: isHumanTurn ? ALL_BID_VALUES : [],
  });
}

export function buildBiddingMidAuctionState(): GameSessionState {
  return baseState({
    phase: "bidding",
    activePosition: "south",
    isMyTurn: true,
    playerHand: [...HAND_BIDDING],
    biddingRound: makeBiddingRound({
      currentPlayerPosition: 0,
      bids: [
        { id: "b1", type: "suit", playerPosition: 2, value: 100, suit: "spades" },
        { id: "b2", type: "pass", playerPosition: 3, value: null, suit: null },
      ],
      highestBid: { id: "b1", type: "suit", playerPosition: 2, value: 100, suit: "spades" },
    }),
    validBidValues: ALL_BID_VALUES.filter((v) => v > 100),
    bubbles: {
      ...EMPTY_BUBBLES,
      north: {
        id: "bub-n",
        position: "north",
        playerName: "DilyanaBl",
        text: "100 ♠",
        type: "bid",
        timestamp: 0,
      },
      east: {
        id: "bub-e",
        position: "east",
        playerName: "Vane_Bane",
        text: "Pass",
        type: "bid",
        timestamp: 0,
      },
    },
  });
}

const TRICK_OFFSETS: Record<Position, { rotation: number; offsetX: number; offsetY: number }> = {
  south: { rotation: 5, offsetX: 6, offsetY: 12 },
  north: { rotation: -4, offsetX: -6, offsetY: -12 },
  west: { rotation: -8, offsetX: -14, offsetY: 4 },
  east: { rotation: 9, offsetX: 14, offsetY: -4 },
};

function trickCard(position: Position, suit: Suit, rank: string): TrickCardData {
  return { suit, rank, position, ...TRICK_OFFSETS[position] };
}

const ACTIVE_CONTRACT: Contract = {
  id: "fixture-active-contract",
  suit: "spades",
  value: 110,
  bidderPosition: 2,
  coincheLevel: 1,
};

export function buildPlayingMidTrickState(): GameSessionState {
  return baseState({
    phase: "playing",
    activePosition: "north",
    isMyTurn: false,
    trumpSuit: "spades",
    contract: ACTIVE_CONTRACT,
    contractHolderPosition: "north",
    usScore: 22,
    themScore: 18,
    trickCards: [trickCard("east", "hearts", "king"), trickCard("south", "hearts", "10")],
  });
}

export function buildPlayingEndOfTrickState(): GameSessionState {
  return baseState({
    phase: "playing",
    activePosition: "south",
    isMyTurn: false,
    trumpSuit: "spades",
    contract: ACTIVE_CONTRACT,
    contractHolderPosition: "north",
    usScore: 35,
    themScore: 27,
    trickCards: [
      trickCard("east", "hearts", "king"),
      trickCard("south", "hearts", "10"),
      trickCard("west", "spades", "7"),
      trickCard("north", "spades", "jack"),
    ],
    trickWinnerPosition: "north",
    bubbles: {
      ...EMPTY_BUBBLES,
      north: {
        id: "bub-trick-win",
        position: "north",
        playerName: "DilyanaBl",
        text: "+24",
        type: "trick_win",
        timestamp: 0,
      },
    },
  });
}

export function buildPlayingHumanTurnState(): GameSessionState {
  return baseState({
    phase: "playing",
    activePosition: "south",
    isMyTurn: true,
    trumpSuit: "hearts",
    contract: { ...ACTIVE_CONTRACT, suit: "hearts", value: 90, bidderPosition: 0 },
    contractHolderPosition: "south",
    usScore: 18,
    themScore: 12,
    legalCardIndices: new Set([0, 1, 2, 3]),
  });
}

export function buildPlayingBeloteState(): GameSessionState {
  return baseState({
    phase: "playing",
    activePosition: "north",
    trumpSuit: "spades",
    contract: ACTIVE_CONTRACT,
    contractHolderPosition: "north",
    usScore: 0,
    themScore: 32,
    trickCards: [trickCard("east", "spades", "queen")],
    bubbles: {
      ...EMPTY_BUBBLES,
      east: {
        id: "bub-belote",
        position: "east",
        playerName: "Vane_Bane",
        text: "Belote !",
        type: "contract",
        timestamp: 0,
      },
    },
  });
}
