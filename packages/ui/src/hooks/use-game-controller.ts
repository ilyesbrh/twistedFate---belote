// ====================================================================
// useGameController — React hook wrapping session subscription in
// useReducer/useEffect. Extracts turn-tracking into a pure reducer,
// returns GameView + phase-gated dispatch functions.
// This is the React equivalent of the imperative GameController class.
// ====================================================================

import { useReducer, useEffect, useCallback } from "react";
import type { PlayerPosition, Suit, RoundPhase } from "@belote/core";
import type { GameEvent } from "@belote/app";
import type { GameView } from "../game-view.js";
import { mapGameStateToView } from "../game-view.js";
import type { GameSessionAccess } from "../game-controller.js";

// ---- Types --------------------------------------------------------------

export interface ControllerState {
  readonly activeTurn: PlayerPosition | null;
  readonly dealerPosition: PlayerPosition | null;
  readonly epoch: number;
}

export interface UseGameControllerOptions {
  readonly session: GameSessionAccess;
  readonly playerNames: readonly [string, string, string, string];
  readonly humanPosition?: PlayerPosition;
}

export interface UseGameControllerResult {
  readonly view: GameView;
  readonly playCard: (suit: Suit, rank: string) => void;
  readonly placeBid: (suit: Suit) => void;
  readonly pass: () => void;
}

// ---- Constants ----------------------------------------------------------

export const INITIAL_CONTROLLER_STATE: ControllerState = {
  activeTurn: null,
  dealerPosition: null,
  epoch: 0,
};

// ---- Pure reducer -------------------------------------------------------

export function controllerReducer(state: ControllerState, event: GameEvent): ControllerState {
  const nextEpoch = state.epoch + 1;

  switch (event.type) {
    case "round_started":
      return {
        activeTurn: ((event.dealerPosition + 1) % 4) as PlayerPosition,
        dealerPosition: event.dealerPosition,
        epoch: nextEpoch,
      };

    case "bid_placed":
      return {
        ...state,
        activeTurn: ((event.playerPosition + 1) % 4) as PlayerPosition,
        epoch: nextEpoch,
      };

    case "bidding_completed":
      return {
        ...state,
        activeTurn:
          state.dealerPosition !== null
            ? (((state.dealerPosition + 1) % 4) as PlayerPosition)
            : null,
        epoch: nextEpoch,
      };

    case "card_played":
      return {
        ...state,
        activeTurn: ((event.playerPosition + 1) % 4) as PlayerPosition,
        epoch: nextEpoch,
      };

    case "trick_completed":
      return {
        ...state,
        activeTurn: event.winnerPosition,
        epoch: nextEpoch,
      };

    case "round_completed":
    case "round_cancelled":
    case "game_completed":
      return { ...state, activeTurn: null, epoch: nextEpoch };

    default:
      return { ...state, epoch: nextEpoch };
  }
}

// ---- Pure helpers -------------------------------------------------------

/** Build a GameView from session state + tracked turn position. */
export function buildGameView(
  session: GameSessionAccess,
  playerNames: readonly [string, string, string, string],
  activeTurn: PlayerPosition | null,
): GameView {
  return mapGameStateToView({
    round: session.currentRound,
    scores: session.game?.teamScores ?? [0, 0],
    playerNames,
    activeTurnPosition: activeTurn,
  });
}

/** Returns true when the current phase allows playing a card. */
export function canPlayCard(phase: RoundPhase | null): boolean {
  return phase === "playing";
}

/** Returns true when the current phase allows placing a bid. */
export function canBid(phase: RoundPhase | null): boolean {
  return phase === "bidding";
}

// ---- Hook ---------------------------------------------------------------

export function useGameController(options: UseGameControllerOptions): UseGameControllerResult {
  const { session, playerNames, humanPosition = 0 as PlayerPosition } = options;

  const [turnState, dispatchTurn] = useReducer(controllerReducer, INITIAL_CONTROLLER_STATE);

  // Subscribe to session events — each event updates turn tracking
  // and increments epoch to trigger a re-render (re-read session state).
  useEffect(() => {
    const unsub = session.on((event: GameEvent) => {
      dispatchTurn(event);
    });
    return unsub;
  }, [session]);

  // Build current view from session state + tracked turn
  const view = buildGameView(session, playerNames, turnState.activeTurn);

  // Phase-gated dispatch: play a card (only during "playing" phase)
  const playCard = useCallback(
    (suit: Suit, rank: string) => {
      if (!canPlayCard(session.currentRound?.phase ?? null)) return;
      const humanPlayer = session.currentRound?.players.find((p) => p.position === humanPosition);
      const card = humanPlayer?.hand.find((c) => c.suit === suit && c.rank === rank);
      if (!card) return;
      session.dispatch({
        type: "play_card",
        playerPosition: humanPosition,
        card,
      });
    },
    [session, humanPosition],
  );

  // Phase-gated dispatch: place a suit bid (only during "bidding" phase)
  const placeBid = useCallback(
    (suit: Suit) => {
      if (!canBid(session.currentRound?.phase ?? null)) return;
      session.dispatch({
        type: "place_bid",
        playerPosition: humanPosition,
        bidType: "suit",
        value: 80,
        suit,
      });
    },
    [session, humanPosition],
  );

  // Phase-gated dispatch: pass bid (only during "bidding" phase)
  const pass = useCallback(() => {
    if (!canBid(session.currentRound?.phase ?? null)) return;
    session.dispatch({
      type: "place_bid",
      playerPosition: humanPosition,
      bidType: "pass",
    });
  }, [session, humanPosition]);

  return { view, playCard, placeBid, pass };
}
