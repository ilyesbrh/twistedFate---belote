import type { IdGenerator } from "../utils/id.js";
import type { Card, Suit } from "./card.js";
import { getCardRankOrder } from "./card.js";
import type { Player, PlayerPosition } from "./player.js";
import { setPlayerHand } from "./player.js";
import { getNextPlayerPosition } from "./player-helpers.js";

export type TrickState = "in_progress" | "completed";

export interface PlayedCard {
  readonly card: Card;
  readonly playerPosition: PlayerPosition;
}

export interface Trick {
  readonly id: string;
  readonly leadingPlayerPosition: PlayerPosition;
  readonly trumpSuit: Suit;
  readonly cards: readonly PlayedCard[];
  readonly state: TrickState;
  readonly winnerPosition: PlayerPosition | null;
}

// ── Factory ──

export function createTrick(
  leadingPlayerPosition: PlayerPosition,
  trumpSuit: Suit,
  idGenerator: IdGenerator,
): Trick {
  return Object.freeze({
    id: idGenerator.generateId("trick"),
    leadingPlayerPosition,
    trumpSuit,
    cards: Object.freeze([]),
    state: "in_progress" as const,
    winnerPosition: null,
  });
}

// ── Validation ──

export function isValidPlay(
  trick: Trick,
  card: Card,
  playerPosition: PlayerPosition,
  playerHand: readonly Card[],
): boolean {
  if (trick.state !== "in_progress") {
    return false;
  }

  // Turn order: first play must be leading player, subsequent plays follow clockwise
  if (trick.cards.length === 0) {
    if (playerPosition !== trick.leadingPlayerPosition) {
      return false;
    }
  } else {
    const lastPlayed = trick.cards[trick.cards.length - 1];
    if (lastPlayed === undefined) {
      return false;
    }
    if (playerPosition !== getNextPlayerPosition(lastPlayed.playerPosition)) {
      return false;
    }
  }

  // Card must be in hand
  if (!playerHand.some((c) => c.id === card.id)) {
    return false;
  }

  // Leading player can play anything
  if (trick.cards.length === 0) {
    return true;
  }

  const firstCard = trick.cards[0];
  if (firstCard === undefined) {
    return false;
  }
  const ledSuit = firstCard.card.suit;

  // Must follow suit
  const hasLedSuit = playerHand.some((c) => c.suit === ledSuit);
  if (hasLedSuit) {
    return card.suit === ledSuit;
  }

  // Cannot follow suit — check trump obligations
  const hasTrump = playerHand.some((c) => c.suit === trick.trumpSuit);
  if (!hasTrump) {
    // No led suit, no trump → play anything
    return true;
  }

  // Must play trump
  if (card.suit !== trick.trumpSuit) {
    return false;
  }

  // Check overtrump requirement
  const trumpsOnTable = trick.cards.filter((pc) => pc.card.suit === trick.trumpSuit);
  if (trumpsOnTable.length === 0) {
    // No trump on table yet — any trump is fine
    return true;
  }

  // Find highest trump rank on table
  const highestTrumpRank = Math.max(
    ...trumpsOnTable.map((pc) => getCardRankOrder(pc.card, trick.trumpSuit)),
  );

  const cardRank = getCardRankOrder(card, trick.trumpSuit);

  // Can the player overtrump?
  const playerTrumps = playerHand.filter((c) => c.suit === trick.trumpSuit);
  const canOvertrump = playerTrumps.some(
    (c) => getCardRankOrder(c, trick.trumpSuit) > highestTrumpRank,
  );

  if (canOvertrump) {
    // Must overtrump
    return cardRank > highestTrumpRank;
  }

  // Cannot overtrump — any trump is acceptable
  return true;
}

// ── Valid Plays Query ──

export function getValidPlays(
  trick: Trick,
  playerPosition: PlayerPosition,
  playerHand: readonly Card[],
): Card[] {
  return playerHand.filter((card) => isValidPlay(trick, card, playerPosition, playerHand));
}

// ── Winner Determination (private) ──

function determineTrickWinner(cards: readonly PlayedCard[], trumpSuit: Suit): PlayerPosition {
  const firstCard = cards[0];
  if (firstCard === undefined) {
    throw new Error("Cannot determine winner: no cards played");
  }
  const ledSuit = firstCard.card.suit;

  const trumpCards = cards.filter((pc) => pc.card.suit === trumpSuit);

  if (trumpCards.length > 0) {
    // Highest trump wins
    let winner = trumpCards[0];
    if (winner === undefined) {
      throw new Error("Trump cards array invariant violated");
    }
    for (let i = 1; i < trumpCards.length; i++) {
      const current = trumpCards[i];
      if (current === undefined) {
        throw new Error("Trump cards array invariant violated");
      }
      if (getCardRankOrder(current.card, trumpSuit) > getCardRankOrder(winner.card, trumpSuit)) {
        winner = current;
      }
    }
    return winner.playerPosition;
  }

  // No trump — highest card of led suit wins
  const ledSuitCards = cards.filter((pc) => pc.card.suit === ledSuit);
  let winner = ledSuitCards[0];
  if (winner === undefined) {
    throw new Error("Led suit cards array invariant violated");
  }
  for (let i = 1; i < ledSuitCards.length; i++) {
    const current = ledSuitCards[i];
    if (current === undefined) {
      throw new Error("Led suit cards array invariant violated");
    }
    if (getCardRankOrder(current.card, null) > getCardRankOrder(winner.card, null)) {
      winner = current;
    }
  }
  return winner.playerPosition;
}

// ── Public Winner API ──

export function getTrickWinner(trick: Trick): PlayerPosition {
  if (trick.state !== "completed") {
    throw new Error(
      `Cannot determine winner: trick state is "${trick.state}", expected "completed"`,
    );
  }

  if (trick.winnerPosition === null) {
    throw new Error("Trick is completed but winner position is null (invariant violation)");
  }

  return trick.winnerPosition;
}

// ── State Transition ──

export function playCard(
  trick: Trick,
  card: Card,
  playerPosition: PlayerPosition,
  playerHand: readonly Card[],
): Trick {
  if (!isValidPlay(trick, card, playerPosition, playerHand)) {
    throw new Error(
      `Invalid play: card=${card.suit}_${card.rank}, position=${String(playerPosition)}`,
    );
  }

  const newCards = [...trick.cards, Object.freeze({ card, playerPosition })];
  const isComplete = newCards.length === 4;

  let winnerPosition: PlayerPosition | null = null;
  if (isComplete) {
    winnerPosition = determineTrickWinner(newCards, trick.trumpSuit);
  }

  return Object.freeze({
    id: trick.id,
    leadingPlayerPosition: trick.leadingPlayerPosition,
    trumpSuit: trick.trumpSuit,
    cards: Object.freeze(newCards),
    state: (isComplete ? "completed" : "in_progress") as TrickState,
    winnerPosition,
  });
}

// ── Hand Management ──

export function removeCardFromHand(player: Player, card: Card): Player {
  const cardIndex = player.hand.findIndex((c) => c.id === card.id);
  if (cardIndex === -1) {
    throw new Error(`Card ${card.id} not found in player ${player.id}'s hand`);
  }

  const newHand = [...player.hand.slice(0, cardIndex), ...player.hand.slice(cardIndex + 1)];
  return setPlayerHand(player, newHand);
}
