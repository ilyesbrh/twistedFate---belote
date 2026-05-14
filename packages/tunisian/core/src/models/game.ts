import type { IdGenerator } from "../utils/id.js";
import type { Player, PlayerPosition, Team } from "./player.js";
import { getNextPlayerPosition, isOnSameTeam } from "./player-helpers.js";
import type { Round } from "./round.js";

// ── Constants ──

export const DEFAULT_TARGET_SCORE = 1000;

// ── Types ──

export type GameState = "in_progress" | "completed";

export interface Game {
  readonly id: string;
  readonly players: readonly [Player, Player, Player, Player];
  readonly teams: readonly [Team, Team];
  readonly targetScore: number;
  readonly rounds: readonly Round[];
  readonly teamScores: readonly [number, number];
  readonly currentDealerPosition: PlayerPosition;
  readonly state: GameState;
  readonly winnerTeamIndex: 0 | 1 | null;
}

// ── Factory ──

export function createGame(
  players: readonly [Player, Player, Player, Player],
  teams: readonly [Team, Team],
  targetScore: number,
  idGenerator: IdGenerator,
): Game {
  return Object.freeze({
    id: idGenerator.generateId("game"),
    players: Object.freeze([...players] as [Player, Player, Player, Player]),
    teams: Object.freeze([...teams] as [Team, Team]),
    targetScore,
    rounds: Object.freeze([]),
    teamScores: Object.freeze([0, 0] as [number, number]),
    currentDealerPosition: 0 as PlayerPosition,
    state: "in_progress" as const,
    winnerTeamIndex: null,
  });
}

// ── State Transitions ──

export function addCompletedRound(game: Game, round: Round): Game {
  if (game.state !== "in_progress") {
    throw new Error(`Cannot add round: game state is "${game.state}", not "in_progress"`);
  }

  if (round.phase !== "completed" && round.phase !== "cancelled") {
    throw new Error(
      `Cannot add round: round phase is "${round.phase}", expected "completed" or "cancelled"`,
    );
  }

  const newRounds = [...game.rounds, round];

  let newScore0 = game.teamScores[0];
  let newScore1 = game.teamScores[1];
  let newState: GameState = "in_progress";
  let winnerTeamIndex: 0 | 1 | null = null;

  // Only update scores and check win for completed rounds (cancelled rounds have no score)
  if (round.phase === "completed" && round.contract !== null && round.roundScore !== null) {
    const bidderIsTeam0 = isOnSameTeam(round.contract.bidderPosition, 0 as PlayerPosition);
    const contractingTeamIndex: 0 | 1 = bidderIsTeam0 ? 0 : 1;
    const opponentTeamIndex: 0 | 1 = bidderIsTeam0 ? 1 : 0;

    if (bidderIsTeam0) {
      newScore0 += round.roundScore.contractingTeamFinalScore;
      newScore1 += round.roundScore.opponentTeamFinalScore;
    } else {
      newScore1 += round.roundScore.contractingTeamFinalScore;
      newScore0 += round.roundScore.opponentTeamFinalScore;
    }

    // Check win condition — contracting team gets priority
    const scores = [newScore0, newScore1] as const;
    if (scores[contractingTeamIndex] >= game.targetScore) {
      newState = "completed";
      winnerTeamIndex = contractingTeamIndex;
    } else if (scores[opponentTeamIndex] >= game.targetScore) {
      newState = "completed";
      winnerTeamIndex = opponentTeamIndex;
    }
  }

  // Advance dealer
  const nextDealer = getNextPlayerPosition(game.currentDealerPosition);

  return Object.freeze({
    id: game.id,
    players: game.players,
    teams: game.teams,
    targetScore: game.targetScore,
    rounds: Object.freeze(newRounds),
    teamScores: Object.freeze([newScore0, newScore1] as [number, number]),
    currentDealerPosition: nextDealer,
    state: newState,
    winnerTeamIndex,
  });
}
