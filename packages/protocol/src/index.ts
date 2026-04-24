/**
 * Wire protocol between @belote/server and UI clients.
 * Zero runtime dependencies; pure types + structural validators.
 */

// ── Shared primitives ──

export type Seat = 0 | 1 | 2 | 3;

export type SuitName = "hearts" | "spades" | "diamonds" | "clubs";

export const BID_VALUES_WIRE = [90, 100, 110, 120, 130, 140, 150, 160] as const;
export type BidValueWire = (typeof BID_VALUES_WIRE)[number];

export interface PlayerSummary {
  readonly seat: Seat;
  readonly nickname: string;
}

/** 4 uppercase A–Z. Digits and lowercase are intentionally excluded so codes
 *  are easy to dictate over voice. */
export const ROOM_CODE_REGEX = /^[A-Z]{4}$/;

// ── Bid wire representation (structurally close to @belote/core but decoupled
//    so protocol has zero deps). ──

export type WireBid =
  | { readonly type: "pass" }
  | { readonly type: "suit"; readonly value: BidValueWire; readonly suit: SuitName }
  | { readonly type: "coinche" }
  | { readonly type: "surcoinche" };

// ── Client → Server ──

export type ClientMessage =
  | { readonly type: "hello"; readonly nickname: string }
  | { readonly type: "create_room" }
  | { readonly type: "join_room"; readonly code: string }
  | { readonly type: "start_game"; readonly targetScore: number }
  | { readonly type: "place_bid"; readonly bid: WireBid }
  | { readonly type: "play_card"; readonly cardId: string }
  | { readonly type: "ping" };

// ── Server → Client ──

export type ServerMessage =
  | { readonly type: "hello_ack"; readonly clientId: string }
  | { readonly type: "room_created"; readonly code: string; readonly seat: Seat }
  | {
      readonly type: "room_joined";
      readonly code: string;
      readonly seat: Seat;
      readonly players: readonly PlayerSummary[];
    }
  | { readonly type: "player_joined"; readonly seat: Seat; readonly nickname: string }
  | { readonly type: "player_left"; readonly seat: Seat }
  | { readonly type: "public_state"; readonly state: Record<string, unknown> }
  | {
      readonly type: "private_state";
      readonly seat: Seat;
      readonly hand: readonly unknown[];
      /** IDs of cards in `hand` that the player is currently allowed to play
       *  (empty when not their turn or not in playing phase). */
      readonly legalCardIds: readonly string[];
    }
  | { readonly type: "event"; readonly event: Record<string, unknown> }
  | { readonly type: "error"; readonly reason: string; readonly code: string }
  | { readonly type: "pong" };

// ── Validators ──
// Hand-rolled (no Zod dep). Each branch validates only the fields the type tag
// declares; extra unknown fields are tolerated (servers/clients may add
// fields forward-compatibly).

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSuit(v: unknown): v is SuitName {
  return v === "hearts" || v === "spades" || v === "diamonds" || v === "clubs";
}

function isBidValue(v: unknown): v is BidValueWire {
  return typeof v === "number" && (BID_VALUES_WIRE as readonly number[]).includes(v);
}

function isSeat(v: unknown): v is Seat {
  return v === 0 || v === 1 || v === 2 || v === 3;
}

function isWireBid(v: unknown): v is WireBid {
  if (!isObject(v)) return false;
  const t = v["type"];
  switch (t) {
    case "pass":
    case "coinche":
    case "surcoinche":
      return true;
    case "suit":
      return isBidValue(v["value"]) && isSuit(v["suit"]);
    default:
      return false;
  }
}

export function isClientMessage(v: unknown): v is ClientMessage {
  if (!isObject(v)) return false;
  const t = v["type"];
  switch (t) {
    case "hello": {
      const nickname = v["nickname"];
      return typeof nickname === "string" && nickname.length > 0;
    }
    case "create_room":
      return true;
    case "join_room": {
      const code = v["code"];
      return typeof code === "string" && ROOM_CODE_REGEX.test(code);
    }
    case "start_game": {
      const targetScore = v["targetScore"];
      return typeof targetScore === "number" && targetScore > 0;
    }
    case "place_bid":
      return isWireBid(v["bid"]);
    case "play_card": {
      const cardId = v["cardId"];
      return typeof cardId === "string" && cardId.length > 0;
    }
    case "ping":
      return true;
    default:
      return false;
  }
}

export function isServerMessage(v: unknown): v is ServerMessage {
  if (!isObject(v)) return false;
  const t = v["type"];
  switch (t) {
    case "hello_ack":
      return typeof v["clientId"] === "string";
    case "room_created": {
      const code = v["code"];
      return typeof code === "string" && ROOM_CODE_REGEX.test(code) && isSeat(v["seat"]);
    }
    case "room_joined": {
      const code = v["code"];
      return (
        typeof code === "string" &&
        ROOM_CODE_REGEX.test(code) &&
        isSeat(v["seat"]) &&
        Array.isArray(v["players"])
      );
    }
    case "player_joined":
      return isSeat(v["seat"]) && typeof v["nickname"] === "string";
    case "player_left":
      return isSeat(v["seat"]);
    case "public_state":
      return isObject(v["state"]);
    case "private_state":
      return isSeat(v["seat"]) && Array.isArray(v["hand"]) && Array.isArray(v["legalCardIds"]);
    case "event":
      return isObject(v["event"]);
    case "error":
      return typeof v["reason"] === "string" && typeof v["code"] === "string";
    case "pong":
      return true;
    default:
      return false;
  }
}

export function parseClientMessage(v: unknown): ClientMessage {
  if (!isClientMessage(v)) {
    throw new Error(`invalid client message: ${JSON.stringify(v)}`);
  }
  return v;
}

export function parseServerMessage(v: unknown): ServerMessage {
  if (!isServerMessage(v)) {
    throw new Error(`invalid server message: ${JSON.stringify(v)}`);
  }
  return v;
}
