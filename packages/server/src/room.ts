import {
  GameSession,
  createStartGameCommand,
  createStartRoundCommand,
  createPlaceBidCommand,
  createPlayCardCommand,
} from "@belote/app";
import type { GameEvent } from "@belote/app";
import type { Seat, ServerMessage, WireBid } from "@belote/protocol";
import { getValidPlays, chooseBid, chooseCardForRound, createIdGenerator } from "@belote/core";
import type { Card, PlayerPosition } from "@belote/core";

export interface RoomPlayer {
  /** Stable per-(room,seat) token. Survives socket reconnects. */
  readonly playerToken: string;
  /** Current ws clientId. Changes on reconnect. */
  clientId: string;
  readonly nickname: string;
  connected: boolean;
}

export interface Broadcaster {
  sendToSeat(seat: Seat, msg: ServerMessage): void;
  broadcastAll(msg: ServerMessage): void;
}

export type RoomPhase = "lobby" | "bidding" | "playing" | "round_complete" | "game_complete";

/** The seat-by-index array; index is the seat (0..3). */
export type Seats = [RoomPlayer | null, RoomPlayer | null, RoomPlayer | null, RoomPlayer | null];

/**
 * What the gateway needs at game-end to persist a match row.
 * The Room emits this once when the game-completed event fires.
 */
export interface GameCompletionInfo {
  readonly code: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly targetScore: number;
  readonly finalScores: readonly [number, number];
  readonly winnerTeam: 0 | 1;
}

export interface RoomOptions {
  readonly onGameCompleted?: (info: GameCompletionInfo) => void;
}

const BOT_NAMES = ["SharkyBot", "CardMaster", "TrickQueen", "AceHunter"];

export class Room {
  readonly code: string;
  private readonly _broadcaster: Broadcaster;
  private readonly _session: GameSession;
  private readonly _seats: Seats = [null, null, null, null];
  private readonly _onGameCompleted?: (info: GameCompletionInfo) => void;
  private readonly _botSeats = new Set<Seat>();
  private _startedAt: number | null = null;

  constructor(code: string, broadcaster: Broadcaster, opts: RoomOptions = {}) {
    this.code = code;
    this._broadcaster = broadcaster;
    this._onGameCompleted = opts.onGameCompleted;
    this._session = new GameSession({
      playerTypes: ["human", "human", "human", "human"],
      stepDelayMs: 0,
    });
    this._session.on((event) => {
      this._onGameEvent(event);
    });
  }

  // ── Public surface ──

  get players(): Seats {
    return this._seats;
  }

  get isFull(): boolean {
    return this._seats.every((s) => s !== null);
  }

  get phase(): RoomPhase {
    // Prefer round.phase when available so we don't lag behind by one event:
    // session.dispatch emits bidding_completed BEFORE flipping its internal
    // state to "round_playing", so reading session.state alone misses the
    // transition.
    const r = this._session.currentRound;
    if (r) {
      if (r.phase === "playing") return "playing";
      if (r.phase === "completed") return "round_complete";
      if (r.phase === "cancelled") return "round_complete";
    }
    switch (this._session.state) {
      case "idle":
      case "game_started":
        return "lobby";
      case "round_bidding":
        return "bidding";
      case "round_playing":
        return "playing";
      case "round_completed":
        return "round_complete";
      case "game_completed":
        return "game_complete";
      default:
        return "lobby";
    }
  }

  seatOf(clientId: string): Seat | null {
    for (let i = 0 as Seat; i < 4; i = (i + 1) as Seat) {
      if (this._seats[i]?.clientId === clientId) return i;
      if (i === 3) break;
    }
    return null;
  }

  get currentBidderSeat(): Seat | null {
    const r = this._session.currentRound;
    if (!r || this.phase !== "bidding") return null;
    return r.biddingRound.currentPlayerPosition as Seat;
  }

  get leaderSeat(): Seat | null {
    const r = this._session.currentRound;
    if (!r || this.phase !== "playing") return null;
    const t = r.currentTrick;
    if (!t) return null;
    const nextIdx = (t.leadingPlayerPosition + t.cards.length) % 4;
    return nextIdx as Seat;
  }

  handOfSeat(seat: Seat): readonly Card[] {
    const r = this._session.currentRound;
    if (!r) return [];
    return r.players[seat]?.hand ?? [];
  }

  join(clientId: string, nickname: string): { seat: Seat; playerToken: string } {
    if (this.seatOf(clientId) !== null) {
      throw new Error("ALREADY_JOINED");
    }
    const freeSeat = this._seats.findIndex((s) => s === null);
    if (freeSeat < 0) throw new Error("ROOM_FULL");
    const seat = freeSeat as Seat;
    const playerToken = `tok_${Math.random().toString(36).slice(2, 12)}`;
    this._seats[seat] = { playerToken, clientId, nickname, connected: true };
    this._broadcaster.broadcastAll({ type: "player_joined", seat, nickname });
    return { seat, playerToken };
  }

