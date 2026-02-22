import { describe, it, expect } from "vitest";
import type { PlayerPosition, Suit, Card, Contract, RoundPhase } from "@belote/core";
import type { GameEventListener, GameEvent, GameCommand } from "@belote/app";
import type { GameView, RoundSnapshot } from "../src/game-view.js";
import { GameController } from "../src/game-controller.js";
import type { GameSessionAccess, RenderTarget, InputSource } from "../src/game-controller.js";

// ====================================================================
// game-controller — event-driven bridge between GameSession and renderer.
// Subscribes to session events, rebuilds view, calls renderer.update().
// ====================================================================

// ---- Mock event factory ---------------------------------------------
// Centralizes the cast so individual tests stay type-safe.

function mockEvent(partial: Record<string, unknown> & { type: string }): GameEvent {
  return partial as unknown as GameEvent;
}

// ---- Mocks ----------------------------------------------------------

function createMockSession(): GameSessionAccess & {
  emit: (event: GameEvent) => void;
  setRound: (round: RoundSnapshot | null) => void;
  setScores: (scores: readonly [number, number]) => void;
  setGame: (game: { readonly teamScores: readonly [number, number] } | null) => void;
  listenerCount: () => number;
  dispatched: GameCommand[];
} {
  const listeners: GameEventListener[] = [];
  let currentRound: RoundSnapshot | null = null;
  let gameValue: { readonly teamScores: readonly [number, number] } | null = { teamScores: [0, 0] };
  const dispatched: GameCommand[] = [];

  return {
    on(listener: GameEventListener): () => void {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },
    dispatch(command: GameCommand): void {
      dispatched.push(command);
    },
    get currentRound(): RoundSnapshot | null {
      return currentRound;
    },
    get game(): { readonly teamScores: readonly [number, number] } | null {
      return gameValue;
    },
    emit(event: GameEvent): void {
      for (const l of listeners) l(event);
    },
    setRound(round: RoundSnapshot | null): void {
      currentRound = round;
    },
    setScores(scores: readonly [number, number]): void {
      gameValue = { teamScores: scores };
    },
    setGame(game: { readonly teamScores: readonly [number, number] } | null): void {
      gameValue = game;
    },
    listenerCount(): number {
      return listeners.length;
    },
    dispatched,
  };
}

function createMockRenderer(): RenderTarget & {
  calls: GameView[];
  lastView: () => GameView | undefined;
} {
  const calls: GameView[] = [];
  return {
    update(view: GameView): void {
      calls.push(view);
    },
    calls,
    lastView(): GameView | undefined {
      return calls[calls.length - 1];
    },
  };
}

function fakeCard(suit: Suit, rank: string): Card {
  return { id: `card-${suit}-${rank}`, suit, rank } as Card;
}

const PLAYER_NAMES: readonly [string, string, string, string] = ["You", "Ali", "Partner", "Omar"];

// ---- Shared round factories -----------------------------------------

function makeEmptyRound(phase: RoundPhase): RoundSnapshot {
  return {
    players: [
      { position: 0 as PlayerPosition, hand: [] },
      { position: 1 as PlayerPosition, hand: [] },
      { position: 2 as PlayerPosition, hand: [] },
      { position: 3 as PlayerPosition, hand: [] },
    ],
    contract: null,
    currentTrick: null,
    phase,
  };
}

function makeRoundWithCards(phase: RoundPhase): RoundSnapshot {
  return {
    players: [
      { position: 0 as PlayerPosition, hand: [fakeCard("spades", "ace")] },
      { position: 1 as PlayerPosition, hand: [fakeCard("clubs", "8")] },
      { position: 2 as PlayerPosition, hand: [fakeCard("hearts", "7")] },
      { position: 3 as PlayerPosition, hand: [fakeCard("diamonds", "9")] },
    ],
    contract: null,
    currentTrick: null,
    phase,
  };
}

// ====================================================================
// Lifecycle
// ====================================================================

