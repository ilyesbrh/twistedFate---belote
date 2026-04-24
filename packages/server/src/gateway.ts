import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage, Seat } from "@belote/protocol";
import { parseClientMessage } from "@belote/protocol";
import { Room, type Broadcaster } from "./room.js";
import { RoomRegistry } from "./registry.js";

interface ClientContext {
  readonly clientId: string;
  readonly ws: WebSocket;
  nickname: string;
  room: Room | null;
  seat: Seat | null;
}

export interface GatewayConfig {
  readonly codeGenerator?: () => string;
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

  constructor(wss: WebSocketServer, config: GatewayConfig = {}) {
    this._wss = wss;
    this._registry = new RoomRegistry({ codeGenerator: config.codeGenerator });

    this._wss.on("connection", (ws) => {
      this._handleConnection(ws);
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

  private _handleConnection(ws: WebSocket): void {
    this._clientCounter += 1;
    const clientId = `c_${String(this._clientCounter)}_${String(Date.now())}`;
    const ctx: ClientContext = {
      clientId,
      ws,
      nickname: "",
      room: null,
      seat: null,
    };
    this._clients.set(clientId, ctx);
    send(ws, { type: "hello_ack", clientId });

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
        ctx.room.leave(ctx.clientId);
        const members = this._roomMembers.get(ctx.room.code);
        if (members && ctx.seat !== null) members.delete(ctx.seat);
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
    const room = this._registry.createRoom(broadcaster);
    this._roomMembers.set(room.code, members);
    // Pre-register at seat 0 so the player_joined broadcast reaches the creator.
    members.set(0, ctx);
    const seat = room.join(ctx.clientId, ctx.nickname);
    if (seat !== 0) {
      // Should never happen: creator is always the first joiner.
      members.delete(0);
      members.set(seat, ctx);
    }
    ctx.room = room;
    ctx.seat = seat;
    send(ctx.ws, { type: "room_created", code: room.code, seat });
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
      const seat = room.join(ctx.clientId, ctx.nickname);
      if (seat !== prospective && prospective >= 0) members.delete(prospective as Seat);
      members.set(seat, ctx);
      ctx.room = room;
      ctx.seat = seat;
      const players = room.players
        .map((p, s) => (p ? { seat: s as Seat, nickname: p.nickname } : null))
        .filter((p): p is { seat: Seat; nickname: string } => p !== null);
      send(ctx.ws, { type: "room_joined", code, seat, players });
    } catch (e) {
      sendErr(ctx.ws, "JOIN_FAILED", e instanceof Error ? e.message : String(e));
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
