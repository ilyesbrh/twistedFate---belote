// ====================================================================
// game-view — pure state mapping from @belote/core domain → UI view model.
// Maps PlayerPosition (0-3) to Seat, Round state to component data.
// No DOM access. No side effects. Fully unit-testable.
// ====================================================================

import { deepFreeze } from "./deep-freeze.js";
import type { PlayerPosition, Card, Suit, Trick } from "@belote/core";
import type { Seat } from "./layout.js";
import type { HandCard } from "./components/hand/hand-display.js";
import type { OpponentOrientation } from "./components/opponent-hand/opponent-layout.js";
import type { TrickCard } from "./components/trick/trick-display.js";

// ---- Types ----------------------------------------------------------

export interface PlayerView {
  readonly name: string;
  readonly seat: Seat;
  readonly isActive: boolean;
  readonly cardCount: number;
  readonly teamIndex: 0 | 1;
}

export interface OpponentView {
  readonly seat: Seat;
  readonly orientation: OpponentOrientation;
  readonly cardCount: number;
}

export type GamePhase = "idle" | "bidding" | "playing" | "completed";

export interface GameView {
  readonly players: readonly PlayerView[];
  readonly hand: readonly HandCard[];
  readonly opponents: readonly OpponentView[];
  readonly trick: readonly TrickCard[];
  readonly trumpSuit: Suit | null;
  readonly activeSeat: Seat | null;
  readonly scores: { readonly team1: number; readonly team2: number };
  readonly phase: GamePhase;
}

/** Minimal round shape consumed by the mapper (avoids importing full Round type). */
export interface RoundSnapshot {
  readonly players: readonly {
    readonly position: PlayerPosition;
    readonly hand: readonly Card[];
  }[];
  readonly contract: { readonly suit: Suit } | null;
  readonly currentTrick: Trick | null;
  readonly phase: string;
}

export interface GameStateInput {
  readonly round: RoundSnapshot | null;
  readonly scores: readonly [number, number];
  readonly playerNames: readonly [string, string, string, string];
  readonly activeTurnPosition: PlayerPosition | null;
}

// ---- Seat ↔ Position mappings ---------------------------------------

const POSITION_TO_SEAT: Record<PlayerPosition, Seat> = {
  0: "south",
  1: "west",
  2: "north",
  3: "east",
};

const SEAT_TO_POSITION: Record<Seat, PlayerPosition> = {
  south: 0,
  west: 1,
  north: 2,
  east: 3,
};

export function positionToSeat(position: PlayerPosition): Seat {
  return POSITION_TO_SEAT[position];
}

export function seatToPosition(seat: Seat): PlayerPosition {
  return SEAT_TO_POSITION[seat];
}

// ---- Opponent orientation -------------------------------------------

export function opponentOrientation(seat: Seat): OpponentOrientation {
  return seat === "north" ? "horizontal" : "vertical";
}

// ---- Card mapping ---------------------------------------------------

export function mapHandToView(cards: readonly Card[]): HandCard[] {
  return cards.map((c) => ({ suit: c.suit, rank: c.rank }));
}

export function mapTrickToView(trick: Trick | null): TrickCard[] {
  if (!trick) return [];
  return trick.cards.map((pc) => ({
    position: positionToSeat(pc.playerPosition),
    suit: pc.card.suit,
    rank: pc.card.rank,
  }));
}

// ---- Full state mapping ---------------------------------------------

export function mapGameStateToView(input: GameStateInput): GameView {
  const { round, scores, playerNames, activeTurnPosition } = input;

  if (!round) {
    return deepFreeze({
      players: playerNames.map((name, i) => ({
        name,
        seat: positionToSeat(i as PlayerPosition),
        isActive: false,
        cardCount: 0,
        teamIndex: i % 2 === 0 ? 0 : 1,
      })),
      hand: [],
      opponents: [
        { seat: "west" as Seat, orientation: "vertical" as OpponentOrientation, cardCount: 0 },
        { seat: "north" as Seat, orientation: "horizontal" as OpponentOrientation, cardCount: 0 },
        { seat: "east" as Seat, orientation: "vertical" as OpponentOrientation, cardCount: 0 },
      ],
      trick: [],
      trumpSuit: null,
      activeSeat: null,
      scores: { team1: scores[0], team2: scores[1] },
      phase: "idle" as GamePhase,
    });
  }

  // Map phase
  const phase: GamePhase =
    round.phase === "bidding"
      ? "bidding"
      : round.phase === "playing"
        ? "playing"
        : round.phase === "completed" || round.phase === "cancelled"
          ? "completed"
          : "idle";

  // Active seat
  const activeSeat = activeTurnPosition !== null ? positionToSeat(activeTurnPosition) : null;

  // Human hand (position 0)
  const humanPlayer = round.players.find((p) => p.position === 0);
  const hand = humanPlayer ? mapHandToView(humanPlayer.hand) : [];

  // Player info for all 4 seats
  const players: PlayerView[] = round.players.map((p) => ({
    name: playerNames[p.position],
    seat: positionToSeat(p.position),
    isActive: p.position === activeTurnPosition,
    cardCount: p.hand.length,
    teamIndex: p.position % 2 === 0 ? 0 : 1,
  }));

  // Opponents (everyone except position 0)
  const opponents: OpponentView[] = round.players
    .filter((p) => p.position !== 0)
    .map((p) => {
      const seat = positionToSeat(p.position);
      return {
        seat,
        orientation: opponentOrientation(seat),
        cardCount: p.hand.length,
      };
    });

  // Trick
  const trick = mapTrickToView(round.currentTrick);

  // Trump suit from contract
  const trumpSuit = round.contract?.suit ?? null;

  return deepFreeze({
    players,
    hand,
    opponents,
    trick,
    trumpSuit,
    activeSeat,
    scores: { team1: scores[0], team2: scores[1] },
    phase,
  });
}
