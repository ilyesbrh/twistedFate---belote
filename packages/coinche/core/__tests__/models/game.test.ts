import { describe, it, expect, beforeEach } from "vitest";
import { createIdGenerator } from "../../src/utils/id.js";
import type { IdGenerator } from "../../src/utils/id.js";
import { createPlayer, createTeam } from "../../src/models/player.js";
import type { Player, PlayerPosition, Team } from "../../src/models/player.js";
import type { RoundScore } from "../../src/models/scoring.js";
import type { Round, RoundPhase } from "../../src/models/round.js";
import type { BiddingRound, Contract } from "../../src/models/bid.js";
import { DEFAULT_TARGET_SCORE, createGame, addCompletedRound } from "../../src/models/game.js";
import type { Game } from "../../src/models/game.js";

// ==============================================================
// Test Helpers
// ==============================================================

let idGen: IdGenerator;

beforeEach(() => {
  idGen = createIdGenerator({ seed: 42 });
});

function makePlayers(): readonly [Player, Player, Player, Player] {
  return [
    createPlayer("North", 0, idGen),
    createPlayer("East", 1, idGen),
    createPlayer("South", 2, idGen),
    createPlayer("West", 3, idGen),
  ] as const;
}

function makeTeams(players: readonly [Player, Player, Player, Player]): readonly [Team, Team] {
  return [
    createTeam(players[0], players[2], idGen), // Team 0: positions 0, 2
    createTeam(players[1], players[3], idGen), // Team 1: positions 1, 3
  ] as const;
}

function makeGame(targetScore?: number): Game {
  const players = makePlayers();
  const teams = makeTeams(players);
  return createGame(players, teams, targetScore ?? DEFAULT_TARGET_SCORE, idGen);
}

/**
 * Builds a frozen Round in "completed" phase with the given scores.
 * This is a test-only helper — Game only reads round.phase, round.contract, round.roundScore.
 */
function makeCompletedRound(
  roundNumber: number,
  bidderPosition: PlayerPosition,
  contractingFinalScore: number,
  opponentFinalScore: number,
): Round {
  const roundScore: RoundScore = Object.freeze({
    contractingTeamPoints: contractingFinalScore,
    opponentTeamPoints: opponentFinalScore,
    contractMet: contractingFinalScore > 0,
    contractingTeamScore: contractingFinalScore,
    opponentTeamScore: opponentFinalScore,
    beloteBonusTeam: null,
    contractingTeamFinalScore: contractingFinalScore,
    opponentTeamFinalScore: opponentFinalScore,
  });

  const contract: Contract = Object.freeze({
    id: idGen.generateId("contract"),
    suit: "hearts" as const,
    value: 90 as const,
    bidderPosition,
    coincheLevel: 1 as const,
  });

  const fakeBiddingRound: BiddingRound = Object.freeze({
    id: idGen.generateId("bidding_round"),
    dealerPosition: 0 as PlayerPosition,
    bids: Object.freeze([]),
    currentPlayerPosition: 1 as PlayerPosition,
    state: "completed" as const,
    consecutivePasses: 3,
    highestBid: null,
    coinched: false,
    surcoinched: false,
  });

  return Object.freeze({
    id: idGen.generateId("round"),
    roundNumber,
    dealerPosition: 0 as PlayerPosition,
    players: Object.freeze(makePlayers()),
    biddingRound: fakeBiddingRound,
    contract,
    tricks: Object.freeze([]),
    currentTrick: null,
    roundScore,
    phase: "completed" as RoundPhase,
  });
}

/**
 * Builds a frozen Round in "cancelled" phase (all passed).
 */
