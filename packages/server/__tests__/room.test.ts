import { describe, it, expect, beforeEach } from "vitest";
import type { ServerMessage, Seat } from "@belote/protocol";
import { Room, type Broadcaster } from "../src/room.js";

class MockBroadcaster implements Broadcaster {
  readonly seatMessages: Array<{ seat: Seat; msg: ServerMessage }> = [];
  readonly broadcastMessages: ServerMessage[] = [];

  sendToSeat(seat: Seat, msg: ServerMessage): void {
    this.seatMessages.push({ seat, msg });
  }

  broadcastAll(msg: ServerMessage): void {
    this.broadcastMessages.push(msg);
  }

  reset(): void {
    this.seatMessages.length = 0;
    this.broadcastMessages.length = 0;
  }

  /** Latest broadcast of a given type, or undefined. */
  lastBroadcast<T extends ServerMessage["type"]>(
    type: T,
  ): Extract<ServerMessage, { type: T }> | undefined {
    for (let i = this.broadcastMessages.length - 1; i >= 0; i--) {
      const m = this.broadcastMessages[i]!;
      if (m.type === type) return m as Extract<ServerMessage, { type: T }>;
    }
    return undefined;
  }
}

describe("Room — join / leave", () => {
  let broadcaster: MockBroadcaster;
  let room: Room;

  beforeEach(() => {
    broadcaster = new MockBroadcaster();
    room = new Room("ABCD", broadcaster);
  });

  it("assigns seat 0 to the first joiner", () => {
    const { seat, playerToken } = room.join("c1", "Alice");
    expect(seat).toBe(0);
    expect(playerToken).toMatch(/^tok_/);
    expect(room.seatOf("c1")).toBe(0);
    expect(room.players[0]?.nickname).toBe("Alice");
    expect(room.players[0]?.clientId).toBe("c1");
    expect(room.players[0]?.connected).toBe(true);
  });

  it("assigns seats 0..3 sequentially", () => {
    expect(room.join("c1", "A").seat).toBe(0);
    expect(room.join("c2", "B").seat).toBe(1);
    expect(room.join("c3", "C").seat).toBe(2);
    expect(room.join("c4", "D").seat).toBe(3);
    expect(room.isFull).toBe(true);
  });

  it("rejects a 5th joiner with ROOM_FULL", () => {
    room.join("c1", "A");
    room.join("c2", "B");
    room.join("c3", "C");
    room.join("c4", "D");
    expect(() => room.join("c5", "E")).toThrowError(/ROOM_FULL/);
  });

  it("rejects duplicate clientId", () => {
    room.join("c1", "A");
    expect(() => room.join("c1", "A again")).toThrowError(/ALREADY_JOINED/);
  });

  it("broadcasts player_joined on each join", () => {
    room.join("c1", "Alice");
    const msg = broadcaster.lastBroadcast("player_joined");
    expect(msg).toBeDefined();
    expect(msg).toEqual({ type: "player_joined", seat: 0, nickname: "Alice" });
  });

  it("leave frees the seat and broadcasts player_left", () => {
    room.join("c1", "Alice");
    room.join("c2", "Bob");
    broadcaster.reset();
    room.leave("c1");
    expect(room.players[0]).toBeNull();
    expect(broadcaster.lastBroadcast("player_left")).toEqual({ type: "player_left", seat: 0 });
  });
});

describe("Room — reconnection", () => {
  let broadcaster: MockBroadcaster;
  let room: Room;
  beforeEach(() => {
    broadcaster = new MockBroadcaster();
    room = new Room("ABCD", broadcaster);
  });

  it("markDisconnected keeps the seat reserved and broadcasts disconnect", () => {
    const { seat } = room.join("c1", "Alice");
    broadcaster.reset();
    room.markDisconnected("c1");
    expect(room.players[seat]?.connected).toBe(false);
    expect(room.players[seat]?.nickname).toBe("Alice");
    expect(broadcaster.lastBroadcast("player_disconnected")).toEqual({
      type: "player_disconnected",
      seat,
    });
  });

  it("rejoin restores the seat with a new clientId and broadcasts reconnect", () => {
    const { seat, playerToken } = room.join("c1", "Alice");
    room.markDisconnected("c1");
    broadcaster.reset();
    const restored = room.rejoin("c1-new", playerToken);
    expect(restored).toBe(seat);
    expect(room.players[seat]?.clientId).toBe("c1-new");
    expect(room.players[seat]?.connected).toBe(true);
    expect(broadcaster.lastBroadcast("player_reconnected")).toEqual({
      type: "player_reconnected",
      seat,
    });
  });

  it("rejoin with unknown token throws", () => {
    room.join("c1", "Alice");
    expect(() => room.rejoin("c1-new", "tok_nonsense")).toThrowError(/UNKNOWN_TOKEN/);
  });

  it("disconnected seat does NOT count as free for new joins", () => {
    room.join("c1", "A");
    room.join("c2", "B");
    room.join("c3", "C");
    room.join("c4", "D");
    room.markDisconnected("c2");
    // Seat is still occupied → ROOM_FULL.
    expect(() => room.join("c5", "E")).toThrowError(/ROOM_FULL/);
  });
});

