import type { IncomingMessage } from "node:http";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import type { ClientMessage, Identity, ServerMessage, Seat } from "@belote/protocol";
import { parseClientMessage } from "@belote/protocol";
import {
  findGuestById,
  findSessionByToken,
  findUserById,
  recordMatch,
  type Db,
  type MatchSeat,
} from "@belote/db";
import { Room, type Broadcaster, type GameCompletionInfo } from "./room.js";
import { RoomRegistry } from "./registry.js";
import { MatchmakingQueue } from "./matchmakingQueue.js";
import { SESSION_COOKIE } from "./auth/cookie.js";

interface ClientContext {
  readonly clientId: string;
  readonly ws: WebSocket;
  /** Resolved authenticated user id, if the upgrade carried a user-bound session cookie. */
  userId: string | null;
  /** Resolved guest id, if the upgrade carried a guest-bound session cookie. */
  guestId: string | null;
  nickname: string;
  room: Room | null;
  seat: Seat | null;
}

export interface GatewayConfig {
  readonly codeGenerator?: () => string;
  /**
   * If provided, the gateway resolves the `belote.sid` cookie on every WS
   * upgrade and attaches `userId`/`guestId` to its per-client context.
   * Without a `db`, all connections are treated as anonymous (legacy).
   */
  readonly db?: Db;
}

/** Tiny `name=value; ...` header parser. */
function parseCookieHeader(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const pair of header.split(";")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const k = pair.slice(0, eq).trim();
    if (k !== name) continue;
    return pair.slice(eq + 1).trim();
  }
  return null;
}

/**
 * Binds the WebSocket server to a RoomRegistry, routes client messages to
 * rooms, and backs each Room with a per-room Broadcaster that fans out to
 * the seat/member sockets it holds.
 */
export class Gateway {
  private readonly _wss: WebSocketServer;
  private readonly _registry: RoomRegistry;
  /** clientId → ctx */
  private readonly _clients = new Map<string, ClientContext>();
  /** room.code → (seat → ClientContext) */
  private readonly _roomMembers = new Map<string, Map<Seat, ClientContext>>();
  private _clientCounter = 0;
  private readonly _queue = new MatchmakingQueue();

  private readonly _db: Db | null;

  constructor(wss: WebSocketServer, config: GatewayConfig = {}) {
    this._wss = wss;
    this._registry = new RoomRegistry({ codeGenerator: config.codeGenerator });
    this._db = config.db ?? null;

    this._wss.on("connection", (ws, request) => {
      this._handleConnection(ws, request);
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this._wss.close(() => {
        resolve();
      });
    });
  }

  // ── Internals ──

  /**
   * Persist a finished game to the DB. Skips silently if any seat is
   * fully anonymous (no userId, no guestId), since that would violate
   * the match_seats CHECK constraint. Also skips when no DB is wired.
   */
  private _persistMatch(roomCode: string, info: GameCompletionInfo): void {
    if (!this._db) return;
    const members = this._roomMembers.get(roomCode);
    if (!members) return;
    const seats: MatchSeat[] = [];
    for (const seat of [0, 1, 2, 3] as const) {
      const ctx = members.get(seat);
      if (!ctx) return;
      if (!ctx.userId && !ctx.guestId) return;
      seats.push({
        seat,
        userId: ctx.userId,
        guestId: ctx.guestId,
        nickname: ctx.nickname || `Seat ${String(seat)}`,
      });
    }
    try {
      recordMatch(this._db, {
        code: info.code,
        startedAt: info.startedAt,
        endedAt: info.endedAt,
        targetScore: info.targetScore,
        finalScoreNs: info.finalScores[0],
        finalScoreEw: info.finalScores[1],
        winnerTeam: info.winnerTeam,
        seats,
      });
    } catch {
      // Don't crash the gateway on a DB write failure.
    }
  }

  private _resolveIdentity(request: IncomingMessage): Identity | null {
    if (!this._db) return null;
    const token = parseCookieHeader(request.headers["cookie"], SESSION_COOKIE);
    if (!token) return null;
    const session = findSessionByToken(this._db, token);
    if (!session) return null;
    if (session.userId) {
      const user = findUserById(this._db, session.userId);
      if (!user) return null;
      const identity: Identity = user.avatarUrl
        ? { kind: "user", id: user.id, nickname: user.nickname, avatarUrl: user.avatarUrl }
        : { kind: "user", id: user.id, nickname: user.nickname };
      return identity;
    }
    if (session.guestId) {
      const guest = findGuestById(this._db, session.guestId);
      if (!guest) return null;
      return { kind: "guest", id: guest.id, nickname: guest.nickname };
    }
    return null;
  }

