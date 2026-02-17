import type { IdGenerator } from "../utils/id.js";

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank = "7" | "8" | "9" | "10" | "jack" | "queen" | "king" | "ace";

export interface Card {
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
}

export const ALL_SUITS: readonly Suit[] = ["hearts", "diamonds", "clubs", "spades"] as const;

export const ALL_RANKS: readonly Rank[] = [
  "7",
  "8",
  "9",
  "10",
  "jack",
  "queen",
  "king",
  "ace",
] as const;

export const TRUMP_POINTS: Readonly<Record<Rank, number>> = {
  "7": 0,
  "8": 0,
  "9": 14,
  "10": 10,
  jack: 20,
  queen: 3,
  king: 4,
  ace: 11,
};

export const NON_TRUMP_POINTS: Readonly<Record<Rank, number>> = {
  "7": 0,
  "8": 0,
  "9": 0,
  "10": 10,
  jack: 2,
  queen: 3,
  king: 4,
  ace: 11,
};

export const TRUMP_ORDER: readonly Rank[] = [
  "7",
  "8",
  "queen",
  "king",
  "10",
  "ace",
  "9",
  "jack",
] as const;

export const NON_TRUMP_ORDER: readonly Rank[] = [
  "7",
  "8",
  "9",
  "jack",
  "queen",
  "king",
  "10",
  "ace",
] as const;

export function createCard(suit: Suit, rank: Rank, idGenerator: IdGenerator): Card {
  return Object.freeze({
    id: idGenerator.generateId("card"),
    suit,
    rank,
  });
}

export function getCardPoints(card: Card, trumpSuit: Suit | null): number {
  if (trumpSuit !== null && card.suit === trumpSuit) {
    return TRUMP_POINTS[card.rank];
  }
  return NON_TRUMP_POINTS[card.rank];
}

export function getCardRankOrder(card: Card, trumpSuit: Suit | null): number {
  const order = trumpSuit !== null && card.suit === trumpSuit ? TRUMP_ORDER : NON_TRUMP_ORDER;
  return order.indexOf(card.rank);
}

export function createDeck(idGenerator: IdGenerator): Card[] {
  const cards: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      cards.push(createCard(suit, rank, idGenerator));
    }
  }
  return cards;
}

export function shuffleDeck(deck: Card[], rng: () => number): Card[] {
  const shuffled = [...deck];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = shuffled[i];
    const swap = shuffled[j];
    if (temp !== undefined && swap !== undefined) {
      shuffled[i] = swap;
      shuffled[j] = temp;
    }
  }
  return shuffled;
}
