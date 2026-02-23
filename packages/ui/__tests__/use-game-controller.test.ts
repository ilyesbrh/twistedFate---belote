import { describe, it, expect, vi } from "vitest";
import type { PlayerPosition, Suit, RoundPhase } from "@belote/core";
import type { GameEvent } from "@belote/app";
import type { RoundSnapshot } from "../src/game-view.js";
import type { GameSessionAccess } from "../src/game-controller.js";

/**
 * useGameController — React hook wrapping session subscription in
 * useReducer/useEffect. Extracts turn-tracking into a pure reducer,
 * returns GameView + phase-gated dispatch functions.
 */

// ---- Mock helpers -------------------------------------------------------

function mockEvent(partial: Record<string, unknown> & { type: string }): GameEvent {
  return partial as unknown as GameEvent;
}

function makeSimpleSession(
  round: RoundSnapshot | null = null,
  scores: readonly [number, number] = [0, 0],
): GameSessionAccess {
  return {
    on: vi.fn(() => vi.fn()),
    dispatch: vi.fn(),
    get currentRound(): RoundSnapshot | null {
      return round;
    },
    get game(): { readonly teamScores: readonly [number, number] } | null {
      return { teamScores: scores };
    },
  };
}

function makeRound(phase: RoundPhase): RoundSnapshot {
  return {
    players: [
      { position: 0 as PlayerPosition, hand: [] },
      { position: 1 as PlayerPosition, hand: [] },
      { position: 2 as PlayerPosition, hand: [] },
      { position: 3 as PlayerPosition, hand: [] },
    ],
    contract: phase === "playing" ? { suit: "hearts" as Suit } : null,
    currentTrick: null,
    phase,
  };
}

const PLAYER_NAMES: readonly [string, string, string, string] = ["You", "West", "Partner", "East"];

// ====================================================================
// Exports
// ====================================================================

describe("useGameController exports", () => {
  it("exports all public API functions and constants", async () => {
    const mod = await import("../src/hooks/use-game-controller.js");
    expect(mod.useGameController).toBeTypeOf("function");
    expect(mod.controllerReducer).toBeTypeOf("function");
    expect(mod.buildGameView).toBeTypeOf("function");
    expect(mod.canPlayCard).toBeTypeOf("function");
    expect(mod.canBid).toBeTypeOf("function");
    expect(mod.INITIAL_CONTROLLER_STATE).toBeTypeOf("object");
  });
});

// ====================================================================
// controllerReducer — pure turn-tracking reducer
// ====================================================================

