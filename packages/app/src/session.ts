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

// ── Session Configuration ──

export type PlayerType = "human" | "ai";

export interface SessionConfig {
  readonly playerTypes: readonly [PlayerType, PlayerType, PlayerType, PlayerType];
  readonly rng?: () => number;
  readonly idGenerator?: IdGenerator;
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

  constructor(config: SessionConfig) {
    this._playerTypes = config.playerTypes;
    this._idGenerator = config.idGenerator ?? createIdGenerator();
    this._rng = config.rng ?? Math.random;
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

    // Auto-play AI bids if AI goes first
    this._processAiBids();
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

    this._afterBidding();
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
      // Auto-play AI cards if AI goes first
      this._processAiCards();
      return;
    }

    if (this._currentRound.phase === "cancelled") {
      this._finishRound();
      return;
    }

    // Still bidding — check if next bidder is AI
    this._processAiBids();
  }

  // ── Private: Process AI Bids (iterative) ──

  private _processAiBids(): void {
    while (this._currentRound?.phase === "bidding") {
      const currentPos = this._currentRound.biddingRound.currentPlayerPosition;
      if (this._playerTypes[currentPos] !== "ai") {
        return;
      }

      const player = this._currentRound.players.find((p) => p.position === currentPos);
      if (player === undefined) {
        return;
      }

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

      // Check state after AI bid
      if (this._currentRound.phase === "playing" && this._currentRound.contract !== null) {
        this._emit({
          type: "bidding_completed",
          contract: this._currentRound.contract,
        });
        this._state = "round_playing";
        this._processAiCards();
        return;
      }

      if (this._currentRound.phase === "cancelled") {
        this._finishRound();
        return;
      }

      // Still bidding — loop continues to check next bidder
    }
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
    this._afterCardPlay();
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

    // More cards to play — check if next player is AI
    this._processAiCards();
  }

  // ── Private: Process AI Cards (iterative) ──

  private _processAiCards(): void {
    for (;;) {
      if (this._currentRound?.phase !== "playing" || this._currentRound.currentTrick === null) {
        break;
      }

      const trick = this._currentRound.currentTrick;
      let currentPos: PlayerPosition;

      if (trick.cards.length === 0) {
        currentPos = trick.leadingPlayerPosition;
      } else {
        const lastPlayed = trick.cards[trick.cards.length - 1];
        if (lastPlayed === undefined) {
          return;
        }
        currentPos = getNextPlayerPosition(lastPlayed.playerPosition);
      }

      if (this._playerTypes[currentPos] !== "ai") {
        return;
      }

      const card = chooseCardForRound(this._currentRound, currentPos);
      this._playSingleCard(currentPos, card);
    }

    // Round completed after AI cards — finish it
    if (this._currentRound?.phase === "completed") {
      this._finishRound();
    }
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
