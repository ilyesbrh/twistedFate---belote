import {
  GameSession,
  createStartGameCommand,
  createStartRoundCommand,
  createPlaceBidCommand,
  createPlayCardCommand,
} from "@belote/app";
import type { GameEvent } from "@belote/app";
import type { Seat, ServerMessage, WireBid } from "@belote/protocol";
import { getValidPlays } from "@belote/core";
import type { Card, PlayerPosition } from "@belote/core";

export interface RoomPlayer {
  readonly clientId: string;
  readonly nickname: string;
}

export interface Broadcaster {
  sendToSeat(seat: Seat, msg: ServerMessage): void;
  broadcastAll(msg: ServerMessage): void;
}

export type RoomPhase = "lobby" | "bidding" | "playing" | "round_complete" | "game_complete";

/** The seat-by-index array; index is the seat (0..3). */
export type Seats = [RoomPlayer | null, RoomPlayer | null, RoomPlayer | null, RoomPlayer | null];

export class Room {
  readonly code: string;
  private readonly _broadcaster: Broadcaster;
  private readonly _session: GameSession;
  private readonly _seats: Seats = [null, null, null, null];

  constructor(code: string, broadcaster: Broadcaster) {
    this.code = code;
    this._broadcaster = broadcaster;
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

  join(clientId: string, nickname: string): Seat {
    if (this.seatOf(clientId) !== null) {
      throw new Error("ALREADY_JOINED");
    }
    const freeSeat = this._seats.findIndex((s) => s === null);
    if (freeSeat < 0) throw new Error("ROOM_FULL");
    const seat = freeSeat as Seat;
    this._seats[seat] = { clientId, nickname };
    this._broadcaster.broadcastAll({ type: "player_joined", seat, nickname });
    return seat;
  }

  leave(clientId: string): void {
    const seat = this.seatOf(clientId);
    if (seat === null) return;
    this._seats[seat] = null;
    this._broadcaster.broadcastAll({ type: "player_left", seat });
  }

  startGame(targetScore: number): void {
    if (!this.isFull) throw new Error("NOT_FULL");
    const names = this._seats.map((s) => s?.nickname ?? "") as [string, string, string, string];
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
    this._broadcaster.broadcastAll({
      type: "event",
      event: event as unknown as Record<string, unknown>,
    });
    this._broadcastPublicState();
    this._broadcastPrivateStates();
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