describe("GameController lifecycle", () => {
  it("subscribes to session events on start", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    expect(session.listenerCount()).toBe(0);
    controller.start();
    expect(session.listenerCount()).toBe(1);
  });

  it("unsubscribes from session events on stop", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    controller.start();
    expect(session.listenerCount()).toBe(1);
    controller.stop();
    expect(session.listenerCount()).toBe(0);
  });

  it("renders initial view on start (idle state)", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    controller.start();
    expect(renderer.calls).toHaveLength(1);
    expect(renderer.lastView()?.phase).toBe("idle");
  });

  it("stop is idempotent (no error when called without start)", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    expect(() => {
      controller.stop();
    }).not.toThrow();
  });

  it("does not render after stop", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    controller.start();
    const countAfterStart = renderer.calls.length;
    controller.stop();

    session.emit(mockEvent({ type: "game_started" }));

    expect(renderer.calls).toHaveLength(countAfterStart);
  });
});

// ====================================================================
// Event handling — renders after each event
// ====================================================================

describe("GameController event handling", () => {
  it("renders on each session event", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    controller.start();
    const startCount = renderer.calls.length; // 1 from initial render

    session.emit(mockEvent({ type: "game_started" }));

    expect(renderer.calls).toHaveLength(startCount + 1);
  });

  it("passes player names to view on idle render", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    controller.start();
    const view = renderer.lastView()!;
    expect(view.players).toHaveLength(4);
    expect(view.players[0]?.name).toBe("You");
    expect(view.players[1]?.name).toBe("Ali");
    expect(view.players[2]?.name).toBe("Partner");
    expect(view.players[3]?.name).toBe("Omar");
  });

  it("passes team scores from game", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setScores([120, 80]);
    controller.start();

    expect(renderer.lastView()?.scores).toEqual({ team1: 120, team2: 80 });
  });

  it("defaults scores to 0-0 when no game", () => {
    const session = createMockSession();
    session.setGame(null);
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    controller.start();
    expect(renderer.lastView()?.scores).toEqual({ team1: 0, team2: 0 });
  });
});

// ====================================================================
// Phase mapping
// ====================================================================

describe("GameController phase mapping", () => {
  it("maps bidding phase from round", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("bidding"));
    controller.start();

    expect(renderer.lastView()?.phase).toBe("bidding");
  });

  it("maps playing phase from round", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("playing"));
    controller.start();

    expect(renderer.lastView()?.phase).toBe("playing");
  });

  it("maps completed phase from round", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("completed"));
    controller.start();

    expect(renderer.lastView()?.phase).toBe("completed");
  });

  it("maps hand cards from human player (position 0)", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("playing"));
    controller.start();

    const view = renderer.lastView()!;
    expect(view.hand).toHaveLength(1);
    expect(view.hand[0]).toEqual({ suit: "spades", rank: "ace", playable: true });
  });

  it("maps opponent card counts", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("playing"));
    controller.start();

    const view = renderer.lastView()!;
    expect(view.opponents).toHaveLength(3);
    const west = view.opponents.find((o) => o.seat === "west");
    expect(west?.cardCount).toBe(1);
  });

  it("maps trump suit from contract", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    const round = makeRoundWithCards("playing");
    session.setRound({
      ...round,
      contract: { suit: "hearts" as Suit },
    });
    controller.start();

    expect(renderer.lastView()?.trumpSuit).toBe("hearts");
  });
});

// ====================================================================
// Active turn tracking
// ====================================================================