describe("Room — start game", () => {
  let broadcaster: MockBroadcaster;
  let room: Room;

  beforeEach(() => {
    broadcaster = new MockBroadcaster();
    room = new Room("ABCD", broadcaster);
    room.join("c1", "A");
    room.join("c2", "B");
    room.join("c3", "C");
    room.join("c4", "D");
    broadcaster.reset();
  });

  it("starts the game only when all 4 seats are filled", () => {
    // Remove one
    room.leave("c4");
    expect(() => room.startGame(501)).toThrowError(/NOT_FULL/);
  });

  it("enters bidding phase on startGame", () => {
    room.startGame(501);
    const state = broadcaster.lastBroadcast("public_state");
    expect(state).toBeDefined();
    expect(state!.state["phase"]).toBe("bidding");
  });

  it("sends private_state (hand) to each seat after dealing", () => {
    room.startGame(501);
    const hands = new Map<number, unknown[]>();
    for (const entry of broadcaster.seatMessages) {
      if (entry.msg.type === "private_state") {
        hands.set(entry.seat, entry.msg.hand as unknown[]);
      }
    }
    expect(hands.size).toBe(4);
    for (const [, hand] of hands) expect(hand.length).toBe(8);
  });
});

describe("Room — bid dispatch", () => {
  let broadcaster: MockBroadcaster;
  let room: Room;

  beforeEach(() => {
    broadcaster = new MockBroadcaster();
    room = new Room("ABCD", broadcaster);
    room.join("c1", "A");
    room.join("c2", "B");
    room.join("c3", "C");
    room.join("c4", "D");
    room.startGame(501);
    broadcaster.reset();
  });

  it("accepts a pass from the current bidder", () => {
    const currentSeat = room.currentBidderSeat;
    expect(currentSeat).not.toBeNull();
    room.placeBid(currentSeat!, { type: "pass" });
    // Public state should advance: a new bid is in the round's bids[].
    const state = broadcaster.lastBroadcast("public_state");
    expect(state).toBeDefined();
    const round = state!.state["round"] as { biddingRound: { bids: unknown[] } } | null;
    expect(round?.biddingRound.bids.length).toBe(1);
  });

  it("sends an error back to the wrong-turn bidder", () => {
    const currentSeat = room.currentBidderSeat!;
    const wrongSeat = ((currentSeat + 1) % 4) as Seat;
    room.placeBid(wrongSeat, { type: "pass" });
    const errors = broadcaster.seatMessages.filter(
      (m) => m.seat === wrongSeat && m.msg.type === "error",
    );
    expect(errors.length).toBeGreaterThan(0);
    const err = errors[0]!.msg;
    if (err.type === "error") {
      expect(err.code).toMatch(/INVALID_/);
    }
  });
});

describe("Room — play card", () => {
  let broadcaster: MockBroadcaster;
  let room: Room;

  beforeEach(() => {
    broadcaster = new MockBroadcaster();
    room = new Room("ABCD", broadcaster);
    room.join("c1", "A");
    room.join("c2", "B");
    room.join("c3", "C");
    room.join("c4", "D");
    room.startGame(501);

    // Drive bidding: seat 0 bids 90 hearts, next 3 pass → contract hearts/90 by seat 0.
    // First actual bidder is seat (dealer+1). Dealer starts at 0 by default, so bidder 0 = seat 1.
    // Just loop: whoever is current bidder, make seat 0 bid on the first opportunity.
    // For simplicity, iterate: each turn, if it's seat 0's turn, bid 90 hearts; else pass.
    for (let i = 0; i < 8 && room.phase === "bidding"; i++) {
      const seat = room.currentBidderSeat;
      if (seat === null) break;
      if (seat === 0) {
        room.placeBid(seat, { type: "suit", value: 90, suit: "hearts" });
      } else {
        room.placeBid(seat, { type: "pass" });
      }
    }
    broadcaster.reset();
  });

  it("reaches playing phase", () => {
    expect(room.phase).toBe("playing");
  });

  it("rejects an unknown cardId with error", () => {
    const leader = room.leaderSeat!;
    room.playCard(leader, "nonsense");
    const errors = broadcaster.seatMessages.filter(
      (m) => m.seat === leader && m.msg.type === "error",
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it("accepts a legal card from the leader", () => {
    const leader = room.leaderSeat!;
    const hand = room.handOfSeat(leader);
    expect(hand.length).toBe(8);
    const firstCardId = hand[0]!.id;
    room.playCard(leader, firstCardId);
    const state = broadcaster.lastBroadcast("public_state");
    expect(state).toBeDefined();
    // The card is now in the current trick.
    const round = state!.state["round"] as { currentTrick: { cards: unknown[] } | null } | null;
    expect(round?.currentTrick?.cards.length).toBe(1);
  });
});