function makeCancelledRound(roundNumber: number): Round {
  const fakeBiddingRound: BiddingRound = Object.freeze({
    id: idGen.generateId("bidding_round"),
    dealerPosition: 0 as PlayerPosition,
    bids: Object.freeze([]),
    currentPlayerPosition: 1 as PlayerPosition,
    state: "all_passed" as const,
    consecutivePasses: 4,
    highestBid: null,
    coinched: false,
    surcoinched: false,
  });

  return Object.freeze({
    id: idGen.generateId("round"),
    roundNumber,
    dealerPosition: 0 as PlayerPosition,
    players: Object.freeze(makePlayers()),
    biddingRound: fakeBiddingRound,
    contract: null,
    tricks: Object.freeze([]),
    currentTrick: null,
    roundScore: null,
    phase: "cancelled" as RoundPhase,
  });
}

// ==============================================================
// createGame
// ==============================================================

describe("createGame", () => {
  it("should set state to 'in_progress'", () => {
    const game = makeGame();
    expect(game.state).toBe("in_progress");
  });

  it("should store players and teams", () => {
    const players = makePlayers();
    const teams = makeTeams(players);
    const game = createGame(players, teams, 1000, idGen);
    expect(game.players).toHaveLength(4);
    expect(game.teams).toHaveLength(2);
  });

  it("should set the target score", () => {
    const game = makeGame(500);
    expect(game.targetScore).toBe(500);
  });

  it("should initialize teamScores to [0, 0], dealer to 0, winner to null", () => {
    const game = makeGame();
    expect(game.teamScores[0]).toBe(0);
    expect(game.teamScores[1]).toBe(0);
    expect(game.currentDealerPosition).toBe(0);
    expect(game.winnerTeamIndex).toBeNull();
  });

  it("should return a frozen Game", () => {
    const game = makeGame();
    expect(Object.isFrozen(game)).toBe(true);
    expect(Object.isFrozen(game.players)).toBe(true);
    expect(Object.isFrozen(game.teams)).toBe(true);
    expect(Object.isFrozen(game.rounds)).toBe(true);
    expect(Object.isFrozen(game.teamScores)).toBe(true);
  });
});

// ==============================================================
// addCompletedRound
// ==============================================================

