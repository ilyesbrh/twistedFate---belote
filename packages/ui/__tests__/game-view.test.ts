import { describe, it, expect } from "vitest";
import {
  positionToSeat,
  seatToPosition,
  opponentOrientation,
  mapHandToView,
  mapTrickToView,
  mapGameStateToView,
} from "../src/game-view.js";
import type { GameView } from "../src/game-view.js";
import type { PlayerPosition, Card, Suit } from "@belote/core";
import type { Seat } from "../src/layout.js";

// ====================================================================
// game-view — pure state mapping from @belote/core → UI view model.
// No DOM access. No side effects. Fully unit-testable.
// ====================================================================

// ---- Helpers --------------------------------------------------------

function fakeCard(suit: Suit, rank: string): Card {
  return { id: `card-${suit}-${rank}`, suit, rank } as Card;
}

// ====================================================================
// positionToSeat — maps PlayerPosition (0-3) to Seat
// ====================================================================

describe("positionToSeat", () => {
  it("position 0 → south (human)", () => {
    expect(positionToSeat(0)).toBe("south");
  });

  it("position 1 → west (left opponent)", () => {
    expect(positionToSeat(1)).toBe("west");
  });

  it("position 2 → north (partner)", () => {
    expect(positionToSeat(2)).toBe("north");
  });

  it("position 3 → east (right opponent)", () => {
    expect(positionToSeat(3)).toBe("east");
  });
});

// ====================================================================
// seatToPosition — inverse mapping
// ====================================================================

describe("seatToPosition", () => {
  it("south → 0", () => {
    expect(seatToPosition("south")).toBe(0);
  });

  it("west → 1", () => {
    expect(seatToPosition("west")).toBe(1);
  });

  it("north → 2", () => {
    expect(seatToPosition("north")).toBe(2);
  });

  it("east → 3", () => {
    expect(seatToPosition("east")).toBe(3);
  });

  it("roundtrip: positionToSeat ∘ seatToPosition = identity", () => {
    const seats: Seat[] = ["south", "west", "north", "east"];
    for (const seat of seats) {
      expect(positionToSeat(seatToPosition(seat))).toBe(seat);
    }
  });
});

// ====================================================================
// opponentOrientation — which layout to use per seat
// ====================================================================

describe("opponentOrientation", () => {
  it("north → horizontal (top zone)", () => {
    expect(opponentOrientation("north")).toBe("horizontal");
  });

  it("west → vertical (left zone)", () => {
    expect(opponentOrientation("west")).toBe("vertical");
  });

  it("east → vertical (right zone)", () => {
    expect(opponentOrientation("east")).toBe("vertical");
  });
});

// ====================================================================
// mapHandToView — Card[] → HandCard[] (suit + rank only)
// ====================================================================

describe("mapHandToView", () => {
  it("maps cards preserving suit and rank", () => {
    const cards: Card[] = [fakeCard("spades", "ace"), fakeCard("hearts", "jack")];
    const result = mapHandToView(cards);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ suit: "spades", rank: "ace" });
    expect(result[1]).toEqual({ suit: "hearts", rank: "jack" });
  });

  it("returns empty array for empty hand", () => {
    expect(mapHandToView([])).toEqual([]);
  });
});

// ====================================================================
// mapTrickToView — current trick played cards → TrickCard[]
// ====================================================================