describe("GameController active turn tracking", () => {
  it("sets active turn on round_started (first bidder = dealer + 1)", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.start();

    session.emit(
      mockEvent({
        type: "round_started",
        roundNumber: 1,
        dealerPosition: 2,
      }),
    );

    // Dealer=2(north), first bidder=(2+1)%4=3(east)
    expect(renderer.lastView()?.activeSeat).toBe("east");
  });

  it("advances active turn on bid_placed", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.start();

    session.emit(
      mockEvent({
        type: "bid_placed",
        playerPosition: 1,
      }),
    );

    // After position 1 bids, next = (1+1)%4 = 2(north)
    expect(renderer.lastView()?.activeSeat).toBe("north");
  });

  it("sets first player after bidding_completed (dealer + 1)", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound({
      ...makeEmptyRound("playing"),
      contract: { suit: "spades" as Suit },
    });
    controller.start();

    // Set dealer first via round_started
    session.emit(
      mockEvent({
        type: "round_started",
        roundNumber: 1,
        dealerPosition: 0,
      }),
    );

    const contract: Contract = {
      id: "c1",
      suit: "spades",
      value: 80,
      bidderPosition: 1 as PlayerPosition,
      coincheLevel: 1,
    };
    session.emit(
      mockEvent({
        type: "bidding_completed",
        contract,
      }),
    );

    // Dealer=0, first player=(0+1)%4=1(west)
    expect(renderer.lastView()?.activeSeat).toBe("west");
  });

  it("advances active turn on card_played", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound({
      ...makeEmptyRound("playing"),
      contract: { suit: "spades" as Suit },
    });
    controller.start();

    session.emit(
      mockEvent({
        type: "card_played",
        card: fakeCard("spades", "ace"),
        playerPosition: 0,
      }),
    );

    // After position 0 plays, next = (0+1)%4 = 1(west)
    expect(renderer.lastView()?.activeSeat).toBe("west");
  });

  it("sets trick winner as active on trick_completed", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound({
      ...makeEmptyRound("playing"),
      contract: { suit: "spades" as Suit },
    });
    controller.start();

    session.emit(
      mockEvent({
        type: "trick_completed",
        winnerPosition: 2,
        trickNumber: 1,
      }),
    );

    // Winner = position 2 = north
    expect(renderer.lastView()?.activeSeat).toBe("north");
  });

  it("clears active turn on round_completed", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    // Need a round so activeSeat can be non-null
    session.setRound(makeEmptyRound("bidding"));
    controller.start();

    // Set an active turn first
    session.emit(
      mockEvent({
        type: "round_started",
        roundNumber: 1,
        dealerPosition: 0,
      }),
    );
    expect(renderer.lastView()?.activeSeat).not.toBeNull();

    // Round ends — clear the round too
    session.setRound(null);
    session.emit(mockEvent({ type: "round_completed" }));

    expect(renderer.lastView()?.activeSeat).toBeNull();
  });

  it("clears active turn on round_cancelled", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.start();

    session.emit(
      mockEvent({
        type: "round_started",
        roundNumber: 1,
        dealerPosition: 0,
      }),
    );

    session.emit(mockEvent({ type: "round_cancelled" }));

    expect(renderer.lastView()?.activeSeat).toBeNull();
  });

  it("clears active turn on game_completed", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.start();

    session.emit(
      mockEvent({
        type: "round_started",
        roundNumber: 1,
        dealerPosition: 0,
      }),
    );

    session.emit(
      mockEvent({
        type: "game_completed",
        winnerTeamIndex: 0,
        finalScores: [1000, 500],
      }),
    );

    expect(renderer.lastView()?.activeSeat).toBeNull();
  });
});

// ====================================================================
// View immutability
// ====================================================================

describe("GameController view immutability", () => {
  it("each render produces a frozen view", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    controller.start();
    const view = renderer.lastView()!;
    expect(Object.isFrozen(view)).toBe(true);
  });
});

// ====================================================================
// Input dispatch — UI actions → session commands
// ====================================================================

function createMockInput(): InputSource & {
  fireCardTap: (index: number, card: { suit: Suit; rank: string }) => void;
  fireSuitBid: (suit: Suit) => void;
  firePass: () => void;
} {
  let cardTapCb: ((index: number, card: { suit: Suit; rank: string }) => void) | null = null;
  let suitBidCb: ((suit: Suit) => void) | null = null;
  let passCb: (() => void) | null = null;

  return {
    onCardTap(callback: (index: number, card: { suit: Suit; rank: string }) => void): void {
      cardTapCb = callback;
    },
    onSuitBid(callback: (suit: Suit) => void): void {
      suitBidCb = callback;
    },
    onPass(callback: () => void): void {
      passCb = callback;
    },
    fireCardTap(index: number, card: { suit: Suit; rank: string }): void {
      cardTapCb?.(index, card);
    },
    fireSuitBid(suit: Suit): void {
      suitBidCb?.(suit);
    },
    firePass(): void {
      passCb?.();
    },
  };
}

