import type { BidValue, Card, PlayerPosition, Suit } from "@belote/core";

// ── Command Types ──

export type CommandType = "start_game" | "start_round" | "place_bid" | "play_card";

export interface StartGameCommand {
  readonly type: "start_game";
  readonly playerNames: readonly [string, string, string, string];
  readonly targetScore: number;
}

export interface StartRoundCommand {
  readonly type: "start_round";
}

export interface PlaceBidCommand {
  readonly type: "place_bid";
  readonly playerPosition: PlayerPosition;
  readonly bidType: "pass" | "suit" | "coinche" | "surcoinche";
  readonly value?: BidValue;
  readonly suit?: Suit;
}

export interface PlayCardCommand {
  readonly type: "play_card";
  readonly playerPosition: PlayerPosition;
  readonly card: Card;
}

export type GameCommand = StartGameCommand | StartRoundCommand | PlaceBidCommand | PlayCardCommand;

// ── Command Factories ──

export function createStartGameCommand(
  playerNames: readonly [string, string, string, string],
  targetScore: number,
): StartGameCommand {
  return Object.freeze({
    type: "start_game" as const,
    playerNames: Object.freeze([...playerNames] as [string, string, string, string]),
    targetScore,
  });
}

export function createStartRoundCommand(): StartRoundCommand {
  return Object.freeze({ type: "start_round" as const });
}

export function createPlaceBidCommand(
  playerPosition: PlayerPosition,
  bidType: "pass" | "suit" | "coinche" | "surcoinche",
  value?: BidValue,
  suit?: Suit,
): PlaceBidCommand {
  return Object.freeze({
    type: "place_bid" as const,
    playerPosition,
    bidType,
    value,
    suit,
  });
}

export function createPlayCardCommand(playerPosition: PlayerPosition, card: Card): PlayCardCommand {
  return Object.freeze({
    type: "play_card" as const,
    playerPosition,
    card,
  });
}
