import type { Suit } from "./card.js";
import { getCardPoints } from "./card.js";
import type { PlayerPosition } from "./player.js";
import { isOnSameTeam } from "./player-helpers.js";
import type { Trick } from "./trick.js";
import type { Contract } from "./bid.js";

// ── Constants ──

export const LAST_TRICK_BONUS = 10;
export const BELOTE_BONUS = 20;
export const TOTAL_CARD_POINTS = 152;
export const TOTAL_ROUND_POINTS = 162;
export const FAILED_CONTRACT_POINTS = 160;

// ── Types ──

export interface TeamPoints {
  readonly contractingTeamPoints: number;
  readonly opponentTeamPoints: number;
}

export interface RoundScore {
  readonly contractingTeamPoints: number;
  readonly opponentTeamPoints: number;
  readonly contractingTeamRoundedPoints: number;
  readonly opponentTeamRoundedPoints: number;
  readonly contractMet: boolean;
  readonly contractingTeamScore: number;
  readonly opponentTeamScore: number;
  readonly beloteBonusTeam: "contracting" | "opponent" | null;
  readonly contractingTeamFinalScore: number;
  readonly opponentTeamFinalScore: number;
}

// ── Rounding helper ──

export function roundToNearestTen(points: number): number {
  return Math.floor(points / 10 + 0.5) * 10;
}

// ── calculateTrickPoints ──

export function calculateTrickPoints(trick: Trick, trumpSuit: Suit): number {
  if (trick.state !== "completed") {
    throw new Error(
      `Cannot calculate points: trick state is "${trick.state}", expected "completed"`,
    );
  }

  let total = 0;
  for (const pc of trick.cards) {
    total += getCardPoints(pc.card, trumpSuit);
  }
  return total;
}

// ── calculateRunningPoints ──

export function calculateRunningPoints(
  completedTricks: readonly Trick[],
  trumpSuit: Suit,
  bidderPosition: PlayerPosition,
): TeamPoints {
  let contractingTeamPoints = 0;
  let opponentTeamPoints = 0;
  for (const trick of completedTricks) {
    if (trick.state !== "completed") continue;
    const pts = calculateTrickPoints(trick, trumpSuit);
    if (trick.winnerPosition !== null && isOnSameTeam(trick.winnerPosition, bidderPosition)) {
      contractingTeamPoints += pts;
    } else {
      opponentTeamPoints += pts;
    }
  }
  return Object.freeze({ contractingTeamPoints, opponentTeamPoints });
}

// ── calculateTeamPoints ──

export function calculateTeamPoints(
  tricks: readonly Trick[],
  trumpSuit: Suit,
  bidderPosition: PlayerPosition,
): TeamPoints {
  if (tricks.length !== 8) {
    throw new Error(`Expected 8 tricks, got ${String(tricks.length)}`);
  }

  for (const trick of tricks) {
    if (trick.state !== "completed") {
      throw new Error(
        `Cannot calculate team points: trick state is "${trick.state}", expected "completed"`,
      );
    }
  }

  let contractingTeamPoints = 0;
  let opponentTeamPoints = 0;

  for (const trick of tricks) {
    const trickPoints = calculateTrickPoints(trick, trumpSuit);
    if (trick.winnerPosition !== null && isOnSameTeam(trick.winnerPosition, bidderPosition)) {
      contractingTeamPoints += trickPoints;
    } else {
      opponentTeamPoints += trickPoints;
    }
  }

  // Last trick bonus
  const lastTrick = tricks[7];
  if (lastTrick !== undefined && lastTrick.winnerPosition !== null) {
    if (isOnSameTeam(lastTrick.winnerPosition, bidderPosition)) {
      contractingTeamPoints += LAST_TRICK_BONUS;
    } else {
      opponentTeamPoints += LAST_TRICK_BONUS;
    }
  }

  return Object.freeze({ contractingTeamPoints, opponentTeamPoints });
}

// ── detectBeloteRebelote ──

export function detectBeloteRebelote(
  tricks: readonly Trick[],
  trumpSuit: Suit,
  bidderPosition: PlayerPosition,
): "contracting" | "opponent" | null {
  let kingPlayer: PlayerPosition | null = null;
  let queenPlayer: PlayerPosition | null = null;

  for (const trick of tricks) {
    for (const pc of trick.cards) {
      if (pc.card.suit === trumpSuit && pc.card.rank === "king") {
        kingPlayer = pc.playerPosition;
      }
      if (pc.card.suit === trumpSuit && pc.card.rank === "queen") {
        queenPlayer = pc.playerPosition;
      }
    }
  }

  if (kingPlayer === null || queenPlayer === null) {
    return null;
  }

  // Both must be on the same team
  if (!isOnSameTeam(kingPlayer, queenPlayer)) {
    return null;
  }

  // Determine which team
  if (isOnSameTeam(kingPlayer, bidderPosition)) {
    return "contracting";
  }
  return "opponent";
}

// ── calculateRoundScore ──

export function calculateRoundScore(tricks: readonly Trick[], contract: Contract): RoundScore {
  const { contractingTeamPoints, opponentTeamPoints } = calculateTeamPoints(
    tricks,
    contract.suit,
    contract.bidderPosition,
  );

  const contractingTeamRoundedPoints = roundToNearestTen(contractingTeamPoints);
  const opponentTeamRoundedPoints = roundToNearestTen(opponentTeamPoints);

  const beloteBonusTeam = detectBeloteRebelote(tricks, contract.suit, contract.bidderPosition);

  // Belote bonus counts toward meeting the contract.
  const contractingTotalWithBelote =
    contractingTeamRoundedPoints + (beloteBonusTeam === "contracting" ? BELOTE_BONUS : 0);

  const contractMet = contractingTotalWithBelote >= contract.value;

  let contractingTeamScore: number;
  let opponentTeamScore: number;

  if (contractMet) {
    if (contract.coincheLevel === 1) {
      contractingTeamScore = contractingTeamRoundedPoints;
      opponentTeamScore = opponentTeamRoundedPoints;
    } else {
      // Contré/surcontré success: winner takes a flat 160 × level, loser 0.
      contractingTeamScore = FAILED_CONTRACT_POINTS * contract.coincheLevel;
      opponentTeamScore = 0;
    }
  } else {
    contractingTeamScore = 0;
    opponentTeamScore = FAILED_CONTRACT_POINTS * contract.coincheLevel;
  }

  let contractingTeamFinalScore = contractingTeamScore;
  let opponentTeamFinalScore = opponentTeamScore;

  if (beloteBonusTeam === "contracting") {
    contractingTeamFinalScore += BELOTE_BONUS;
  } else if (beloteBonusTeam === "opponent") {
    opponentTeamFinalScore += BELOTE_BONUS;
  }

  return Object.freeze({
    contractingTeamPoints,
    opponentTeamPoints,
    contractingTeamRoundedPoints,
    opponentTeamRoundedPoints,
    contractMet,
    contractingTeamScore,
    opponentTeamScore,
    beloteBonusTeam,
    contractingTeamFinalScore,
    opponentTeamFinalScore,
  });
}
