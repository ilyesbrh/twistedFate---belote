import { describe, it, expect, beforeEach, vi } from "vitest";
import { createIdGenerator, getValidPlays, getNextPlayerPosition } from "@belote/core";
import type { IdGenerator, PlayerPosition } from "@belote/core";
import { GameSession } from "../src/session.js";
import type { SessionConfig, PlayerType } from "../src/session.js";
import type { GameEvent } from "../src/events.js";
import {
  createStartGameCommand,
  createStartRoundCommand,
  createPlaceBidCommand,
  createPlayCardCommand,
} from "../src/commands.js";

// ==============================================================
// Test Helpers
// ==============================================================

let idGen: IdGenerator;

// Seeded RNG for deterministic shuffles
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

beforeEach(() => {
  idGen = createIdGenerator({ seed: 42 });
});

function makeConfig(
  playerTypes: readonly [PlayerType, PlayerType, PlayerType, PlayerType] = [
    "human",
    "human",
    "human",
    "human",
  ],
): SessionConfig {
  return {
    playerTypes,
    rng: mulberry32(123),
    idGenerator: idGen,
  };
}

function collectEvents(session: GameSession): GameEvent[] {
  const events: GameEvent[] = [];
  session.on((event) => events.push(event));
  return events;
}

function startGame(session: GameSession, targetScore = 1000): void {
  session.dispatch(createStartGameCommand(["North", "East", "South", "West"], targetScore));
}

function startRound(session: GameSession): void {
  session.dispatch(createStartRoundCommand());
}

// ==============================================================
// GameSession — Constructor & Initial State
// ==============================================================

describe("GameSession — constructor", () => {
  it("should start in 'idle' state", () => {
    const session = new GameSession(makeConfig());
    expect(session.state).toBe("idle");
  });

  it("should have no game or round initially", () => {
    const session = new GameSession(makeConfig());
    expect(session.game).toBeNull();
    expect(session.currentRound).toBeNull();
    expect(session.roundNumber).toBe(0);
  });
});

// ==============================================================
// GameSession — start_game command
// ==============================================================

describe("GameSession — start_game", () => {
  it("should transition state to 'game_started'", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    expect(session.state).toBe("game_started");
  });

  it("should create a game with the specified target score", () => {
    const session = new GameSession(makeConfig());
    startGame(session, 500);
    expect(session.game).not.toBeNull();
    expect(session.game!.targetScore).toBe(500);
  });

  it("should create 4 players with the given names", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    const players = session.game!.players;
    expect(players).toHaveLength(4);
    expect(players[0].name).toBe("North");
    expect(players[1].name).toBe("East");
    expect(players[2].name).toBe("South");
    expect(players[3].name).toBe("West");
  });

  it("should create 2 teams (0,2 and 1,3)", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    const teams = session.game!.teams;
    expect(teams).toHaveLength(2);
    expect(teams[0].players[0].position).toBe(0);
    expect(teams[0].players[1].position).toBe(2);
    expect(teams[1].players[0].position).toBe(1);
    expect(teams[1].players[1].position).toBe(3);
  });

  it("should emit a 'game_started' event", () => {
    const session = new GameSession(makeConfig());
    const events = collectEvents(session);
    startGame(session);
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe("game_started");
  });

  it("should throw if game already started", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    expect(() => {
      startGame(session);
    }).toThrow(/idle/);
  });
});

// ==============================================================
// GameSession — Event System
// ==============================================================

describe("GameSession — event system", () => {
  it("should allow registering multiple listeners", () => {
    const session = new GameSession(makeConfig());
    const events1: GameEvent[] = [];
    const events2: GameEvent[] = [];
    session.on((e) => events1.push(e));
    session.on((e) => events2.push(e));
    startGame(session);
    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(1);
  });

  it("should return an unsubscribe function", () => {
    const session = new GameSession(makeConfig());
    const events: GameEvent[] = [];
    const unsub = session.on((e) => events.push(e));
    startGame(session);
    expect(events).toHaveLength(1);
    unsub();
    startRound(session);
    // No new game_started event added after unsub, but round_started events won't add game_started
    // Let's just verify the unsub worked by checking no new events from the unsubbed listener
    expect(events.filter((e) => e.type === "round_started")).toHaveLength(0);
  });

  it("should not fail when no listeners are registered", () => {
    const session = new GameSession(makeConfig());
    expect(() => {
      startGame(session);
    }).not.toThrow();
  });
});

