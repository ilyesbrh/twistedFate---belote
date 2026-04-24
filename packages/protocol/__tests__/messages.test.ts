import { describe, it, expect } from "vitest";
import {
  isClientMessage,
  isServerMessage,
  parseClientMessage,
  parseServerMessage,
  type ClientMessage,
  type ServerMessage,
} from "../src/index.js";

describe("client message validation", () => {
  const validExamples: ClientMessage[] = [
    { type: "hello", nickname: "Alice" },
    { type: "create_room" },
    { type: "join_room", code: "ABCD" },
    { type: "rejoin_room", code: "ABCD", playerToken: "tok_xxx" },
    { type: "start_game", targetScore: 501 },
    { type: "place_bid", bid: { type: "pass" } },
    { type: "place_bid", bid: { type: "suit", value: 90, suit: "hearts" } },
    { type: "place_bid", bid: { type: "coinche" } },
    { type: "place_bid", bid: { type: "surcoinche" } },
    { type: "play_card", cardId: "card_abc123" },
    { type: "ping" },
  ];

  for (const msg of validExamples) {
    it(`accepts ${msg.type}${"bid" in msg ? "/" + msg.bid.type : ""}`, () => {
      expect(isClientMessage(msg)).toBe(true);
      expect(parseClientMessage(msg)).toEqual(msg);
    });
  }

  it("rejects non-object inputs", () => {
    expect(isClientMessage(null)).toBe(false);
    expect(isClientMessage("hello")).toBe(false);
    expect(isClientMessage(42)).toBe(false);
    expect(isClientMessage([])).toBe(false);
  });

  it("rejects unknown type tags", () => {
    expect(isClientMessage({ type: "nope" })).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(isClientMessage({ type: "hello" })).toBe(false);
    expect(isClientMessage({ type: "join_room" })).toBe(false);
    expect(isClientMessage({ type: "place_bid" })).toBe(false);
    expect(isClientMessage({ type: "place_bid", bid: {} })).toBe(false);
    expect(isClientMessage({ type: "play_card" })).toBe(false);
  });

  it("rejects suit bids with invalid value", () => {
    expect(
      isClientMessage({ type: "place_bid", bid: { type: "suit", value: 85, suit: "hearts" } }),
    ).toBe(false);
    expect(
      isClientMessage({ type: "place_bid", bid: { type: "suit", value: 90, suit: "banana" } }),
    ).toBe(false);
  });

  it("rejects join_room with malformed code", () => {
    expect(isClientMessage({ type: "join_room", code: "abc" })).toBe(false); // too short
    expect(isClientMessage({ type: "join_room", code: "ABCDE" })).toBe(false); // too long
    expect(isClientMessage({ type: "join_room", code: "abcd" })).toBe(false); // lowercase
    expect(isClientMessage({ type: "join_room", code: "AB1D" })).toBe(false); // digit
  });

  it("parseClientMessage throws on invalid", () => {
    expect(() => parseClientMessage({ type: "nope" })).toThrow(/invalid client message/i);
  });
});

describe("server message validation", () => {
  const validExamples: ServerMessage[] = [
    { type: "hello_ack", clientId: "c1" },
    { type: "room_created", code: "ABCD", seat: 0, playerToken: "tok_a" },
    {
      type: "room_joined",
      code: "ABCD",
      seat: 2,
      playerToken: "tok_c",
      players: [{ seat: 0, nickname: "A" }],
    },
    { type: "player_joined", seat: 1, nickname: "B" },
    { type: "player_left", seat: 1 },
    { type: "player_disconnected", seat: 2 },
    { type: "player_reconnected", seat: 2 },
    { type: "public_state", state: { phase: "bidding" } as unknown as Record<string, unknown> },
    { type: "private_state", seat: 0, hand: [], legalCardIds: [] },
    { type: "event", event: { type: "trick_completed" } as unknown as Record<string, unknown> },
    { type: "error", reason: "room full", code: "ROOM_FULL" },
    { type: "pong" },
  ];

  for (const msg of validExamples) {
    it(`accepts ${msg.type}`, () => {
      expect(isServerMessage(msg)).toBe(true);
      expect(parseServerMessage(msg)).toEqual(msg);
    });
  }

  it("rejects unknown type", () => {
    expect(isServerMessage({ type: "wat" })).toBe(false);
  });

  it("rejects room_created with bad seat or missing token", () => {
    expect(isServerMessage({ type: "room_created", code: "ABCD", seat: 4, playerToken: "x" })).toBe(
      false,
    );
    expect(isServerMessage({ type: "room_created", code: "abcd", seat: 0, playerToken: "x" })).toBe(
      false,
    );
    expect(isServerMessage({ type: "room_created", code: "ABCD", seat: 0 })).toBe(false);
  });
});