describe("GameController input dispatch", () => {
  it("dispatches play_card command on card tap", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    // Round must have matching card in human hand (position 0)
    session.setRound(makeRoundWithCards("playing"));
    controller.wireInput(input);
    controller.start();

    const card = { suit: "spades" as Suit, rank: "ace" };
    input.fireCardTap(0, card);

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]?.type).toBe("play_card");
    expect(session.dispatched[0]).toMatchObject({
      type: "play_card",
      playerPosition: 0,
    });
  });

  it("dispatches play_card with full card (including id) from hand", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    // Set up round with known card in hand
    session.setRound(makeRoundWithCards("playing"));
    controller.wireInput(input);
    controller.start();

    const card = { suit: "spades" as Suit, rank: "ace" };
    input.fireCardTap(0, card);

    const cmd = session.dispatched[0];
    expect(cmd?.type).toBe("play_card");
    if (cmd?.type === "play_card") {
      expect(cmd.card.suit).toBe("spades");
      expect(cmd.card.rank).toBe("ace");
      expect(cmd.card.id).toBe("card-spades-ace");
    }
  });

  it("does not dispatch play_card when card not found in hand", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    // Round has spades-ace in hand but we tap hearts-jack
    session.setRound(makeRoundWithCards("playing"));
    controller.wireInput(input);
    controller.start();

    const card = { suit: "hearts" as Suit, rank: "jack" };
    input.fireCardTap(0, card);

    expect(session.dispatched).toHaveLength(0);
  });

  it("dispatches place_bid with suit on suit bid tap", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.wireInput(input);
    controller.start();

    input.fireSuitBid("hearts");

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]).toMatchObject({
      type: "place_bid",
      playerPosition: 0,
      bidType: "suit",
      suit: "hearts",
    });
  });

  it("dispatches place_bid with pass on pass tap", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.wireInput(input);
    controller.start();

    input.firePass();

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]).toMatchObject({
      type: "place_bid",
      playerPosition: 0,
      bidType: "pass",
    });
  });

  it("dispatches suit bid with value 80", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.wireInput(input);
    controller.start();

    input.fireSuitBid("diamonds");

    const cmd = session.dispatched[0];
    expect(cmd?.type).toBe("place_bid");
    if (cmd?.type === "place_bid") {
      expect(cmd.value).toBe(80);
    }
  });

  it("can wire input before start", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    controller.wireInput(input);
    session.setRound(makeEmptyRound("bidding"));
    input.firePass();

    expect(session.dispatched).toHaveLength(1);
  });
});

// ====================================================================
// Phase-gated input — commands only dispatch during valid phases
// ====================================================================

describe("GameController phase-gated input", () => {
  it("blocks play_card during bidding phase", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("bidding"));
    controller.wireInput(input);
    controller.start();

    input.fireCardTap(0, { suit: "spades" as Suit, rank: "ace" });

    expect(session.dispatched).toHaveLength(0);
  });

  it("blocks play_card during completed phase", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("completed"));
    controller.wireInput(input);
    controller.start();

    input.fireCardTap(0, { suit: "spades" as Suit, rank: "ace" });

    expect(session.dispatched).toHaveLength(0);
  });

  it("allows play_card during playing phase", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("playing"));
    controller.wireInput(input);
    controller.start();

    input.fireCardTap(0, { suit: "spades" as Suit, rank: "ace" });

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]?.type).toBe("play_card");
  });

  it("blocks suit bid during playing phase", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("playing"));
    controller.wireInput(input);
    controller.start();

    input.fireSuitBid("hearts");

    expect(session.dispatched).toHaveLength(0);
  });

  it("blocks pass during playing phase", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("playing"));
    controller.wireInput(input);
    controller.start();

    input.firePass();

    expect(session.dispatched).toHaveLength(0);
  });

  it("allows suit bid during bidding phase", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.wireInput(input);
    controller.start();

    input.fireSuitBid("hearts");

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]?.type).toBe("place_bid");
  });

  it("allows pass during bidding phase", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeEmptyRound("bidding"));
    controller.wireInput(input);
    controller.start();

    input.firePass();

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]?.type).toBe("place_bid");
  });

  it("blocks all input when no round exists (idle)", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    // No round set (null)
    controller.wireInput(input);
    controller.start();

    input.fireCardTap(0, { suit: "spades" as Suit, rank: "ace" });
    input.fireSuitBid("hearts");
    input.firePass();

    expect(session.dispatched).toHaveLength(0);
  });

  it("blocks all input during cancelled phase", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("cancelled"));
    controller.wireInput(input);
    controller.start();

    input.fireCardTap(0, { suit: "spades" as Suit, rank: "ace" });
    input.fireSuitBid("hearts");
    input.firePass();

    expect(session.dispatched).toHaveLength(0);
  });
});