describe("addCompletedRound", () => {
  it("should add the completed round to the rounds array", () => {
    const game = makeGame();
    const round = makeCompletedRound(1, 0, 100, 62);
    const updated = addCompletedRound(game, round);
    expect(updated.rounds).toHaveLength(1);
  });

  it("should update team 0 score when bidder is on team 0 (position 0)", () => {
    const game = makeGame();
    // Bidder at position 0 → team 0 is contracting
    const round = makeCompletedRound(1, 0, 100, 62);
    const updated = addCompletedRound(game, round);
    expect(updated.teamScores[0]).toBe(100); // contracting score
    expect(updated.teamScores[1]).toBe(62); // opponent score
  });

  it("should update team 1 score when bidder is on team 1 (position 1)", () => {
    const game = makeGame();
    // Bidder at position 1 → team 1 is contracting
    const round = makeCompletedRound(1, 1, 100, 62);
    const updated = addCompletedRound(game, round);
    expect(updated.teamScores[0]).toBe(62); // opponent score (team 0)
    expect(updated.teamScores[1]).toBe(100); // contracting score (team 1)
  });

  it("should accumulate scores across multiple rounds", () => {
    const game = makeGame();
    // Round 1: bidder at pos 0, contracting gets 100, opponent gets 62
    const r1 = makeCompletedRound(1, 0, 100, 62);
    const g1 = addCompletedRound(game, r1);
    // Round 2: bidder at pos 1, contracting gets 90, opponent gets 72
    const r2 = makeCompletedRound(2, 1, 90, 72);
    const g2 = addCompletedRound(g1, r2);
    // Team 0: 100 (as contracting) + 72 (as opponent) = 172
    // Team 1: 62 (as opponent) + 90 (as contracting) = 152
    expect(g2.teamScores[0]).toBe(172);
    expect(g2.teamScores[1]).toBe(152);
  });

  it("should not change scores for a cancelled round", () => {
    const game = makeGame();
    const round = makeCancelledRound(1);
    const updated = addCompletedRound(game, round);
    expect(updated.teamScores[0]).toBe(0);
    expect(updated.teamScores[1]).toBe(0);
    expect(updated.rounds).toHaveLength(1);
  });

  it("should advance the dealer position (0→1→2→3→0)", () => {
    let game = makeGame();
    expect(game.currentDealerPosition).toBe(0);

    game = addCompletedRound(game, makeCompletedRound(1, 0, 80, 82));
    expect(game.currentDealerPosition).toBe(1);

    game = addCompletedRound(game, makeCompletedRound(2, 1, 80, 82));
    expect(game.currentDealerPosition).toBe(2);

    game = addCompletedRound(game, makeCompletedRound(3, 2, 80, 82));
    expect(game.currentDealerPosition).toBe(3);

    game = addCompletedRound(game, makeCompletedRound(4, 3, 80, 82));
    expect(game.currentDealerPosition).toBe(0);
  });

  it("should throw if game is already completed", () => {
    let game = makeGame(100);
    // Win the game
    const round = makeCompletedRound(1, 0, 200, 0);
    game = addCompletedRound(game, round);
    expect(game.state).toBe("completed");

    // Try to add another round
    const round2 = makeCompletedRound(2, 0, 80, 82);
    expect(() => addCompletedRound(game, round2)).toThrow(/completed|not.*in_progress/i);
  });

  it("should throw if round is not completed or cancelled", () => {
    const game = makeGame();
    // Create a round that's still in bidding phase
    const fakeBiddingRound: BiddingRound = Object.freeze({
      id: idGen.generateId("bidding_round"),
      dealerPosition: 0 as PlayerPosition,
      bids: Object.freeze([]),
      currentPlayerPosition: 1 as PlayerPosition,
      state: "in_progress" as const,
      consecutivePasses: 0,
      highestBid: null,
      coinched: false,
      surcoinched: false,
    });
    const inProgressRound: Round = Object.freeze({
      id: idGen.generateId("round"),
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players: Object.freeze(makePlayers()),
      biddingRound: fakeBiddingRound,
      contract: null,
      tricks: Object.freeze([]),
      currentTrick: null,
      roundScore: null,
      phase: "bidding" as RoundPhase,
    });
    expect(() => addCompletedRound(game, inProgressRound)).toThrow(
      /not.*completed|cancelled|phase/i,
    );
  });

  it("should return a frozen Game", () => {
    const game = makeGame();
    const round = makeCompletedRound(1, 0, 100, 62);
    const updated = addCompletedRound(game, round);
    expect(Object.isFrozen(updated)).toBe(true);
    expect(Object.isFrozen(updated.rounds)).toBe(true);
    expect(Object.isFrozen(updated.teamScores)).toBe(true);
  });
});

// ==============================================================
// Win condition
// ==============================================================

describe("Win condition", () => {
  it("should detect team 0 winning when reaching the target score", () => {
    const game = makeGame(200);
    // Bidder at pos 0 (team 0 contracting), contracting gets 200
    const round = makeCompletedRound(1, 0, 200, 0);
    const updated = addCompletedRound(game, round);
    expect(updated.state).toBe("completed");
    expect(updated.winnerTeamIndex).toBe(0);
  });

  it("should detect team 1 winning when reaching the target score", () => {
    const game = makeGame(200);
    // Bidder at pos 1 (team 1 contracting), contracting gets 200
    const round = makeCompletedRound(1, 1, 200, 0);
    const updated = addCompletedRound(game, round);
    expect(updated.state).toBe("completed");
    expect(updated.winnerTeamIndex).toBe(1);
  });

  it("should not declare a winner if both teams are below target", () => {
    const game = makeGame(1000);
    const round = makeCompletedRound(1, 0, 100, 62);
    const updated = addCompletedRound(game, round);
    expect(updated.state).toBe("in_progress");
    expect(updated.winnerTeamIndex).toBeNull();
  });

  it("should count exact target score as a win", () => {
    const game = makeGame(100);
    const round = makeCompletedRound(1, 0, 100, 62);
    const updated = addCompletedRound(game, round);
    expect(updated.state).toBe("completed");
    expect(updated.winnerTeamIndex).toBe(0);
  });

  it("should give contracting team priority when both reach target", () => {
    // Both teams reach target in the same round
    // Contracting team should win (PO decision)
    const game = makeGame(100);
    // Bidder at pos 0 (team 0 is contracting), both get enough
    const round = makeCompletedRound(1, 0, 120, 150);
    const updated = addCompletedRound(game, round);
    expect(updated.state).toBe("completed");
    // Contracting team is team 0 (bidder at pos 0) → team 0 wins
    expect(updated.winnerTeamIndex).toBe(0);
  });
});