  /**
   * Reattach a player to their original seat using the token issued at join
   * time. Used when the websocket reconnects (page reload, network blip).
   * Returns the seat on success; throws otherwise.
   */
  rejoin(clientId: string, playerToken: string): Seat {
    for (let i = 0; i < 4; i++) {
      const p = this._seats[i];
      if (p && p.playerToken === playerToken) {
        p.clientId = clientId;
        p.connected = true;
        this._broadcaster.broadcastAll({ type: "player_reconnected", seat: i as Seat });
        // Push fresh state so the reconnected client catches up immediately.
        this._broadcastPublicState();
        this._broadcastPrivateStates();
        return i as Seat;
      }
    }
    throw new Error("UNKNOWN_TOKEN");
  }

  /**
   * Mark a player as disconnected without freeing the seat. The seat stays
   * reserved so the same player can rejoin via their token.
   */
  markDisconnected(clientId: string): void {
    const seat = this.seatOf(clientId);
    if (seat === null) return;
    const p = this._seats[seat];
    if (!p) return;
    p.connected = false;
    this._broadcaster.broadcastAll({ type: "player_disconnected", seat });
  }

  /**
   * Permanent leave (e.g. user clicks Leave) — frees the seat.
   */
  leave(clientId: string): void {
    const seat = this.seatOf(clientId);
    if (seat === null) return;
    this._seats[seat] = null;
    this._broadcaster.broadcastAll({ type: "player_left", seat });
  }

  isBot(seat: Seat): boolean {
    return this._botSeats.has(seat);
  }