// ====================================================================
// Human position parameterization
// ====================================================================

function makeRoundWithCardsAtPosition(phase: RoundPhase, position: PlayerPosition): RoundSnapshot {
  return {
    players: [
      { position: 0 as PlayerPosition, hand: position === 0 ? [fakeCard("spades", "ace")] : [] },
      { position: 1 as PlayerPosition, hand: position === 1 ? [fakeCard("spades", "ace")] : [] },
      { position: 2 as PlayerPosition, hand: position === 2 ? [fakeCard("spades", "ace")] : [] },
      { position: 3 as PlayerPosition, hand: position === 3 ? [fakeCard("spades", "ace")] : [] },
    ],
    contract: null,
    currentTrick: null,
    phase,
  };
}

describe("GameController humanPosition parameterization", () => {
  it("defaults humanPosition to 0 when not specified", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const controller = new GameController(session, renderer, PLAYER_NAMES);

    session.setRound(makeRoundWithCards("bidding"));
    controller.wireInput(input);
    controller.start();

    input.firePass();

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]).toMatchObject({
      type: "place_bid",
      playerPosition: 0,
    });
  });

  it("dispatches play_card with custom humanPosition", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const humanPos = 2 as PlayerPosition;
    const controller = new GameController(session, renderer, PLAYER_NAMES, humanPos);

    session.setRound(makeRoundWithCardsAtPosition("playing", humanPos));
    controller.wireInput(input);
    controller.start();

    input.fireCardTap(0, { suit: "spades" as Suit, rank: "ace" });

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]).toMatchObject({
      type: "play_card",
      playerPosition: 2,
    });
  });

  it("dispatches suit bid with custom humanPosition", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const humanPos = 3 as PlayerPosition;
    const controller = new GameController(session, renderer, PLAYER_NAMES, humanPos);

    session.setRound(makeEmptyRound("bidding"));
    controller.wireInput(input);
    controller.start();

    input.fireSuitBid("hearts");

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]).toMatchObject({
      type: "place_bid",
      playerPosition: 3,
      bidType: "suit",
      suit: "hearts",
    });
  });

  it("dispatches pass bid with custom humanPosition", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const humanPos = 1 as PlayerPosition;
    const controller = new GameController(session, renderer, PLAYER_NAMES, humanPos);

    session.setRound(makeEmptyRound("bidding"));
    controller.wireInput(input);
    controller.start();

    input.firePass();

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]).toMatchObject({
      type: "place_bid",
      playerPosition: 1,
      bidType: "pass",
    });
  });

  it("finds card in hand using custom humanPosition", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const humanPos = 2 as PlayerPosition;
    const controller = new GameController(session, renderer, PLAYER_NAMES, humanPos);

    // Card only in position 2's hand — position 0 has no cards
    session.setRound(makeRoundWithCardsAtPosition("playing", humanPos));
    controller.wireInput(input);
    controller.start();

    input.fireCardTap(0, { suit: "spades" as Suit, rank: "ace" });

    expect(session.dispatched).toHaveLength(1);
    expect(session.dispatched[0]?.type).toBe("play_card");
  });

  it("does not find card when it is in a different player hand", () => {
    const session = createMockSession();
    const renderer = createMockRenderer();
    const input = createMockInput();
    const humanPos = 2 as PlayerPosition;
    const controller = new GameController(session, renderer, PLAYER_NAMES, humanPos);

    // Card only in position 0's hand — human is at position 2
    session.setRound(makeRoundWithCardsAtPosition("playing", 0 as PlayerPosition));
    controller.wireInput(input);
    controller.start();

    input.fireCardTap(0, { suit: "spades" as Suit, rank: "ace" });

    expect(session.dispatched).toHaveLength(0);
  });
});
