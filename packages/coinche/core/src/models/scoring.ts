import type { ContractType, Suit } from "./card.js";
import { getCoincheCardPoints } from "./card.js";
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
  readonly announcementWinner: "ns" | "ew" | null;
  readonly announcementPoints: number;
}

// ── Rounding helper ──

export function roundToNearestTen(points: number): number {
  return Math.floor(points / 10 + 0.5) * 10;
}

// ── calculateTrickPoints ──

export function calculateTrickPoints(
  trick: Trick,
  trumpSuit: Suit | null,
  contractType: ContractType,
): number {
  if (trick.state !== "completed") {
    throw new Error(
      `Cannot calculate points: trick state is "${trick.state}", expected "completed"`,
    );
  }

  let total = 0;
  for (const pc of trick.cards) {
    total += getCoincheCardPoints(pc.card, trumpSuit, contractType);
  }
  return total;
}

// ── calculateRunningPoints ──

export function calculateRunningPoints(
  completedTricks: readonly Trick[],
  trumpSuit: Suit | null,
  contractType: ContractType,
  bidderPosition: PlayerPosition,
): TeamPoints {
  let contractingTeamPoints = 0;
  let opponentTeamPoints = 0;
  for (const trick of completedTricks) {
    if (trick.state !== "completed") continue;
    const pts = calculateTrickPoints(trick, trumpSuit, contractType);
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
  trumpSuit: Suit | null,
  contractType: ContractType,
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
    const trickPoints = calculateTrickPoints(trick, trumpSuit, contractType);
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

// ── contractingTeamWonAllTricks helper ──

function contractingTeamWonAllTricks(
  tricks: readonly Trick[],
  bidderPosition: PlayerPosition,
): boolean {
  return (
    tricks.length === 8 &&
    tricks.every((t) => t.winnerPosition !== null && isOnSameTeam(t.winnerPosition, bidderPosition))
  );
}

// ── calculateRoundScore ──

export function calculateRoundScore(
  tricks: readonly Trick[],
  contract: Contract,
  announcementWinner: "ns" | "ew" | null = null,
  announcementPoints: number = 0,
): RoundScore {
  const trumpSuit = contract.contractType === "suit" ? contract.suit : null;

  // Determine whether the contracting team is NS (positions 0 + 2) or EW (positions 1 + 3).
  const contractingIsNS = contract.bidderPosition === 0 || contract.bidderPosition === 2;

  /** Apply announcement bonus to the two mutable score totals. */
  function applyAnnouncementBonus(
    contracting: number,
    opponent: number,
  ): { contractingTeamFinalScore: number; opponentTeamFinalScore: number } {
    let c = contracting;
    let o = opponent;
    if (announcementWinner === "ns") {
      if (contractingIsNS) {
        c += announcementPoints;
      } else {
        o += announcementPoints;
      }
    } else if (announcementWinner === "ew") {
      if (!contractingIsNS) {
        c += announcementPoints;
      } else {
        o += announcementPoints;
      }
    }
    return { contractingTeamFinalScore: c, opponentTeamFinalScore: o };
  }

  // ── Announced capot scoring ──
  if (contract.isCapot) {
    const { contractingTeamPoints, opponentTeamPoints } = calculateTeamPoints(
      tricks,
      trumpSuit,
      contract.contractType,
      contract.bidderPosition,
    );

    const capotMade = contractingTeamWonAllTricks(tricks, contract.bidderPosition);
    const baseScore = 500;
    const multipliedScore = baseScore * contract.coincheLevel;

    const contractingTeamScore = capotMade ? multipliedScore : 0;
    const opponentTeamScore = capotMade ? 0 : multipliedScore;

    const beloteBonusTeam =
      trumpSuit !== null ? detectBeloteRebelote(tricks, trumpSuit, contract.bidderPosition) : null;

    let contractingTeamFinalScore =
      contractingTeamScore + (beloteBonusTeam === "contracting" ? BELOTE_BONUS : 0);
    let opponentTeamFinalScore =
      opponentTeamScore + (beloteBonusTeam === "opponent" ? BELOTE_BONUS : 0);

    ({ contractingTeamFinalScore, opponentTeamFinalScore } = applyAnnouncementBonus(
      contractingTeamFinalScore,
      opponentTeamFinalScore,
    ));

    return Object.freeze({
      contractingTeamPoints,
      opponentTeamPoints,
      contractingTeamRoundedPoints: roundToNearestTen(contractingTeamPoints),
      opponentTeamRoundedPoints: roundToNearestTen(opponentTeamPoints),
      contractMet: capotMade,
      contractingTeamScore,
      opponentTeamScore,
      beloteBonusTeam,
      contractingTeamFinalScore,
      opponentTeamFinalScore,
      announcementWinner,
      announcementPoints,
    });
  }

  // ── Regular contract scoring ──
  const { contractingTeamPoints, opponentTeamPoints } = calculateTeamPoints(
    tricks,
    trumpSuit,
    contract.contractType,
    contract.bidderPosition,
  );

  const contractingTeamRoundedPoints = roundToNearestTen(contractingTeamPoints);
  const opponentTeamRoundedPoints = roundToNearestTen(opponentTeamPoints);

  // Belote/rebelote only applies to suit contracts (requires a trump suit).
  const beloteBonusTeam =
    trumpSuit !== null ? detectBeloteRebelote(tricks, trumpSuit, contract.bidderPosition) : null;

  // Belote bonus counts toward meeting the contract.
  const contractingTotalWithBelote =
    contractingTeamRoundedPoints + (beloteBonusTeam === "contracting" ? BELOTE_BONUS : 0);

  const contractMet = contractingTotalWithBelote >= contract.value;

  let contractingTeamScore: number;
  let opponentTeamScore: number;

  // Coinche payout formula: (contract.value + 160) × level.
  const coinchePayout = (contract.value + FAILED_CONTRACT_POINTS) * contract.coincheLevel;

  if (contractMet) {
    if (contract.coincheLevel === 1) {
      // Unannounced capot bonus: bidder wins all 8 tricks → score = 250 + bid value
      if (contractingTeamWonAllTricks(tricks, contract.bidderPosition)) {
        contractingTeamScore = 250 + contract.value;
        opponentTeamScore = 0;
      } else {
        contractingTeamScore = contractingTeamRoundedPoints;
        opponentTeamScore = opponentTeamRoundedPoints;
      }
    } else {
      contractingTeamScore = coinchePayout;
      opponentTeamScore = 0;
    }
  } else {
    contractingTeamScore = 0;
    opponentTeamScore = coinchePayout;
  }

  let contractingTeamFinalScore = contractingTeamScore;
  let opponentTeamFinalScore = opponentTeamScore;

  if (beloteBonusTeam === "contracting") {
    contractingTeamFinalScore += BELOTE_BONUS;
  } else if (beloteBonusTeam === "opponent") {
    opponentTeamFinalScore += BELOTE_BONUS;
  }

  ({ contractingTeamFinalScore, opponentTeamFinalScore } = applyAnnouncementBonus(
    contractingTeamFinalScore,
    opponentTeamFinalScore,
  ));

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
    announcementWinner,
    announcementPoints,
  });
}