  private _handleConnection(ws: WebSocket, request: IncomingMessage): void {
    this._clientCounter += 1;
    const clientId = `c_${String(this._clientCounter)}_${String(Date.now())}`;
    const identity = this._resolveIdentity(request);
    const ctx: ClientContext = {
      clientId,
      ws,
      userId: identity?.kind === "user" ? identity.id : null,
      guestId: identity?.kind === "guest" ? identity.id : null,
      nickname: identity?.nickname ?? "",
      room: null,
      seat: null,
    };
    this._clients.set(clientId, ctx);
    send(
      ws,
      identity ? { type: "hello_ack", clientId, identity } : { type: "hello_ack", clientId },
    );

    ws.on("message", (data) => {
      let raw: unknown;
      try {
        raw = JSON.parse(data.toString("utf-8"));
      } catch {
        send(ws, { type: "error", code: "BAD_JSON", reason: "malformed JSON" });
        return;
      }
      let msg: ClientMessage;
      try {
        msg = parseClientMessage(raw);
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        send(ws, { type: "error", code: "BAD_MESSAGE", reason });
        return;
      }
      this._dispatch(ctx, msg);
    });

    ws.on("close", () => {
      if (ctx.room) {
        // Reserve the seat for reconnection — do NOT call leave() here.
        ctx.room.markDisconnected(ctx.clientId);
        const members = this._roomMembers.get(ctx.room.code);
        if (members && ctx.seat !== null) members.delete(ctx.seat);
      } else if (this._queue.has(ctx.clientId)) {
        this._queue.cancel(ctx.clientId);
        this._broadcastQueueState();
      }
      this._clients.delete(clientId);
    });
  }

  private _dispatch(ctx: ClientContext, msg: ClientMessage): void {
    switch (msg.type) {
      case "hello":
        ctx.nickname = msg.nickname;
        return;
      case "ping":
        send(ctx.ws, { type: "pong" });
        return;
      case "create_room":
        this._handleCreateRoom(ctx);
        return;
      case "join_room":
        this._handleJoinRoom(ctx, msg.code);
        return;
      case "rejoin_room":
        this._handleRejoinRoom(ctx, msg.code, msg.playerToken);
        return;
      case "start_game":
        if (!ctx.room) return sendErr(ctx.ws, "NOT_IN_ROOM", "create or join first");
        try {
          ctx.room.startGame(msg.targetScore);
        } catch (e) {
          sendErr(ctx.ws, "START_FAILED", e instanceof Error ? e.message : String(e));
        }
        return;
      case "place_bid":
        if (!ctx.room || ctx.seat === null) return sendErr(ctx.ws, "NOT_IN_ROOM", "not seated");
        ctx.room.placeBid(ctx.seat, msg.bid);
        return;
      case "play_card":
        if (!ctx.room || ctx.seat === null) return sendErr(ctx.ws, "NOT_IN_ROOM", "not seated");
        ctx.room.playCard(ctx.seat, msg.cardId);
        return;
      case "find_random":
        this._handleFindRandom(ctx, msg.nickname);
        return;
      case "cancel_random":
        this._handleCancelRandom(ctx);
        return;
      case "add_bots":
        if (!ctx.room) return sendErr(ctx.ws, "NOT_IN_ROOM", "create or join first");
        if (ctx.seat !== 0) return sendErr(ctx.ws, "NOT_HOST", "only the host can add bots");
        ctx.room.addBots();
        return;
    }
  }

  private _handleFindRandom(ctx: ClientContext, nickname: string): void {
    if (ctx.room) return sendErr(ctx.ws, "ALREADY_IN_ROOM", "leave the current room first");
    ctx.nickname = nickname;
    const result = this._queue.enqueue({ clientId: ctx.clientId, nickname });
    if (!result.matched) {
      send(ctx.ws, { type: "queued", position: result.position, size: this._queue.size });
      // Refresh other queued clients with the new size (their position is
      // unchanged but UI may want the size).
      this._broadcastQueueState({ skipClientId: ctx.clientId });
      return;
    }
    this._formMatch(result.group);
  }

  private _handleCancelRandom(ctx: ClientContext): void {
    const removed = this._queue.cancel(ctx.clientId);
    if (!removed) return;
    send(ctx.ws, { type: "match_cancelled" });
    this._broadcastQueueState();
  }

  private _formMatch(group: readonly { clientId: string; nickname: string }[]): void {
    const members = new Map<Seat, ClientContext>();
    const broadcaster: Broadcaster = {
      sendToSeat: (seat, msg) => {
        const m = members.get(seat);
        if (m) send(m.ws, msg);
      },
      broadcastAll: (msg) => {
        for (const m of members.values()) send(m.ws, msg);
      },
    };
    const room = this._registry.createRoom(broadcaster, {
      onGameCompleted: (info) => {
        this._persistMatch(info.code, info);
      },
    });
    this._roomMembers.set(room.code, members);

    const joined: { ctx: ClientContext; seat: Seat; playerToken: string }[] = [];
    for (const entry of group) {
      const ctx = this._clients.get(entry.clientId);
      if (!ctx) continue; // client disconnected between enqueue and match
      const prospective = room.players.findIndex((p) => p === null);
      if (prospective < 0) break;
      members.set(prospective as Seat, ctx);
      const { seat, playerToken } = room.join(ctx.clientId, entry.nickname);
      if (seat !== prospective) {
        members.delete(prospective as Seat);
        members.set(seat, ctx);
      }
      ctx.room = room;
      ctx.seat = seat;
      ctx.nickname = entry.nickname;
      joined.push({ ctx, seat, playerToken });
    }

    const players = room.players
      .map((p, s) => (p ? { seat: s as Seat, nickname: p.nickname } : null))
      .filter((p): p is { seat: Seat; nickname: string } => p !== null);

    for (const { ctx, seat, playerToken } of joined) {
      send(ctx.ws, { type: "match_found", code: room.code, seat, playerToken, players });
    }
  }