describe("mapTrickToView", () => {
  it("returns empty array for null trick", () => {
    expect(mapTrickToView(null)).toEqual([]);
  });

  it("maps played cards to seat positions", () => {
    const trick = {
      id: "t1",
      leadingPlayerPosition: 0 as PlayerPosition,
      trumpSuit: "hearts" as Suit,
      cards: [
        { card: fakeCard("spades", "ace"), playerPosition: 0 as PlayerPosition },
        { card: fakeCard("hearts", "jack"), playerPosition: 1 as PlayerPosition },
      ],
      state: "in_progress" as const,
      winnerPosition: null,
    };

    const result = mapTrickToView(trick);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      position: "south",
      suit: "spades",
      rank: "ace",
    });
    expect(result[1]).toEqual({
      position: "west",
      suit: "hearts",
      rank: "jack",
    });
  });

  it("maps all 4 players in a complete trick", () => {
    const trick = {
      id: "t2",
      leadingPlayerPosition: 2 as PlayerPosition,
      trumpSuit: "clubs" as Suit,
      cards: [
        { card: fakeCard("clubs", "7"), playerPosition: 2 as PlayerPosition },
        { card: fakeCard("clubs", "8"), playerPosition: 3 as PlayerPosition },
        { card: fakeCard("clubs", "9"), playerPosition: 0 as PlayerPosition },
        { card: fakeCard("clubs", "10"), playerPosition: 1 as PlayerPosition },
      ],
      state: "completed" as const,
      winnerPosition: 1 as PlayerPosition,
    };

    const result = mapTrickToView(trick);
    expect(result).toHaveLength(4);
    expect(result[0]?.position).toBe("north");
    expect(result[1]?.position).toBe("east");
    expect(result[2]?.position).toBe("south");
    expect(result[3]?.position).toBe("west");
  });
});

// ====================================================================
// mapGameStateToView — full state → GameView
// ====================================================================

