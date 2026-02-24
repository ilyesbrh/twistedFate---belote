import type { Card, Suit } from "../models/card.js";
import { getCardPoints, getCardRankOrder, TRUMP_POINTS } from "../models/card.js";
import { ALL_SUITS } from "../models/card.js";
import type { PlayerPosition } from "../models/player.js";
import type { Trick } from "../models/trick.js";
import { getValidPlays } from "../models/trick.js";
import type { Bid, BiddingRound } from "../models/bid.js";
import { BID_VALUES, createPassBid, createSuitBid } from "../models/bid.js";
import type { BidValue } from "../models/bid.js";
import type { Round } from "../models/round.js";
import type { IdGenerator } from "../utils/id.js";

// ── Constants ──

const TRUMP_LENGTH_BONUS = 5;
const ACE_SUPPORT_VALUE = 11;
/**
 * Ratio between hand-strength score and bid value for the AI to consider bidding.
 * evaluateHandForSuit returns ~50–110 for decent hands; bid values are 80–160.
 * 0.65 means: AI bids when strength >= 65% of the minimum bid value.
 * Example: opening at 80 requires strength >= 52 (a J+9+A hand scores ~60 → bids).
 */
const BID_STRENGTH_RATIO = 0.65;

// ── Hand Evaluation ──

export function evaluateHandForSuit(hand: readonly Card[], suit: Suit): number {
  let score = 0;
  let trumpCount = 0;

  for (const c of hand) {
    if (c.suit === suit) {
      score += TRUMP_POINTS[c.rank];
      trumpCount++;
    } else if (c.rank === "ace") {
      score += ACE_SUPPORT_VALUE;
    }
  }

  score += trumpCount * TRUMP_LENGTH_BONUS;
  return score;
}

// ── Private Helpers ──

function getPartnerPosition(pos: PlayerPosition): PlayerPosition {
  return ((pos + 2) % 4) as PlayerPosition;
}

function firstElement<T>(arr: readonly T[]): T {
  const el = arr[0];
  if (el === undefined) {
    throw new Error("Array is empty (invariant violation)");
  }
  return el;
}

function lastElement<T>(arr: readonly T[]): T {
  const el = arr[arr.length - 1];
  if (el === undefined) {
    throw new Error("Array is empty (invariant violation)");
  }
  return el;
}

/**
 * Determines the current winning player position in a partial trick.
 * Returns null if no cards have been played.
 */
function getCurrentTrickWinner(trick: Trick): PlayerPosition | null {
  if (trick.cards.length === 0) {
    return null;
  }

  const firstCard = trick.cards[0];
  if (firstCard === undefined) {
    return null;
  }
  const ledSuit = firstCard.card.suit;

  // Check for trump cards
  const trumpCards = trick.cards.filter((pc) => pc.card.suit === trick.trumpSuit);
  if (trumpCards.length > 0) {
    let best = trumpCards[0];
    if (best === undefined) {
      return null;
    }
    for (let i = 1; i < trumpCards.length; i++) {
      const current = trumpCards[i];
      if (current === undefined) {
        continue;
      }
      if (
        getCardRankOrder(current.card, trick.trumpSuit) >
        getCardRankOrder(best.card, trick.trumpSuit)
      ) {
        best = current;
      }
    }
    return best.playerPosition;
  }

  // No trump: highest of led suit wins
  const ledSuitCards = trick.cards.filter((pc) => pc.card.suit === ledSuit);
  let best = ledSuitCards[0];
  if (best === undefined) {
    return null;
  }
  for (let i = 1; i < ledSuitCards.length; i++) {
    const current = ledSuitCards[i];
    if (current === undefined) {
      continue;
    }
    if (getCardRankOrder(current.card, null) > getCardRankOrder(best.card, null)) {
      best = current;
    }
  }
  return best.playerPosition;
}

/**
 * Sort cards by value (ascending). For equal values, sort by rank order (ascending).
 */
function sortByValueAsc(cards: readonly Card[], trumpSuit: Suit | null): Card[] {
  return [...cards].sort((a, b) => {
    const pointsA = getCardPoints(a, trumpSuit);
    const pointsB = getCardPoints(b, trumpSuit);
    if (pointsA !== pointsB) {
      return pointsA - pointsB;
    }
    return getCardRankOrder(a, trumpSuit) - getCardRankOrder(b, trumpSuit);
  });
}

