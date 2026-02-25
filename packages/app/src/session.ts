import type {
  BidValue,
  Card,
  Game,
  IdGenerator,
  Player,
  PlayerPosition,
  Round,
  Suit,
} from "@belote/core";
import {
  addCompletedRound,
  chooseBid,
  chooseCardForRound,
  createDeck,
  createGame,
  createIdGenerator,
  createPlayer,
  createRound,
  createTeam,
  shuffleDeck,
  placeBidInRound,
  playCardInRound,
  createPassBid,
  createSuitBid,
  createCoincheBid,
  createSurcoincheBid,
  getNextPlayerPosition,
} from "@belote/core";
import type { GameCommand, PlaceBidCommand, PlayCardCommand } from "./commands.js";
import type { GameEvent, GameEventListener } from "./events.js";

// Timer available in all JS runtimes (browser + Node), not in ES2022 lib.
declare function setTimeout(fn: () => void, ms: number): unknown;

// ── Session Configuration ──

export type PlayerType = "human" | "ai";

export interface SessionConfig {
  readonly playerTypes: readonly [PlayerType, PlayerType, PlayerType, PlayerType];
  readonly rng?: () => number;
  readonly idGenerator?: IdGenerator;
  /** Delay in ms between each game step (bid, card play). 0 = instant (default). */
  readonly stepDelayMs?: number;
}

// ── Session State ──

export type SessionState =
  | "idle"
  | "game_started"
  | "round_bidding"
  | "round_playing"
  | "round_completed"
  | "game_completed";

// ── GameSession ──

export class GameSession {
  private _state: SessionState = "idle";
  private _game: Game | null = null;
  private _currentRound: Round | null = null;
  private _roundNumber = 0;
  private readonly _listeners: GameEventListener[] = [];
  private readonly _idGenerator: IdGenerator;
  private readonly _rng: () => number;
  private readonly _playerTypes: readonly [PlayerType, PlayerType, PlayerType, PlayerType];
  private readonly _stepDelayMs: number;

  constructor(config: SessionConfig) {
    this._playerTypes = config.playerTypes;
    this._idGenerator = config.idGenerator ?? createIdGenerator();
    this._rng = config.rng ?? Math.random;
    this._stepDelayMs = config.stepDelayMs ?? 0;
  }

  // ── Getters ──

  get state(): SessionState {
    return this._state;
  }

  get game(): Game | null {
    return this._game;
  }

  get currentRound(): Round | null {
    return this._currentRound;
  }

  get roundNumber(): number {
    return this._roundNumber;
  }

  // ── Event Registration ──

  on(listener: GameEventListener): () => void {
    this._listeners.push(listener);
    return () => {
      const index = this._listeners.indexOf(listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
      }
    };
  }

  // ── Command Dispatch ──

  dispatch(command: GameCommand): void {
    switch (command.type) {
      case "start_game":
        this._handleStartGame(command.playerNames, command.targetScore);
        break;
      case "start_round":
        this._handleStartRound();
        break;
      case "place_bid":
        this._handlePlaceBid(command);
        break;
      case "play_card":
        this._handlePlayCard(command);
        break;
    }
  }

  // ── Private: Emit Event ──

