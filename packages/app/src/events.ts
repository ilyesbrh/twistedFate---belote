import type {
  Bid,
  Card,
  Contract,
  Game,
  Player,
  PlayerPosition,
  Round,
  RoundScore,
  Team,
  Trick,
} from "@belote/core";

// ── Event Types ──

export type GameEventType =
  | "game_started"
  | "round_started"
  | "bid_placed"
  | "bidding_completed"
  | "card_played"
  | "trick_completed"
  | "round_completed"
  | "round_cancelled"
  | "game_completed";

export interface GameStartedEvent {
  readonly type: "game_started";
  readonly game: Game;
  readonly players: readonly [Player, Player, Player, Player];
  readonly teams: readonly [Team, Team];
}

export interface RoundStartedEvent {
  readonly type: "round_started";
  readonly round: Round;
  readonly roundNumber: number;
  readonly dealerPosition: PlayerPosition;
}

export interface BidPlacedEvent {
  readonly type: "bid_placed";
  readonly bid: Bid;
  readonly playerPosition: PlayerPosition;
}

export interface BiddingCompletedEvent {
  readonly type: "bidding_completed";
  readonly contract: Contract;
}

export interface CardPlayedEvent {
  readonly type: "card_played";
  readonly card: Card;
  readonly playerPosition: PlayerPosition;
}

export interface TrickCompletedEvent {
  readonly type: "trick_completed";
  readonly trick: Trick;
  readonly winnerPosition: PlayerPosition;
  readonly trickNumber: number;
}

export interface RoundCompletedEvent {
  readonly type: "round_completed";
  readonly round: Round;
  readonly roundScore: RoundScore;
}

export interface RoundCancelledEvent {
  readonly type: "round_cancelled";
  readonly round: Round;
}

export interface GameCompletedEvent {
  readonly type: "game_completed";
  readonly game: Game;
  readonly winnerTeamIndex: 0 | 1;
  readonly finalScores: readonly [number, number];
}

export type GameEvent =
  | GameStartedEvent
  | RoundStartedEvent
  | BidPlacedEvent
  | BiddingCompletedEvent
  | CardPlayedEvent
  | TrickCompletedEvent
  | RoundCompletedEvent
  | RoundCancelledEvent
  | GameCompletedEvent;

// ── Event Listener ──

export type GameEventListener = (event: GameEvent) => void;