/**
 * Sort cards by rank order (ascending) within the context of a trump suit.
 */
function sortByRankAsc(cards: readonly Card[], trumpSuit: Suit | null): Card[] {
  return [...cards].sort((a, b) => getCardRankOrder(a, trumpSuit) - getCardRankOrder(b, trumpSuit));
}

// ── Card Play: Leading ──

function chooseLeadCard(validPlays: readonly Card[], trumpSuit: Suit): Card {
  // Separate trump and non-trump
  const nonTrump = validPlays.filter((c) => c.suit !== trumpSuit);

  if (nonTrump.length > 0) {
    // Play highest non-trump card (by rank order, non-trump ranking)
    const sorted = sortByRankAsc(nonTrump, null);
    return lastElement(sorted);
  }

  // All trump: play lowest trump
  const sorted = sortByRankAsc(validPlays, trumpSuit);
  return firstElement(sorted);
}

// ── Card Play: Following Suit ──

function chooseFollowSuitCard(
  suitCards: readonly Card[],
  trick: Trick,
  trumpSuit: Suit,
  playerPosition: PlayerPosition,
): Card {
  const firstCard = trick.cards[0];
  if (firstCard === undefined) {
    return firstElement(suitCards);
  }
  const ledSuit = firstCard.card.suit;

  // Check if partner is currently winning
  const partnerPosition = getPartnerPosition(playerPosition);
  const currentWinner = getCurrentTrickWinner(trick);
  const partnerIsWinning = currentWinner !== null && currentWinner === partnerPosition;

  // Check if trick can be won with a suit card (no trump on table)
  const hasTrumpOnTable = trick.cards.some((pc) => pc.card.suit === trumpSuit);

  if (partnerIsWinning && !hasTrumpOnTable) {
    // Partner is winning — play lowest suit card
    const sorted = sortByRankAsc(suitCards, null);
    return firstElement(sorted);
  }

  if (!hasTrumpOnTable || ledSuit === trumpSuit) {
    // Can potentially win with a suit card
    // Find the current highest card of the led suit
    const ledSuitOnTable = trick.cards.filter((pc) => pc.card.suit === ledSuit);
    let highestRank = -1;
    for (const pc of ledSuitOnTable) {
      const suitContext = ledSuit === trumpSuit ? trumpSuit : null;
      const rank = getCardRankOrder(pc.card, suitContext);
      if (rank > highestRank) {
        highestRank = rank;
      }
    }

    // Find cards that can beat the current highest
    const suitContext = ledSuit === trumpSuit ? trumpSuit : null;
    const winners = suitCards.filter((c) => getCardRankOrder(c, suitContext) > highestRank);

    if (winners.length > 0) {
      // Play cheapest winner (lowest rank that still wins)
      const sorted = sortByRankAsc(winners, suitContext);
      return firstElement(sorted);
    }
  }

  // Cannot win — play lowest card of suit
  const sorted = sortByRankAsc(suitCards, ledSuit === trumpSuit ? trumpSuit : null);
  return firstElement(sorted);
}

// ── Card Play: Trumping ──

function chooseTrumpCard(trumpCards: readonly Card[], trick: Trick, trumpSuit: Suit): Card {
  // Find highest trump on table
  const trumpsOnTable = trick.cards.filter((pc) => pc.card.suit === trumpSuit);

  if (trumpsOnTable.length === 0) {
    // No trump on table yet — play lowest trump
    const sorted = sortByRankAsc(trumpCards, trumpSuit);
    return firstElement(sorted);
  }

  let highestTrumpRank = -1;
  for (const pc of trumpsOnTable) {
    const rank = getCardRankOrder(pc.card, trumpSuit);
    if (rank > highestTrumpRank) {
      highestTrumpRank = rank;
    }
  }

  // Find trumps that can overtrump
  const winners = trumpCards.filter((c) => getCardRankOrder(c, trumpSuit) > highestTrumpRank);

  if (winners.length > 0) {
    // Play lowest winning trump (economy)
    const sorted = sortByRankAsc(winners, trumpSuit);
    return firstElement(sorted);
  }

  // Cannot overtrump — play lowest trump
  const sorted = sortByRankAsc(trumpCards, trumpSuit);
  return firstElement(sorted);
}