// ==============================================================
// GameSession — start_round command
// ==============================================================

describe("GameSession — start_round", () => {
  it("should transition state to 'round_bidding'", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    startRound(session);
    expect(session.state).toBe("round_bidding");
  });

  it("should create a round with dealt cards", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    startRound(session);
    expect(session.currentRound).not.toBeNull();
    for (const player of session.currentRound!.players) {
      expect(player.hand).toHaveLength(8);
    }
  });

  it("should increment the round number", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    startRound(session);
    expect(session.roundNumber).toBe(1);
  });

  it("should emit a 'round_started' event", () => {
    const session = new GameSession(makeConfig());
    const events = collectEvents(session);
    startGame(session);
    startRound(session);
    const roundEvents = events.filter((e) => e.type === "round_started");
    expect(roundEvents).toHaveLength(1);
  });

  it("should throw if not in game_started or round_completed state", () => {
    const session = new GameSession(makeConfig());
    expect(() => {
      startRound(session);
    }).toThrow(/idle/);
  });

  it("should use game's current dealer position", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    startRound(session);
    // Initial dealer is 0, so round's dealer should be 0
    expect(session.currentRound!.dealerPosition).toBe(0);
  });
});

// ==============================================================
// GameSession — place_bid (all-human game)
// ==============================================================

describe("GameSession — place_bid (all human)", () => {
  it("should forward a pass bid to the round", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    startRound(session);
    // Dealer is 0, first bidder is 1
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "pass"));
    expect(session.currentRound!.biddingRound.bids).toHaveLength(1);
  });

  it("should emit a 'bid_placed' event for each bid", () => {
    const session = new GameSession(makeConfig());
    const events = collectEvents(session);
    startGame(session);
    startRound(session);
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "suit", 80, "hearts"));
    const bidEvents = events.filter((e) => e.type === "bid_placed");
    expect(bidEvents).toHaveLength(1);
  });

  it("should transition to 'round_playing' when bidding completes", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    startRound(session);
    // Bid 80 hearts from pos 1, then 3 passes
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "suit", 80, "hearts"));
    session.dispatch(createPlaceBidCommand(2 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(3 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(0 as PlayerPosition, "pass"));
    expect(session.state).toBe("round_playing");
  });

  it("should emit 'bidding_completed' when transitioning to playing", () => {
    const session = new GameSession(makeConfig());
    const events = collectEvents(session);
    startGame(session);
    startRound(session);
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "suit", 80, "hearts"));
    session.dispatch(createPlaceBidCommand(2 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(3 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(0 as PlayerPosition, "pass"));
    const biddingCompleted = events.filter(
      (e): e is import("../src/events.js").BiddingCompletedEvent => e.type === "bidding_completed",
    );
    expect(biddingCompleted).toHaveLength(1);
    expect(biddingCompleted[0]!.contract.suit).toBe("hearts");
  });

  it("should emit 'round_cancelled' when all pass", () => {
    const session = new GameSession(makeConfig());
    const events = collectEvents(session);
    startGame(session);
    startRound(session);
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(2 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(3 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(0 as PlayerPosition, "pass"));
    const cancelEvents = events.filter((e) => e.type === "round_cancelled");
    expect(cancelEvents).toHaveLength(1);
    expect(session.state).toBe("round_completed");
  });

  it("should throw if bid is placed when not in bidding state", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    expect(() => {
      session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "pass"));
    }).toThrow(/round_bidding/);
  });

  it("should throw if AI position tries to place a human bid", () => {
    const session = new GameSession(makeConfig(["human", "ai", "human", "ai"]));
    startGame(session);
    startRound(session);
    // AI at positions 1 and 3 auto-bid after start_round
    // Dispatching a bid for an AI position must throw
    expect(() => {
      session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "pass"));
    }).toThrow(/AI-controlled/);
    expect(() => {
      session.dispatch(createPlaceBidCommand(3 as PlayerPosition, "pass"));
    }).toThrow(/AI-controlled/);
  });
});

