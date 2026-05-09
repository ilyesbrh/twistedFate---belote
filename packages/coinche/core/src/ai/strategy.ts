import type { Card, ContractType, Suit } from "../models/card.js";
import {
  getCardPoints,
  getCardRankOrder,
  getCoincheCardPoints,
  TRUMP_POINTS,
} from "../models/card.js";
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

function chooseLeadCard(validPlays: readonly Card[], trumpSuit: Suit | null): Card {
  if (trumpSuit === null) {
    // SA: no trump — play highest-rank non-trump card
    const sorted = sortByRankAsc(validPlays, null);
    return lastElement(sorted);
  }

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

// ── Card Play: SA (sans-atout) ──

function chooseCardSA(
  validPlays: readonly Card[],
  trick: Trick,
  playerPosition: PlayerPosition,
): Card {
  // Leading
  if (trick.cards.length === 0) {
    // Play highest SA-point card when leading
    const sorted = [...validPlays].sort(
      (a, b) =>
        getCoincheCardPoints(b, null, "sans-atout") - getCoincheCardPoints(a, null, "sans-atout"),
    );
    return firstElement(sorted);
  }

  const partnerPosition = getPartnerPosition(playerPosition);
  const currentWinner = getCurrentTrickWinner(trick);
  const partnerIsWinning = currentWinner !== null && currentWinner === partnerPosition;

  if (partnerIsWinning) {
    // Play lowest-value card
    const sorted = [...validPlays].sort(
      (a, b) =>
        getCoincheCardPoints(a, null, "sans-atout") - getCoincheCardPoints(b, null, "sans-atout"),
    );
    return firstElement(sorted);
  }

  // Play highest SA-point card to win
  const sorted = [...validPlays].sort(
    (a, b) =>
      getCoincheCardPoints(b, null, "sans-atout") - getCoincheCardPoints(a, null, "sans-atout"),
  );
  return firstElement(sorted);
}

// ── Card Play: TA (tout-atout) ──

function chooseCardTA(
  validPlays: readonly Card[],
  trick: Trick,
  playerPosition: PlayerPosition,
): Card {
  // Leading
  if (trick.cards.length === 0) {
    // Play highest TRUMP_ORDER rank (each card ranks as if it's trump)
    const sorted = [...validPlays].sort(
      (a, b) => getCardRankOrder(b, b.suit) - getCardRankOrder(a, a.suit),
    );
    return firstElement(sorted);
  }

  const partnerPosition = getPartnerPosition(playerPosition);
  // For TA trick winner determination, use trump-rank of each card in its own suit
  const trickWinner = ((): PlayerPosition | null => {
    if (trick.cards.length === 0) return null;
    const first = trick.cards[0];
    if (first === undefined) return null;
    const ledSuit = first.card.suit;
    let best = first;
    for (let i = 1; i < trick.cards.length; i++) {
      const pc = trick.cards[i];
      if (pc === undefined) continue;
      const cr = getCardRankOrder(pc.card, pc.card.suit);
      const br = getCardRankOrder(best.card, best.card.suit);
      // In TA: highest rank in its own suit wins; if same, first (led) suit wins
      if (pc.card.suit === ledSuit) {
        if (cr > br) best = pc;
      } else if (best.card.suit !== ledSuit) {
        // Both off-led-suit: higher wins
        if (cr > br) best = pc;
      }
      // pc is off-led-suit and best is on-led-suit: best keeps winning
    }
    return best.playerPosition;
  })();

  const partnerIsWinning = trickWinner !== null && trickWinner === partnerPosition;

  if (partnerIsWinning) {
    // Play lowest-rank card
    const sorted = [...validPlays].sort(
      (a, b) => getCardRankOrder(a, a.suit) - getCardRankOrder(b, b.suit),
    );
    return firstElement(sorted);
  }

  // Play highest TRUMP_ORDER rank to win
  const sorted = [...validPlays].sort(
    (a, b) => getCardRankOrder(b, b.suit) - getCardRankOrder(a, a.suit),
  );
  return firstElement(sorted);
}

// ── Public API: Card Play ──

export function chooseCard(
  hand: readonly Card[],
  trick: Trick,
  trumpSuit: Suit | null,
  contractType: ContractType,
  playerPosition: PlayerPosition,
): Card {
  const validPlays = getValidPlays(trick, playerPosition, hand);

  if (validPlays.length === 0) {
    throw new Error("No valid plays available (invariant violation)");
  }

  if (validPlays.length === 1) {
    return firstElement(validPlays);
  }

  // Dispatch by contract type
  if (contractType === "sans-atout") {
    return chooseCardSA(validPlays, trick, playerPosition);
  }

  if (contractType === "tout-atout") {
    return chooseCardTA(validPlays, trick, playerPosition);
  }

  // "suit" contract — existing logic
  const realTrump = trumpSuit as Suit; // contractType === "suit" guarantees non-null

  // Leading: first card in trick
  if (trick.cards.length === 0) {
    return chooseLeadCard(validPlays, realTrump);
  }

  const firstCard = trick.cards[0];
  if (firstCard === undefined) {
    return firstElement(validPlays);
  }
  const ledSuit = firstCard.card.suit;

  // Following suit
  const suitCards = validPlays.filter((c) => c.suit === ledSuit);
  if (suitCards.length > 0) {
    return chooseFollowSuitCard(suitCards, trick, realTrump, playerPosition);
  }

  // Must trump
  const trumpCards = validPlays.filter((c) => c.suit === realTrump);
  if (trumpCards.length > 0) {
    return chooseTrumpCard(trumpCards, trick, realTrump);
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

  const contract = round.contract;
  const trumpSuit = contract.contractType === "suit" ? contract.suit : null;

  return chooseCard(
    player.hand,
    round.currentTrick,
    trumpSuit,
    contract.contractType,
    playerPosition,
  );
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
    minBidValue = 90 as BidValue;
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
  if (
    bestSuit === null ||
    minBidValue === null ||
    bestStrength < minBidValue * BID_STRENGTH_RATIO
  ) {
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