  /**
   * Fill all empty seats with AI bots. Returns the number of bots added.
   */
  addBots(): number {
    let added = 0;
    let nameIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (this._seats[i] !== null) continue;
      const seat = i as Seat;
      const name = BOT_NAMES[nameIdx % BOT_NAMES.length]!;
      nameIdx++;
      const playerToken = `bot_${Math.random().toString(36).slice(2, 12)}`;
      this._seats[seat] = { playerToken, clientId: `bot_${String(seat)}`, nickname: name, connected: true };
      this._botSeats.add(seat);
      this._broadcaster.broadcastAll({ type: "player_joined", seat, nickname: name });
      added++;
    }
    return added;
  }

  startGame(targetScore: number): void {
    if (!this.isFull) throw new Error("NOT_FULL");
    const names = this._seats.map((s) => s?.nickname ?? "") as [string, string, string, string];
    this._startedAt = Date.now();
    this._session.dispatch(createStartGameCommand(names, targetScore));
    this._session.dispatch(createStartRoundCommand());
  }

  placeBid(seat: Seat, wire: WireBid): void {
    try {
      const cmd = createPlaceBidCommand(
        seat as PlayerPosition,
        wire.type,
        wire.type === "suit" ? wire.value : undefined,
        wire.type === "suit" ? wire.suit : undefined,
      );
      this._session.dispatch(cmd);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this._broadcaster.sendToSeat(seat, {
        type: "error",
        code: classifyError(reason),
        reason,
      });
    }
  }

  playCard(seat: Seat, cardId: string): void {
    const hand = this.handOfSeat(seat);
    const card = hand.find((c) => c.id === cardId);
    if (!card) {
      this._broadcaster.sendToSeat(seat, {
        type: "error",
        code: "INVALID_CARD",
        reason: `card ${cardId} not in hand`,
      });
      return;
    }
    try {
      this._session.dispatch(createPlayCardCommand(seat as PlayerPosition, card));
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this._broadcaster.sendToSeat(seat, {
        type: "error",
        code: classifyError(reason),
        reason,
      });
    }
  }

  // ── Internals ──

  private _onGameEvent(event: GameEvent): void {
    // Debug trace — visible in server terminal
    const e = event as Record<string, unknown>;
    const seat = e["playerPosition"] ?? e["dealerPosition"] ?? "";
    const extra =
      event.type === "bid_placed" ? ` ${String((e["bid"] as Record<string, unknown>)?.["type"])}` :
      event.type === "card_played" ? ` ${String((e["card"] as Record<string, unknown>)?.["suit"])} ${String((e["card"] as Record<string, unknown>)?.["rank"])}` :
      event.type === "trick_completed" ? ` winner=${String(e["winnerPosition"])}` :
      "";
    console.log(`[room:${this.code}] ${event.type} seat=${String(seat)}${extra} phase=${this.phase}`);

    this._broadcaster.broadcastAll({
      type: "event",
      event: event as unknown as Record<string, unknown>,
    });
    this._broadcastPublicState();
    this._broadcastPrivateStates();

    if (event.type === "game_completed" && this._onGameCompleted) {
      const target = this._session.game?.targetScore ?? 0;
      this._onGameCompleted({
        code: this.code,
        startedAt: this._startedAt ?? Date.now(),
        endedAt: Date.now(),
        targetScore: target,
        finalScores: event.finalScores,
        winnerTeam: event.winnerTeamIndex,
      });
    }

    // Auto-start next round after 5s for all online games
    if (event.type === "round_completed" || event.type === "round_cancelled") {
      if (this._session.state !== "game_completed") {
        setTimeout(() => {
          this._session.dispatch(createStartRoundCommand());
        }, 5000);
      }
      return;
    }

    // Bot auto-play logic
    if (this._botSeats.size > 0) {
      // After a trick completes, wait for the sweep animation (1400ms)
      if (event.type === "trick_completed") {
        setTimeout(() => {
          this._tickBot();
        }, 1800);
        return;
      }

      // Bidding moves: 800ms feels like thinking
      // Card plays: 1200ms to let the card animate in
      const delay = this.phase === "bidding" ? 800 : 1200;
      setTimeout(() => {
        this._tickBot();
      }, delay);
    }
  }

  private _tickBot(): void {
    const r = this._session.currentRound;
    if (!r) {
      console.log(`[room:${this.code}] _tickBot: no current round`);
      return;
    }

    if (this.phase === "bidding") {
      const bidder = this.currentBidderSeat;
      if (bidder === null || !this._botSeats.has(bidder)) return;
      console.log(`[room:${this.code}] bot seat=${String(bidder)} bidding...`);
      const hand = r.players[bidder]?.hand ?? [];
      const idGen = createIdGenerator();
      const bid = chooseBid(hand, r.biddingRound, bidder as PlayerPosition, idGen);
      if (bid.type === "pass") {
        this.placeBid(bidder, { type: "pass" });
      } else if (bid.type === "suit") {
        this.placeBid(bidder, { type: "suit", suit: bid.suit, value: bid.value });
      } else if (bid.type === "coinche") {
        this.placeBid(bidder, { type: "coinche" });
      } else {
        this.placeBid(bidder, { type: "pass" });
      }
    } else if (this.phase === "playing") {
      const leader = this.leaderSeat;
      if (leader === null || !this._botSeats.has(leader)) return;
      console.log(`[room:${this.code}] bot seat=${String(leader)} playing...`);
      try {
        const card = chooseCardForRound(r, leader as PlayerPosition);
        this.playCard(leader, card.id);
      } catch {
        // Fallback: play first valid card
        const hand = r.players[leader]?.hand ?? [];
        if (hand.length > 0) {
          const firstCard = hand[0];
          if (firstCard) this.playCard(leader, firstCard.id);
        }
      }
    }
  }

  private _broadcastPublicState(): void {
    const r = this._session.currentRound;
    const game = this._session.game;
    const publicRound = r
      ? {
          dealerPosition: r.dealerPosition,
          phase: r.phase,
          biddingRound: r.biddingRound,
          contract: r.contract ?? null,
          tricks: r.tricks,
          currentTrick: r.currentTrick ?? null,
        }
      : null;
    const snapshot: Record<string, unknown> = {
      phase: this.phase,
      round: publicRound,
      scores: game?.teamScores ?? [0, 0],
      targetScore: game?.targetScore ?? null,
      roundNumber: this._session.roundNumber,
      players: this._seats.map((s, i) => ({ seat: i, nickname: s?.nickname ?? null })),
    };
    this._broadcaster.broadcastAll({ type: "public_state", state: snapshot });
  }

  private _broadcastPrivateStates(): void {
    const r = this._session.currentRound;
    if (!r) return;
    const trick = r.currentTrick;
    const isPlaying = r.phase === "playing" && trick !== null;
    const nextSeat = trick !== null ? (trick.leadingPlayerPosition + trick.cards.length) % 4 : null;
    for (let s = 0; s < 4; s++) {
      const hand = r.players[s]?.hand ?? [];
      const legalCardIds: string[] = [];
      if (isPlaying && trick !== null && nextSeat === s) {
        for (const c of getValidPlays(trick, s as PlayerPosition, hand)) {
          legalCardIds.push(c.id);
        }
      }
      this._broadcaster.sendToSeat(s as Seat, {
        type: "private_state",
        seat: s as Seat,
        hand: hand as readonly unknown[],
        legalCardIds,
      });
    }
  }
}

function classifyError(message: string): string {
  if (/invalid bid/i.test(message)) return "INVALID_BID";
  if (/invalid play|invalid card/i.test(message)) return "INVALID_PLAY";
  if (/not current/i.test(message)) return "WRONG_TURN";
  return "INVALID_ACTION";
}