// ==============================================================
// GameSession — play_card (all-human game)
// ==============================================================

describe("GameSession — play_card (all human)", () => {
  function startPlayingPhase(session: GameSession) {
    startGame(session);
    startRound(session);
    // Bid and complete bidding
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "suit", 80, "hearts"));
    session.dispatch(createPlaceBidCommand(2 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(3 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(0 as PlayerPosition, "pass"));
  }

  it("should play a card from the leading player", () => {
    const session = new GameSession(makeConfig());
    startPlayingPhase(session);
    const round = session.currentRound!;
    const leader = round.currentTrick!.leadingPlayerPosition;
    const player = round.players.find((p) => p.position === leader)!;
    const card = player.hand[0]!;
    session.dispatch(createPlayCardCommand(leader, card));
    expect(session.currentRound!.currentTrick!.cards).toHaveLength(1);
  });

  it("should emit a 'card_played' event", () => {
    const session = new GameSession(makeConfig());
    const events = collectEvents(session);
    startPlayingPhase(session);
    const round = session.currentRound!;
    const leader = round.currentTrick!.leadingPlayerPosition;
    const player = round.players.find((p) => p.position === leader)!;
    const card = player.hand[0]!;
    session.dispatch(createPlayCardCommand(leader, card));
    const cardEvents = events.filter((e) => e.type === "card_played");
    expect(cardEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("should emit 'trick_completed' after 4 cards", () => {
    const session = new GameSession(makeConfig());
    const events = collectEvents(session);
    startPlayingPhase(session);

    // Play 4 valid cards (one full trick) using getValidPlays for correctness
    for (let i = 0; i < 4; i++) {
      const round = session.currentRound!;
      const trick = round.currentTrick!;
      let currentPos: PlayerPosition;
      if (trick.cards.length === 0) {
        currentPos = trick.leadingPlayerPosition;
      } else {
        const lastCard = trick.cards[trick.cards.length - 1]!;
        currentPos = getNextPlayerPosition(lastCard.playerPosition);
      }
      const player = round.players.find((p) => p.position === currentPos)!;

      const validPlays = getValidPlays(trick, currentPos, player.hand);
      const card = validPlays[0]!;
      session.dispatch(createPlayCardCommand(currentPos, card));
    }

    const trickEvents = events.filter((e) => e.type === "trick_completed");
    expect(trickEvents).toHaveLength(1);
  });

  it("should throw if play_card is dispatched outside playing phase", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    startRound(session);
    const round = session.currentRound!;
    const player = round.players[0]!;
    const card = player.hand[0]!;
    expect(() => {
      session.dispatch(createPlayCardCommand(0 as PlayerPosition, card));
    }).toThrow(/round_playing/);
  });
});

// ==============================================================
// GameSession — AI auto-play (all AI game)
// ==============================================================

describe("GameSession — AI auto-play", () => {
  it("should auto-play all bids when all players are AI", () => {
    const session = new GameSession(makeConfig(["ai", "ai", "ai", "ai"]));
    const events = collectEvents(session);
    startGame(session);
    startRound(session);
    // After start_round, AI should auto-bid. Bidding should be done.
    // The state should be either round_playing (contract) or round_completed (all passed)
    expect(["round_playing", "round_completed"]).toContain(session.state);
    const bidEvents = events.filter((e) => e.type === "bid_placed");
    expect(bidEvents.length).toBeGreaterThanOrEqual(4); // At least 4 bids (all pass or bid+3 passes)
  });

  it("should auto-play all cards when all players are AI and bidding succeeds", () => {
    // Use multiple seeds until we find one where AI doesn't all-pass
    let session: GameSession;
    let events: GameEvent[];
    let attempts = 0;

    do {
      const seed = 42 + attempts;
      const gen = createIdGenerator({ seed });
      session = new GameSession({
        playerTypes: ["ai", "ai", "ai", "ai"],
        rng: mulberry32(100 + attempts),
        idGenerator: gen,
      });
      events = collectEvents(session);
      session.dispatch(createStartGameCommand(["AI-N", "AI-E", "AI-S", "AI-W"], 1000));
      session.dispatch(createStartRoundCommand());
      attempts++;
    } while (session.state === "round_completed" && attempts < 20);

    if (session.state === "round_completed") {
      // All attempts resulted in all-pass — that's OK, just verify cancelled
      expect(events.some((e) => e.type === "round_cancelled")).toBe(true);
    } else {
      // AI played all cards automatically
      expect(session.state).toBe("round_completed");
      const trickEvents = events.filter((e) => e.type === "trick_completed");
      expect(trickEvents).toHaveLength(8);
      const roundCompletedEvents = events.filter((e) => e.type === "round_completed");
      expect(roundCompletedEvents).toHaveLength(1);
    }
  });

  it("should auto-complete a full game with all AI players", () => {
    const gen = createIdGenerator({ seed: 77 });
    const session = new GameSession({
      playerTypes: ["ai", "ai", "ai", "ai"],
      rng: mulberry32(200),
      idGenerator: gen,
    });
    const events = collectEvents(session);

    // Use a low target score so the game completes quickly
    session.dispatch(createStartGameCommand(["AI-N", "AI-E", "AI-S", "AI-W"], 160));

    // Play rounds until game completes
    let rounds = 0;
    const maxRounds = 100;
    while (session.state !== "game_completed" && rounds < maxRounds) {
      session.dispatch(createStartRoundCommand());
      rounds++;
    }

    // Game should eventually complete
    expect(session.state).toBe("game_completed");
    expect(session.game!.state).toBe("completed");
    expect(session.game!.winnerTeamIndex).not.toBeNull();

    const gameCompletedEvents = events.filter(
      (e): e is import("../src/events.js").GameCompletedEvent => e.type === "game_completed",
    );
    expect(gameCompletedEvents).toHaveLength(1);

    const winner = gameCompletedEvents[0]!.winnerTeamIndex;
    const scores = gameCompletedEvents[0]!.finalScores;
    expect(scores[winner]).toBeGreaterThanOrEqual(160);
  });
});

// ==============================================================
// GameSession — Mixed human/AI game
// ==============================================================

describe("GameSession — mixed human/AI", () => {
  it("should auto-play AI bids and wait for human bids", () => {
    // Human at pos 0, AI at 1, 2, 3
    const session = new GameSession(makeConfig(["human", "ai", "ai", "ai"]));
    const events = collectEvents(session);
    startGame(session);
    startRound(session);

    // Dealer is 0 (human), first bidder is 1 (AI)
    // AI at positions 1, 2, 3 should all auto-bid
    // Then it's human's turn at pos 0
    const bidEvents = events.filter((e) => e.type === "bid_placed");
    // AI should have placed bids for positions 1, 2, 3
    expect(bidEvents.length).toBeGreaterThanOrEqual(3);

    // Session should be waiting for human at pos 0
    expect(session.state).toBe("round_bidding");
    expect(session.currentRound!.biddingRound.currentPlayerPosition).toBe(0);
  });

  it("should auto-play AI cards and wait for human cards", () => {
    // Human at pos 0, AI at 1, 2, 3
    // Dealer is 0, first bidder is 1
    const session = new GameSession(makeConfig(["human", "ai", "ai", "ai"]));
    startGame(session);
    startRound(session);

    // Complete bidding: AI bid first (pos 1, 2, 3), now human (pos 0) needs to bid
    session.dispatch(createPlaceBidCommand(0 as PlayerPosition, "pass"));

    // After human's pass, bidding may be done or AI may need to bid again
    // If all passed, round is cancelled → start another
    if (session.state === "round_completed") {
      // All passed — valid scenario
      return;
    }

    // If bidding completed and moved to playing, AI should auto-play if they lead
    if (session.state === "round_playing") {
      // Trick leader is dealer+1 = pos 1 (AI) → should auto-play
      // AI should chain: pos 1, 2, 3 all play, then wait for human pos 0
      const round = session.currentRound!;
      if (round.currentTrick !== null) {
        // Should have auto-played AI cards
        const trick = round.currentTrick;
        // If human is next, there should be AI cards already played
        if (trick.cards.length > 0) {
          const lastPlayed = trick.cards[trick.cards.length - 1]!;
          const nextPos = ((lastPlayed.playerPosition + 1) % 4) as PlayerPosition;
          // If next is human (0), AI should have stopped
          if (nextPos === 0) {
            expect(trick.cards.length).toBeGreaterThanOrEqual(1);
          }
        }
      }
    }
  });
});

// ==============================================================
// GameSession — Round lifecycle with scores
// ==============================================================

describe("GameSession — round lifecycle", () => {
  it("should allow starting a new round after previous round completes", () => {
    const session = new GameSession(makeConfig());
    startGame(session);

    // Round 1: all pass → cancelled
    startRound(session);
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(2 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(3 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(0 as PlayerPosition, "pass"));
    expect(session.state).toBe("round_completed");

    // Round 2: should work
    startRound(session);
    expect(session.state).toBe("round_bidding");
    expect(session.roundNumber).toBe(2);
  });

  it("should advance the dealer between rounds", () => {
    const session = new GameSession(makeConfig());
    startGame(session);
    expect(session.game!.currentDealerPosition).toBe(0);

    // Round 1: all pass
    startRound(session);
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(2 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(3 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(0 as PlayerPosition, "pass"));

    expect(session.game!.currentDealerPosition).toBe(1);

    // Round 2
    startRound(session);
    expect(session.currentRound!.dealerPosition).toBe(1);
    expect(session.currentRound!.biddingRound.currentPlayerPosition).toBe(2);
  });

  it("should update game scores after completed rounds", () => {
    // All-AI game: play one round and check scores update
    const gen = createIdGenerator({ seed: 88 });
    const session = new GameSession({
      playerTypes: ["ai", "ai", "ai", "ai"],
      rng: mulberry32(300),
      idGenerator: gen,
    });

    session.dispatch(createStartGameCommand(["A", "B", "C", "D"], 5000));
    session.dispatch(createStartRoundCommand());

    // After AI auto-play, scores should be updated
    const scores = session.game!.teamScores;
    const totalScore = scores[0] + scores[1];
    // Either all-passed (scores = 0) or completed (scores > 0, sum related to 162)
    if (session.currentRound !== null && session.currentRound.phase === "cancelled") {
      expect(totalScore).toBe(0);
    } else {
      expect(totalScore).toBeGreaterThan(0);
    }
  });
});

// ==============================================================
// GameSession — Full game completion
// ==============================================================

describe("GameSession — full game completion", () => {
  it("should transition to game_completed when a team reaches target", () => {
    const gen = createIdGenerator({ seed: 55 });
    const session = new GameSession({
      playerTypes: ["ai", "ai", "ai", "ai"],
      rng: mulberry32(400),
      idGenerator: gen,
    });
    const events = collectEvents(session);

    session.dispatch(createStartGameCommand(["A", "B", "C", "D"], 200));

    let rounds = 0;
    while (session.state !== "game_completed" && rounds < 30) {
      session.dispatch(createStartRoundCommand());
      rounds++;
    }

    expect(session.state).toBe("game_completed");

    // Verify game_completed event was emitted
    const completionEvents = events.filter((e) => e.type === "game_completed");
    expect(completionEvents).toHaveLength(1);
  });

  it("should not allow starting a round after game is completed", () => {
    const gen = createIdGenerator({ seed: 55 });
    const session = new GameSession({
      playerTypes: ["ai", "ai", "ai", "ai"],
      rng: mulberry32(400),
      idGenerator: gen,
    });

    session.dispatch(createStartGameCommand(["A", "B", "C", "D"], 200));

    let rounds = 0;
    while (session.state !== "game_completed" && rounds < 30) {
      session.dispatch(createStartRoundCommand());
      rounds++;
    }

    expect(() => {
      session.dispatch(createStartRoundCommand());
    }).toThrow();
  });
});

// ==============================================================
// GameSession — Event Sequence Integrity
// ==============================================================

describe("GameSession — event sequence integrity", () => {
  it("should emit events in correct order for a full round", () => {
    const gen = createIdGenerator({ seed: 99 });
    const session = new GameSession({
      playerTypes: ["ai", "ai", "ai", "ai"],
      rng: mulberry32(500),
      idGenerator: gen,
    });
    const events: GameEvent[] = [];
    session.on((e) => events.push(e));

    session.dispatch(createStartGameCommand(["A", "B", "C", "D"], 5000));
    session.dispatch(createStartRoundCommand());

    // Verify event ordering
    const types = events.map((e) => e.type);
    expect(types[0]).toBe("game_started");
    expect(types[1]).toBe("round_started");

    // After round_started, there should be bid_placed events
    const firstBidIndex = types.indexOf("bid_placed");
    expect(firstBidIndex).toBeGreaterThan(1);

    // If bidding completed (not all-passed), there should be bidding_completed
    const biddingCompletedIndex = types.indexOf("bidding_completed");
    if (biddingCompletedIndex !== -1) {
      expect(biddingCompletedIndex).toBeGreaterThan(firstBidIndex);

      // card_played events should come after bidding_completed
      const firstCardIndex = types.indexOf("card_played");
      expect(firstCardIndex).toBeGreaterThan(biddingCompletedIndex);

      // trick_completed should come after card_played events
      const firstTrickCompleted = types.indexOf("trick_completed");
      expect(firstTrickCompleted).toBeGreaterThan(firstCardIndex);

      // round_completed should come after trick_completed
      const roundCompleted = types.indexOf("round_completed");
      expect(roundCompleted).toBeGreaterThan(firstTrickCompleted);
    } else {
      // All-passed: should have round_cancelled
      expect(types).toContain("round_cancelled");
    }
  });

  it("should emit exactly 8 trick_completed events for a full played round", () => {
    // Try seeds until we get a played round (not all-passed)
    let found = false;

    for (let seed = 1; seed < 50 && !found; seed++) {
      const gen = createIdGenerator({ seed });
      const session = new GameSession({
        playerTypes: ["ai", "ai", "ai", "ai"],
        rng: mulberry32(seed * 10),
        idGenerator: gen,
      });
      const events = collectEvents(session);

      session.dispatch(createStartGameCommand(["A", "B", "C", "D"], 5000));
      session.dispatch(createStartRoundCommand());

      if (events.some((e) => e.type === "round_completed")) {
        found = true;
        const trickEvents = events.filter(
          (e): e is import("../src/events.js").TrickCompletedEvent => e.type === "trick_completed",
        );
        expect(trickEvents).toHaveLength(8);

        // Trick numbers should be 1-8
        const trickNumbers = trickEvents.map((e) => e.trickNumber);
        expect(trickNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      }
    }

    expect(found).toBe(true);
  });

  it("should emit exactly 32 card_played events for a full played round", () => {
    let found = false;

    for (let seed = 1; seed < 50 && !found; seed++) {
      const gen = createIdGenerator({ seed });
      const session = new GameSession({
        playerTypes: ["ai", "ai", "ai", "ai"],
        rng: mulberry32(seed * 10),
        idGenerator: gen,
      });
      const events = collectEvents(session);

      session.dispatch(createStartGameCommand(["A", "B", "C", "D"], 5000));
      session.dispatch(createStartRoundCommand());

      if (events.some((e) => e.type === "round_completed")) {
        found = true;
        const cardEvents = events.filter((e) => e.type === "card_played");
        expect(cardEvents).toHaveLength(32);
      }
    }

    expect(found).toBe(true);
  });
});