  private _broadcastQueueState(opts: { skipClientId?: string } = {}): void {
    const entries = this._queue.entries;
    const size = entries.length;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]!;
      if (opts.skipClientId && e.clientId === opts.skipClientId) continue;
      const ctx = this._clients.get(e.clientId);
      if (!ctx) continue;
      send(ctx.ws, { type: "queued", position: i + 1, size });
    }
  }

  private _handleCreateRoom(ctx: ClientContext): void {
    if (!ctx.nickname) return sendErr(ctx.ws, "NO_NICKNAME", "send hello first");
    const members = new Map<Seat, ClientContext>();
    const broadcaster: Broadcaster = {
      sendToSeat: (seat, msg) => {
        const m = members.get(seat);
        if (m) send(m.ws, msg);
      },
      broadcastAll: (msg) => {
        for (const m of members.values()) send(m.ws, msg);
      },
    };
    const room = this._registry.createRoom(broadcaster, {
      onGameCompleted: (info) => {
        this._persistMatch(info.code, info);
      },
    });
    this._roomMembers.set(room.code, members);
    // Pre-register at seat 0 so the player_joined broadcast reaches the creator.
    members.set(0, ctx);
    const { seat, playerToken } = room.join(ctx.clientId, ctx.nickname);
    if (seat !== 0) {
      // Should never happen: creator is always the first joiner.
      members.delete(0);
      members.set(seat, ctx);
    }
    ctx.room = room;
    ctx.seat = seat;
    send(ctx.ws, { type: "room_created", code: room.code, seat, playerToken });
  }

  private _handleJoinRoom(ctx: ClientContext, code: string): void {
    if (!ctx.nickname) return sendErr(ctx.ws, "NO_NICKNAME", "send hello first");
    const room = this._registry.lookup(code);
    if (!room) return sendErr(ctx.ws, "NO_SUCH_ROOM", `room ${code} not found`);
    const members = this._roomMembers.get(code);
    if (!members) return sendErr(ctx.ws, "NO_SUCH_ROOM", `room ${code} members missing`);
    // Pre-register at the next free seat so the player_joined broadcast reaches the joiner.
    const prospective = room.players.findIndex((p) => p === null);
    if (prospective >= 0) members.set(prospective as Seat, ctx);
    try {
      const { seat, playerToken } = room.join(ctx.clientId, ctx.nickname);
      if (seat !== prospective && prospective >= 0) members.delete(prospective as Seat);
      members.set(seat, ctx);
      ctx.room = room;
      ctx.seat = seat;
      const players = room.players
        .map((p, s) => (p ? { seat: s as Seat, nickname: p.nickname } : null))
        .filter((p): p is { seat: Seat; nickname: string } => p !== null);
      send(ctx.ws, { type: "room_joined", code, seat, playerToken, players });
    } catch (e) {
      sendErr(ctx.ws, "JOIN_FAILED", e instanceof Error ? e.message : String(e));
    }
  }

  private _handleRejoinRoom(ctx: ClientContext, code: string, playerToken: string): void {
    const room = this._registry.lookup(code);
    if (!room) return sendErr(ctx.ws, "NO_SUCH_ROOM", `room ${code} not found`);
    const members = this._roomMembers.get(code);
    if (!members) return sendErr(ctx.ws, "NO_SUCH_ROOM", `room ${code} members missing`);
    // Pre-find the seat that owns this token so we can bind the ws to the
    // members map BEFORE rejoin() broadcasts state — otherwise the recovered
    // client wouldn't receive it.
    const targetSeat = room.players.findIndex((p) => p?.playerToken === playerToken);
    if (targetSeat < 0) {
      return sendErr(ctx.ws, "REJOIN_FAILED", "unknown token");
    }
    members.set(targetSeat as Seat, ctx);
    try {
      const seat = room.rejoin(ctx.clientId, playerToken);
      ctx.room = room;
      ctx.seat = seat;
      ctx.nickname = room.players[seat]?.nickname ?? "";
      const players = room.players
        .map((p, s) => (p ? { seat: s as Seat, nickname: p.nickname } : null))
        .filter((p): p is { seat: Seat; nickname: string } => p !== null);
      send(ctx.ws, { type: "room_joined", code, seat, playerToken, players });
    } catch (e) {
      sendErr(ctx.ws, "REJOIN_FAILED", e instanceof Error ? e.message : String(e));
    }
  }
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function sendErr(ws: WebSocket, code: string, reason: string): void {
  send(ws, { type: "error", code, reason });
}