describe("mapGameStateToView", () => {
  const basePlayers = [
    {
      id: "p0",
      name: "You",
      position: 0 as PlayerPosition,
      hand: [fakeCard("spades", "ace"), fakeCard("hearts", "7")],
    },
    {
      id: "p1",
      name: "Ali",
      position: 1 as PlayerPosition,
      hand: [fakeCard("clubs", "8"), fakeCard("diamonds", "9")],
    },
    {
      id: "p2",
      name: "Partner",
      position: 2 as PlayerPosition,
      hand: [fakeCard("spades", "king")],
    },
    {
      id: "p3",
      name: "Omar",
      position: 3 as PlayerPosition,
      hand: [fakeCard("hearts", "queen"), fakeCard("clubs", "10"), fakeCard("diamonds", "ace")],
    },
  ] as const;

  it("returns idle view when round is null", () => {
    const view = mapGameStateToView({
      round: null,
      scores: [0, 0],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: null,
    });

    expect(view.phase).toBe("idle");
    expect(view.hand).toEqual([]);
    expect(view.trick).toEqual([]);
    expect(view.trumpSuit).toBeNull();
    expect(view.activeSeat).toBeNull();
    expect(view.scores).toEqual({ team1: 0, team2: 0 });
  });

  it("maps playing phase correctly", () => {
    const round = {
      id: "r1",
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players: basePlayers,

      contract: {
        id: "c1",
        suit: "spades" as Suit,
        value: 80 as const,
        bidderPosition: 0 as PlayerPosition,
        coincheLevel: 1 as const,
      },
      tricks: [],
      currentTrick: null,
      roundScore: null,
      phase: "playing" as const,
    };

    const view = mapGameStateToView({
      round,
      scores: [120, 80],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: 0,
    });

    expect(view.phase).toBe("playing");
    expect(view.trumpSuit).toBe("spades");
    expect(view.activeSeat).toBe("south");
    expect(view.scores).toEqual({ team1: 120, team2: 80 });
  });

  it("maps human hand cards", () => {
    const round = {
      id: "r1",
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players: basePlayers,

      contract: null,
      tricks: [],
      currentTrick: null,
      roundScore: null,
      phase: "playing" as const,
    };

    const view = mapGameStateToView({
      round,
      scores: [0, 0],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: null,
    });

    expect(view.hand).toHaveLength(2);
    expect(view.hand[0]).toEqual({ suit: "spades", rank: "ace" });
    expect(view.hand[1]).toEqual({ suit: "hearts", rank: "7" });
  });

  it("maps opponent card counts", () => {
    const round = {
      id: "r1",
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players: basePlayers,

      contract: null,
      tricks: [],
      currentTrick: null,
      roundScore: null,
      phase: "playing" as const,
    };

    const view = mapGameStateToView({
      round,
      scores: [0, 0],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: null,
    });

    // west=Ali(2 cards), north=Partner(1 card), east=Omar(3 cards)
    expect(view.opponents).toHaveLength(3);
    const west = view.opponents.find((o) => o.seat === "west");
    const north = view.opponents.find((o) => o.seat === "north");
    const east = view.opponents.find((o) => o.seat === "east");
    expect(west?.cardCount).toBe(2);
    expect(west?.orientation).toBe("vertical");
    expect(north?.cardCount).toBe(1);
    expect(north?.orientation).toBe("horizontal");
    expect(east?.cardCount).toBe(3);
    expect(east?.orientation).toBe("vertical");
  });

  it("maps player info for all 4 seats", () => {
    const round = {
      id: "r1",
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players: basePlayers,

      contract: null,
      tricks: [],
      currentTrick: null,
      roundScore: null,
      phase: "playing" as const,
    };

    const view = mapGameStateToView({
      round,
      scores: [0, 0],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: 2,
    });

    expect(view.players).toHaveLength(4);
    const south = view.players.find((p) => p.seat === "south");
    const north = view.players.find((p) => p.seat === "north");
    expect(south?.name).toBe("You");
    expect(south?.cardCount).toBe(2);
    expect(south?.isActive).toBe(false);
    expect(north?.name).toBe("Partner");
    expect(north?.isActive).toBe(true);
  });

  it("maps bidding phase", () => {
    const round = {
      id: "r1",
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players: basePlayers,

      contract: null,
      tricks: [],
      currentTrick: null,
      roundScore: null,
      phase: "bidding" as const,
    };

    const view = mapGameStateToView({
      round,
      scores: [0, 0],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: 1,
    });

    expect(view.phase).toBe("bidding");
    expect(view.activeSeat).toBe("west");
  });

  it("maps current trick played cards", () => {
    const trick = {
      id: "t1",
      leadingPlayerPosition: 0 as PlayerPosition,
      trumpSuit: "spades" as Suit,
      cards: [{ card: fakeCard("spades", "ace"), playerPosition: 0 as PlayerPosition }],
      state: "in_progress" as const,
      winnerPosition: null,
    };

    const round = {
      id: "r1",
      roundNumber: 1,
      dealerPosition: 0 as PlayerPosition,
      players: basePlayers,

      contract: {
        id: "c1",
        suit: "spades" as Suit,
        value: 80 as const,
        bidderPosition: 0 as PlayerPosition,
        coincheLevel: 1 as const,
      },
      tricks: [],
      currentTrick: trick,
      roundScore: null,
      phase: "playing" as const,
    };

    const view = mapGameStateToView({
      round,
      scores: [0, 0],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: 1,
    });

    expect(view.trick).toHaveLength(1);
    expect(view.trick[0]).toEqual({
      position: "south",
      suit: "spades",
      rank: "ace",
    });
  });
});

// ====================================================================
// Immutability
// ====================================================================

describe("mapGameStateToView immutability", () => {
  it("returned view is frozen", () => {
    const view = mapGameStateToView({
      round: null,
      scores: [0, 0],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: null,
    });
    expect(Object.isFrozen(view)).toBe(true);
  });

  it("nested arrays are frozen", () => {
    const view = mapGameStateToView({
      round: null,
      scores: [0, 0],
      playerNames: ["You", "Ali", "Partner", "Omar"],
      activeTurnPosition: null,
    });
    expect(Object.isFrozen(view.hand)).toBe(true);
    expect(Object.isFrozen(view.opponents)).toBe(true);
    expect(Object.isFrozen(view.players)).toBe(true);
    expect(Object.isFrozen(view.trick)).toBe(true);
  });
});
