import type { IdGenerator } from "../utils/id.js";
import type { Card } from "./card.js";

export type PlayerPosition = 0 | 1 | 2 | 3;

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly position: PlayerPosition;
  readonly hand: readonly Card[];
}

export interface Team {
  readonly id: string;
  readonly players: readonly [Player, Player];
}

export function createPlayer(
  name: string,
  position: PlayerPosition,
  idGenerator: IdGenerator,
): Player {
  return Object.freeze({
    id: idGenerator.generateId("player"),
    name,
    position,
    hand: Object.freeze([]),
  });
}

export function setPlayerHand(player: Player, hand: readonly Card[]): Player {
  return Object.freeze({
    id: player.id,
    name: player.name,
    position: player.position,
    hand: Object.freeze([...hand]),
  });
}

export function createTeam(player1: Player, player2: Player, idGenerator: IdGenerator): Team {
  return Object.freeze({
    id: idGenerator.generateId("team"),
    players: Object.freeze([player1, player2] as const),
  });
}

export function dealCards(
  deck: readonly Card[],
  players: readonly Player[],
): readonly [Player, Player, Player, Player] {
  if (deck.length !== 32) {
    throw new Error(`Expected 32 cards in deck, got ${String(deck.length)}`);
  }

  if (players.length !== 4) {
    throw new Error(`Expected 4 players, got ${String(players.length)}`);
  }

  const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []];

  for (let i = 0; i < 32; i++) {
    const playerIndex = i % 4;
    const card = deck[i];
    if (card === undefined) {
      throw new Error(`Deck card at index ${String(i)} is undefined`);
    }
    const hand = hands[playerIndex];
    if (hand === undefined) {
      throw new Error(`Invalid player index ${String(playerIndex)}`);
    }
    hand.push(card);
  }

  const p0 = players[0];
  const p1 = players[1];
  const p2 = players[2];
  const p3 = players[3];

  if (p0 === undefined || p1 === undefined || p2 === undefined || p3 === undefined) {
    throw new Error("Player array invariant violated");
  }

  return Object.freeze([
    setPlayerHand(p0, hands[0]),
    setPlayerHand(p1, hands[1]),
    setPlayerHand(p2, hands[2]),
    setPlayerHand(p3, hands[3]),
  ] as const);
}