// ==============================================================
// DEFAULT_TARGET_SCORE
// ==============================================================

describe("DEFAULT_TARGET_SCORE", () => {
  it("should be 1000", () => {
    expect(DEFAULT_TARGET_SCORE).toBe(1000);
  });
});

// ==============================================================
// Integration
// ==============================================================

describe("Game integration", () => {
  it("should track a multi-round game to completion", () => {
    let game = makeGame(300);
    // Round 1: bidder at pos 0, team 0 gets 100
    game = addCompletedRound(game, makeCompletedRound(1, 0, 100, 62));
    expect(game.state).toBe("in_progress");
    expect(game.teamScores[0]).toBe(100);

    // Round 2: bidder at pos 1, team 1 gets 90
    game = addCompletedRound(game, makeCompletedRound(2, 1, 90, 72));
    expect(game.state).toBe("in_progress");
    expect(game.teamScores[0]).toBe(172); // 100 + 72
    expect(game.teamScores[1]).toBe(152); // 62 + 90

    // Round 3: bidder at pos 2 (team 0), team 0 gets 162 → 172+162=334 ≥ 300 → team 0 wins
    game = addCompletedRound(game, makeCompletedRound(3, 2, 162, 0));
    expect(game.state).toBe("completed");
    expect(game.winnerTeamIndex).toBe(0);
    expect(game.teamScores[0]).toBe(334);
  });

  it("should handle cancelled rounds interspersed with completed rounds", () => {
    let game = makeGame(200);

    // Round 1: cancelled (no score change)
    game = addCompletedRound(game, makeCancelledRound(1));
    expect(game.teamScores[0]).toBe(0);
    expect(game.teamScores[1]).toBe(0);
    expect(game.currentDealerPosition).toBe(1);

    // Round 2: completed
    game = addCompletedRound(game, makeCompletedRound(2, 0, 100, 62));
    expect(game.teamScores[0]).toBe(100);
    expect(game.currentDealerPosition).toBe(2);

    // Round 3: cancelled
    game = addCompletedRound(game, makeCancelledRound(3));
    expect(game.teamScores[0]).toBe(100);
    expect(game.currentDealerPosition).toBe(3);

    // Round 4: team 0 wins
    game = addCompletedRound(game, makeCompletedRound(4, 0, 162, 0));
    expect(game.state).toBe("completed");
    expect(game.winnerTeamIndex).toBe(0);
    expect(game.rounds).toHaveLength(4);
  });

  it("should rotate dealer correctly across 5+ rounds", () => {
    let game = makeGame(5000); // High target so game doesn't end
    for (let i = 0; i < 8; i++) {
      const expectedDealer = (i % 4) as PlayerPosition;
      expect(game.currentDealerPosition).toBe(expectedDealer);
      game = addCompletedRound(game, makeCompletedRound(i + 1, expectedDealer, 80, 82));
    }
    expect(game.rounds).toHaveLength(8);
    expect(game.currentDealerPosition).toBe(0); // Back to 0 after 8 rounds
  });
});