// ── Card Play: Discarding ──

function chooseDiscardCard(validPlays: readonly Card[]): Card {
  // Play lowest value card (using non-trump points since we're discarding)
  const sorted = sortByValueAsc(validPlays, null);
  return firstElement(sorted);
}

// ── Public API: Card Play ──

export function chooseCard(
  hand: readonly Card[],
  trick: Trick,
  trumpSuit: Suit,
  playerPosition: PlayerPosition,
): Card {
  const validPlays = getValidPlays(trick, playerPosition, hand);

  if (validPlays.length === 0) {
    throw new Error("No valid plays available (invariant violation)");
  }

  if (validPlays.length === 1) {
    return firstElement(validPlays);
  }

  // Leading: first card in trick
  if (trick.cards.length === 0) {
    return chooseLeadCard(validPlays, trumpSuit);
  }

  const firstCard = trick.cards[0];
  if (firstCard === undefined) {
    return firstElement(validPlays);
  }
  const ledSuit = firstCard.card.suit;

  // Following suit
  const suitCards = validPlays.filter((c) => c.suit === ledSuit);
  if (suitCards.length > 0) {
    return chooseFollowSuitCard(suitCards, trick, trumpSuit, playerPosition);
  }

  // Must trump
  const trumpCards = validPlays.filter((c) => c.suit === trumpSuit);
  if (trumpCards.length > 0) {
    return chooseTrumpCard(trumpCards, trick, trumpSuit);
  }

  // Discarding
  return chooseDiscardCard(validPlays);
}

// ── Public API: Card Play (Round wrapper) ──

export function chooseCardForRound(round: Round, playerPosition: PlayerPosition): Card {
  if (round.phase !== "playing") {
    throw new Error(`Cannot choose card: round phase is "${round.phase}", not "playing"`);
  }

  if (round.currentTrick === null || round.contract === null) {
    throw new Error("Cannot choose card: no current trick or contract");
  }

  const player = round.players.find((p) => p.position === playerPosition);
  if (player === undefined) {
    throw new Error(`No player at position ${String(playerPosition)}`);
  }

  return chooseCard(player.hand, round.currentTrick, round.contract.suit, playerPosition);
}

// ── Public API: Bidding ──

export function chooseBid(
  hand: readonly Card[],
  biddingRound: BiddingRound,
  playerPosition: PlayerPosition,
  idGenerator: IdGenerator,
): Bid {
  // Always pass if not in progress or coinched (simple AI doesn't surcoinche)
  if (biddingRound.state !== "in_progress" || biddingRound.coinched) {
    return createPassBid(playerPosition, idGenerator);
  }

  // Evaluate hand: find best suit
  let bestSuit: Suit | null = null;
  let bestStrength = 0;

  for (const suit of ALL_SUITS) {
    const strength = evaluateHandForSuit(hand, suit);
    if (strength > bestStrength) {
      bestStrength = strength;
      bestSuit = suit;
    }
  }

  // Determine minimum bid value
  const currentHighest = biddingRound.highestBid?.value ?? null;
  let minBidValue: BidValue | null = null;

  if (currentHighest === null) {
    minBidValue = 80 as BidValue;
  } else {
    // Find next value above current highest
    for (const v of BID_VALUES) {
      if (v > currentHighest) {
        minBidValue = v;
        break;
      }
    }
  }

  // Can't bid if no valid value or hand too weak for the required bid level
  if (bestSuit === null || minBidValue === null || bestStrength < minBidValue * BID_STRENGTH_RATIO) {
    return createPassBid(playerPosition, idGenerator);
  }

  // Find highest bid value we can support (but at least minBidValue)
  let bidValue: BidValue = minBidValue;
  for (const v of BID_VALUES) {
    if (v >= minBidValue && v <= bestStrength) {
      bidValue = v;
    }
  }

  return createSuitBid(playerPosition, bidValue, bestSuit, idGenerator);
}