  private _emit(event: GameEvent): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }

  // ── Private: Schedule next game step (instant or delayed) ──

  private _scheduleNext(fn: () => void): void {
    if (this._stepDelayMs <= 0) {
      fn();
    } else {
      setTimeout(() => {
        fn();
      }, this._stepDelayMs);
    }
  }

  // ── Private: Start Game ──

  private _handleStartGame(
    playerNames: readonly [string, string, string, string],
    targetScore: number,
  ): void {
    if (this._state !== "idle") {
      throw new Error(`Cannot start game: session state is "${this._state}", expected "idle"`);
    }

    const players: [Player, Player, Player, Player] = [
      createPlayer(playerNames[0], 0 as PlayerPosition, this._idGenerator),
      createPlayer(playerNames[1], 1 as PlayerPosition, this._idGenerator),
      createPlayer(playerNames[2], 2 as PlayerPosition, this._idGenerator),
      createPlayer(playerNames[3], 3 as PlayerPosition, this._idGenerator),
    ];

    const teams = [
      createTeam(players[0], players[2], this._idGenerator),
      createTeam(players[1], players[3], this._idGenerator),
    ] as const;

    this._game = createGame(players, teams, targetScore, this._idGenerator);
    this._state = "game_started";

    this._emit({
      type: "game_started",
      game: this._game,
      players: this._game.players,
      teams: this._game.teams,
    });
  }

  // ── Private: Start Round ──

  private _handleStartRound(): void {
    if (this._state !== "game_started" && this._state !== "round_completed") {
      throw new Error(
        `Cannot start round: session state is "${this._state}", expected "game_started" or "round_completed"`,
      );
    }

    if (this._game === null) {
      throw new Error("Cannot start round: no game (invariant violation)");
    }

    this._roundNumber++;

    const deck = createDeck(this._idGenerator);
    const shuffled = shuffleDeck(deck, this._rng);

    this._currentRound = createRound(
      this._roundNumber,
      this._game.currentDealerPosition,
      this._game.players,
      shuffled,
      this._idGenerator,
    );

    this._state = "round_bidding";

    this._emit({
      type: "round_started",
      round: this._currentRound,
      roundNumber: this._roundNumber,
      dealerPosition: this._game.currentDealerPosition,
    });

    // After round_started, wait longer for the initial step so the deal animation
    // finishes before the AI starts acting (deal animation is ~1s).
    if (this._stepDelayMs <= 0) {
      this._processNextBid();
    } else {
      const initialDelay = Math.max(this._stepDelayMs, 1500);
      setTimeout(() => {
        this._processNextBid();
      }, initialDelay);
    }
  }

  // ── Private: Place Bid ──

  private _handlePlaceBid(command: PlaceBidCommand): void {
    if (this._state !== "round_bidding") {
      throw new Error(
        `Cannot place bid: session state is "${this._state}", expected "round_bidding"`,
      );
    }

    if (this._currentRound === null) {
      throw new Error("Cannot place bid: no current round (invariant violation)");
    }

    const { playerPosition, bidType } = command;

    // Validate it's a human player's turn
    if (this._playerTypes[playerPosition] !== "human") {
      throw new Error(`Cannot place bid: position ${String(playerPosition)} is AI-controlled`);
    }

    const bid = this._createBid(playerPosition, bidType, command.value, command.suit);

    this._currentRound = placeBidInRound(this._currentRound, bid, this._idGenerator);

    this._emit({
      type: "bid_placed",
      bid,
      playerPosition,
    });

    // Schedule next step after human bid (delayed so UI shows the bid)
    this._scheduleNext(() => {
      this._afterBidding();
    });
  }

  // ── Private: Create Bid from command ──

  private _createBid(
    playerPosition: PlayerPosition,
    bidType: "pass" | "suit" | "coinche" | "surcoinche",
    value: BidValue | undefined,
    suit: Suit | undefined,
  ): ReturnType<typeof createPassBid> {
    switch (bidType) {
      case "pass":
        return createPassBid(playerPosition, this._idGenerator);
      case "suit": {
        if (value === undefined || suit === undefined) {
          throw new Error("Suit bid requires value and suit");
        }
        return createSuitBid(playerPosition, value, suit, this._idGenerator);
      }
      case "coinche":
        return createCoincheBid(playerPosition, this._idGenerator);
      case "surcoinche":
        return createSurcoincheBid(playerPosition, this._idGenerator);
    }
  }

  // ── Private: After Bidding Step ──

  private _afterBidding(): void {
    if (this._currentRound === null) {
      return;
    }

    if (this._currentRound.phase === "playing" && this._currentRound.contract !== null) {
      this._emit({
        type: "bidding_completed",
        contract: this._currentRound.contract,
      });
      this._state = "round_playing";
      // Schedule first card play (delayed so UI shows bidding→playing transition)
      this._scheduleNext(() => {
        this._processNextCard();
      });
      return;
    }

    if (this._currentRound.phase === "cancelled") {
      this._finishRound();
      return;
    }

    // Still bidding — process next bid
    this._processNextBid();
  }

  // ── Private: Process Next Bid (one step) ──

  private _processNextBid(): void {
    if (this._currentRound?.phase !== "bidding") return;

    const currentPos = this._currentRound.biddingRound.currentPlayerPosition;
    if (this._playerTypes[currentPos] !== "ai") return;

    // Execute one AI bid
    this._executeAiBid(currentPos);

    // Re-read round after mutation (phase may have changed)
    const round = this._currentRound as Round | null;
    if (round === null) return;

    if (round.phase === "playing" && round.contract !== null) {
      this._emit({ type: "bidding_completed", contract: round.contract });
      this._state = "round_playing";
      this._scheduleNext(() => {
        this._processNextCard();
      });
      return;
    }

    if (round.phase === "cancelled") {
      this._finishRound();
      return;
    }

    // Still bidding — schedule next bid step
    this._scheduleNext(() => {
      this._processNextBid();
    });
  }

  /** Execute a single AI bid. */
  private _executeAiBid(currentPos: PlayerPosition): void {
    if (this._currentRound === null) return;

    const player = this._currentRound.players.find((p) => p.position === currentPos);
    if (player === undefined) return;

    const bid = chooseBid(
      player.hand,
      this._currentRound.biddingRound,
      currentPos,
      this._idGenerator,
    );

    this._currentRound = placeBidInRound(this._currentRound, bid, this._idGenerator);

    this._emit({
      type: "bid_placed",
      bid,
      playerPosition: currentPos,
    });
  }

  // ── Private: Play Card (single card) ──

  private _playSingleCard(playerPosition: PlayerPosition, card: Card): void {
    if (this._currentRound === null) {
      return;
    }

    const tricksBefore = this._currentRound.tricks.length;

    this._currentRound = playCardInRound(
      this._currentRound,
      card,
      playerPosition,
      this._idGenerator,
    );

    this._emit({
      type: "card_played",
      card,
      playerPosition,
    });

    // Check if a new trick was just completed (tricks array grew)
    const tricksAfter = this._currentRound.tricks.length;
    if (tricksAfter > tricksBefore) {
      const completedTrick = this._currentRound.tricks[tricksAfter - 1];
      if (completedTrick !== undefined && completedTrick.winnerPosition !== null) {
        this._emit({
          type: "trick_completed",
          trick: completedTrick,
          winnerPosition: completedTrick.winnerPosition,
          trickNumber: tricksAfter,
        });
      }
    }
  }

  // ── Private: Play Card Command ──

  private _handlePlayCard(command: PlayCardCommand): void {
    if (this._state !== "round_playing") {
      throw new Error(
        `Cannot play card: session state is "${this._state}", expected "round_playing"`,
      );
    }

    if (this._currentRound === null) {
      throw new Error("Cannot play card: no current round (invariant violation)");
    }

    const { playerPosition, card } = command;

    // Validate it's a human player's turn
    if (this._playerTypes[playerPosition] !== "human") {
      throw new Error(`Cannot play card: position ${String(playerPosition)} is AI-controlled`);
    }

    this._playSingleCard(playerPosition, card);

    // Schedule next step after human card (delayed so UI shows the card)
    this._scheduleNext(() => {
      this._afterCardPlay();
    });
  }

  // ── Private: After Card Play ──

  private _afterCardPlay(): void {
    if (this._currentRound === null) {
      return;
    }

    // Check if round is completed
    if (this._currentRound.phase === "completed") {
      this._finishRound();
      return;
    }

    // More cards to play — process next card
    this._processNextCard();
  }

  // ── Private: Process Next Card (one step) ──

  private _processNextCard(): void {
    const pos = this._nextAiCardPlayer();
    if (pos === null || this._currentRound === null) {
      if (this._currentRound?.phase === "completed") {
        this._finishRound();
      }
      return;
    }

    const card = chooseCardForRound(this._currentRound, pos);
    this._playSingleCard(pos, card);

    // After playing, check if round completed
    if (this._currentRound.phase === "completed") {
      this._finishRound();
      return;
    }

    // Schedule next card step
    this._scheduleNext(() => {
      this._processNextCard();
    });
  }

  /** Return the next AI player position to act, or null if none. */
  private _nextAiCardPlayer(): PlayerPosition | null {
    if (this._currentRound?.phase !== "playing" || this._currentRound.currentTrick === null) {
      return null;
    }

    const trick = this._currentRound.currentTrick;
    let currentPos: PlayerPosition;

    if (trick.cards.length === 0) {
      currentPos = trick.leadingPlayerPosition;
    } else {
      const lastPlayed = trick.cards[trick.cards.length - 1];
      if (lastPlayed === undefined) return null;
      currentPos = getNextPlayerPosition(lastPlayed.playerPosition);
    }

    if (this._playerTypes[currentPos] !== "ai") return null;

    return currentPos;
  }

  // ── Private: Finish Round ──

  private _finishRound(): void {
    if (this._currentRound === null || this._game === null) {
      return;
    }

    if (this._currentRound.phase === "cancelled") {
      this._emit({
        type: "round_cancelled",
        round: this._currentRound,
      });

      this._game = addCompletedRound(this._game, this._currentRound);
      this._state = "round_completed";
      return;
    }

    if (this._currentRound.phase === "completed" && this._currentRound.roundScore !== null) {
      this._emit({
        type: "round_completed",
        round: this._currentRound,
        roundScore: this._currentRound.roundScore,
      });

      this._game = addCompletedRound(this._game, this._currentRound);

      if (this._game.state === "completed" && this._game.winnerTeamIndex !== null) {
        this._state = "game_completed";
        this._emit({
          type: "game_completed",
          game: this._game,
          winnerTeamIndex: this._game.winnerTeamIndex,
          finalScores: this._game.teamScores,
        });
      } else {
        this._state = "round_completed";
      }
    }
  }
}