describe("controllerReducer", () => {
  it("initial state has null activeTurn, null dealerPosition, epoch 0", async () => {
    const { INITIAL_CONTROLLER_STATE } = await import("../src/hooks/use-game-controller.js");
    expect(INITIAL_CONTROLLER_STATE.activeTurn).toBeNull();
    expect(INITIAL_CONTROLLER_STATE.dealerPosition).toBeNull();
    expect(INITIAL_CONTROLLER_STATE.epoch).toBe(0);
  });

  it("round_started sets activeTurn to (dealer+1)%4 and stores dealerPosition", async () => {
    const { controllerReducer, INITIAL_CONTROLLER_STATE } =
      await import("../src/hooks/use-game-controller.js");
    const event = mockEvent({ type: "round_started", roundNumber: 1, dealerPosition: 2 });
    const next = controllerReducer(INITIAL_CONTROLLER_STATE, event);

    // dealer=2(north), first bidder=(2+1)%4=3(east)
    expect(next.activeTurn).toBe(3);
    expect(next.dealerPosition).toBe(2);
    expect(next.epoch).toBe(1);
  });

  it("bid_placed advances activeTurn to (player+1)%4", async () => {
    const { controllerReducer, INITIAL_CONTROLLER_STATE } =
      await import("../src/hooks/use-game-controller.js");
    const state = { ...INITIAL_CONTROLLER_STATE, activeTurn: 1 as PlayerPosition, epoch: 5 };
    const event = mockEvent({ type: "bid_placed", playerPosition: 1 });
    const next = controllerReducer(state, event);

    // After position 1 bids → (1+1)%4 = 2
    expect(next.activeTurn).toBe(2);
    expect(next.epoch).toBe(6);
  });

  it("bidding_completed sets activeTurn to (dealer+1)%4", async () => {
    const { controllerReducer } = await import("../src/hooks/use-game-controller.js");
    const state = {
      activeTurn: 3 as PlayerPosition,
      dealerPosition: 0 as PlayerPosition,
      epoch: 3,
    };
    const event = mockEvent({ type: "bidding_completed" });
    const next = controllerReducer(state, event);

    // dealer=0, first player=(0+1)%4=1
    expect(next.activeTurn).toBe(1);
    expect(next.epoch).toBe(4);
  });

  it("card_played advances activeTurn to (player+1)%4", async () => {
    const { controllerReducer, INITIAL_CONTROLLER_STATE } =
      await import("../src/hooks/use-game-controller.js");
    const state = { ...INITIAL_CONTROLLER_STATE, activeTurn: 0 as PlayerPosition, epoch: 2 };
    const event = mockEvent({ type: "card_played", playerPosition: 0 });
    const next = controllerReducer(state, event);

    // After position 0 plays → (0+1)%4 = 1
    expect(next.activeTurn).toBe(1);
    expect(next.epoch).toBe(3);
  });

  it("trick_completed sets activeTurn to winner", async () => {
    const { controllerReducer, INITIAL_CONTROLLER_STATE } =
      await import("../src/hooks/use-game-controller.js");
    const state = { ...INITIAL_CONTROLLER_STATE, activeTurn: 1 as PlayerPosition, epoch: 4 };
    const event = mockEvent({ type: "trick_completed", winnerPosition: 2, trickNumber: 1 });
    const next = controllerReducer(state, event);

    expect(next.activeTurn).toBe(2);
    expect(next.epoch).toBe(5);
  });

  it("clears activeTurn on round_completed, round_cancelled, game_completed", async () => {
    const { controllerReducer } = await import("../src/hooks/use-game-controller.js");
    const base = {
      activeTurn: 1 as PlayerPosition,
      dealerPosition: 0 as PlayerPosition,
      epoch: 10,
    };

    const afterRoundCompleted = controllerReducer(base, mockEvent({ type: "round_completed" }));
    expect(afterRoundCompleted.activeTurn).toBeNull();
    expect(afterRoundCompleted.epoch).toBe(11);

    const afterRoundCancelled = controllerReducer(base, mockEvent({ type: "round_cancelled" }));
    expect(afterRoundCancelled.activeTurn).toBeNull();

    const afterGameCompleted = controllerReducer(
      base,
      mockEvent({ type: "game_completed", winnerTeamIndex: 0, finalScores: [1000, 500] }),
    );
    expect(afterGameCompleted.activeTurn).toBeNull();
  });

  it("unknown event increments epoch without changing activeTurn", async () => {
    const { controllerReducer } = await import("../src/hooks/use-game-controller.js");
    const state = {
      activeTurn: 2 as PlayerPosition,
      dealerPosition: 1 as PlayerPosition,
      epoch: 7,
    };
    const event = mockEvent({ type: "game_started" });
    const next = controllerReducer(state, event);

    expect(next.activeTurn).toBe(2);
    expect(next.dealerPosition).toBe(1);
    expect(next.epoch).toBe(8);
  });
});

// ====================================================================
// buildGameView — pure view builder
// ====================================================================

describe("buildGameView", () => {
  it("returns idle view when session has no round", async () => {
    const { buildGameView } = await import("../src/hooks/use-game-controller.js");
    const session = makeSimpleSession(null, [0, 0]);
    const view = buildGameView(session, PLAYER_NAMES, null);

    expect(view.phase).toBe("idle");
    expect(view.players).toHaveLength(4);
    expect(view.hand).toHaveLength(0);
    expect(view.activeSeat).toBeNull();
  });

  it("returns playing phase with round data", async () => {
    const { buildGameView } = await import("../src/hooks/use-game-controller.js");
    const round = makeRound("playing");
    const session = makeSimpleSession(round, [40, 30]);
    const view = buildGameView(session, PLAYER_NAMES, 0 as PlayerPosition);

    expect(view.phase).toBe("playing");
    expect(view.trumpSuit).toBe("hearts");
    expect(view.activeSeat).toBe("south");
  });

  it("maps team scores from session", async () => {
    const { buildGameView } = await import("../src/hooks/use-game-controller.js");
    const session = makeSimpleSession(null, [120, 80]);
    const view = buildGameView(session, PLAYER_NAMES, null);

    expect(view.scores).toEqual({ team1: 120, team2: 80 });
  });
});

// ====================================================================
// canPlayCard / canBid — phase gate helpers
// ====================================================================

describe("canPlayCard / canBid", () => {
  it("canPlayCard returns true only for playing phase", async () => {
    const { canPlayCard } = await import("../src/hooks/use-game-controller.js");
    expect(canPlayCard("playing")).toBe(true);
    expect(canPlayCard("bidding")).toBe(false);
    expect(canPlayCard("completed")).toBe(false);
    expect(canPlayCard("cancelled")).toBe(false);
    expect(canPlayCard(null)).toBe(false);
  });

  it("canBid returns true only for bidding phase", async () => {
    const { canBid } = await import("../src/hooks/use-game-controller.js");
    expect(canBid("bidding")).toBe(true);
    expect(canBid("playing")).toBe(false);
    expect(canBid("completed")).toBe(false);
    expect(canBid("cancelled")).toBe(false);
    expect(canBid(null)).toBe(false);
  });
});
