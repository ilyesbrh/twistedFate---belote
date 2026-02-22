// ====================================================================
// GameController — event-driven bridge between GameSession and renderer.
// Subscribes to session events, tracks active turn, rebuilds GameView,
// and pushes updates to the render target.
// Also wires UI input (card taps, bids) back to session commands.
// ====================================================================

import type { PlayerPosition, Suit, Card, RoundPhase } from "@belote/core";
import type { GameCommand, GameEvent, GameEventListener } from "@belote/app";
import type { GameView, RoundSnapshot } from "./game-view.js";
import { mapGameStateToView } from "./game-view.js";

// ---- Interfaces -----------------------------------------------------

/** Minimal session surface needed by the controller (decoupled from concrete GameSession). */
export interface GameSessionAccess {
  on(listener: GameEventListener): () => void;
  dispatch(command: GameCommand): void;
  readonly currentRound: RoundSnapshot | null;
  readonly game: { readonly teamScores: readonly [number, number] } | null;
}

/** Any object that can receive a GameView update. */
export interface RenderTarget {
  update(view: GameView): void;
}

/** Callback registration for UI interactions (decoupled from PixiJS). */
export interface InputSource {
  onCardTap(callback: (index: number, card: { suit: Suit; rank: string }) => void): void;
  onSuitBid(callback: (suit: Suit) => void): void;
  onPass(callback: () => void): void;
}

// ---- GameController -------------------------------------------------

export class GameController {
  private unsubscribe: (() => void) | null = null;
  private activeTurn: PlayerPosition | null = null;
  private dealerPosition: PlayerPosition | null = null;
  private readonly humanPosition: PlayerPosition;

  constructor(
    private readonly session: GameSessionAccess,
    private readonly renderer: RenderTarget,
    private readonly playerNames: readonly [string, string, string, string],
    humanPosition: PlayerPosition = 0 as PlayerPosition,
  ) {
    this.humanPosition = humanPosition;
  }

  /** Subscribe to session events and render the initial view. */
  start(): void {
    this.unsubscribe = this.session.on((event) => {
      this.handleEvent(event);
    });
    this.refresh();
  }

  /** Unsubscribe from session events. */
  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /** Wire UI input callbacks to session command dispatch. Phase-gated. */
  wireInput(input: InputSource): void {
    input.onCardTap((_index, card) => {
      if (this.currentPhase() !== "playing") return;
      const fullCard = this.findCardInHand(card.suit, card.rank);
      if (!fullCard) return;
      this.session.dispatch({
        type: "play_card",
        playerPosition: this.humanPosition,
        card: fullCard,
      });
    });

    input.onSuitBid((suit) => {
      if (this.currentPhase() !== "bidding") return;
      this.session.dispatch({
        type: "place_bid",
        playerPosition: this.humanPosition,
        bidType: "suit",
        value: 80,
        suit,
      });
    });

    input.onPass(() => {
      if (this.currentPhase() !== "bidding") return;
      this.session.dispatch({
        type: "place_bid",
        playerPosition: this.humanPosition,
        bidType: "pass",
      });
    });
  }

  // ---- Private helpers ------------------------------------------------

  private handleEvent(event: GameEvent): void {
    this.trackActiveTurn(event);
    this.refresh();
  }

  private trackActiveTurn(event: GameEvent): void {
    switch (event.type) {
      case "round_started":
        this.dealerPosition = event.dealerPosition;
        this.activeTurn = ((event.dealerPosition + 1) % 4) as PlayerPosition;
        break;

      case "bid_placed":
        this.activeTurn = ((event.playerPosition + 1) % 4) as PlayerPosition;
        break;

      case "bidding_completed":
        // In belote, the player after the dealer leads the first trick
        if (this.dealerPosition !== null) {
          this.activeTurn = ((this.dealerPosition + 1) % 4) as PlayerPosition;
        }
        break;

      case "card_played":
        this.activeTurn = ((event.playerPosition + 1) % 4) as PlayerPosition;
        break;

      case "trick_completed":
        this.activeTurn = event.winnerPosition;
        break;

      case "round_completed":
      case "round_cancelled":
      case "game_completed":
        this.activeTurn = null;
        break;
    }
  }

  private currentPhase(): RoundPhase | null {
    return this.session.currentRound?.phase ?? null;
  }

  private findCardInHand(suit: Suit, rank: string): Card | undefined {
    const round = this.session.currentRound;
    if (!round) return undefined;
    const humanPlayer = round.players.find((p) => p.position === this.humanPosition);
    if (!humanPlayer) return undefined;
    return humanPlayer.hand.find((c) => c.suit === suit && c.rank === rank);
  }

  private refresh(): void {
    const view = mapGameStateToView({
      round: this.session.currentRound,
      scores: this.session.game?.teamScores ?? [0, 0],
      playerNames: this.playerNames,
      activeTurnPosition: this.activeTurn,
    });
    this.renderer.update(view);
  }
}
