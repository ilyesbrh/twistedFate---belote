import { describe, it, expect } from "vitest";
import { createIdGenerator, createCard } from "@belote/core";
import type { PlayerPosition } from "@belote/core";
import {
  createStartGameCommand,
  createStartRoundCommand,
  createPlaceBidCommand,
  createPlayCardCommand,
} from "../src/commands.js";

// ==============================================================
// createStartGameCommand
// ==============================================================

describe("createStartGameCommand", () => {
  it("should create a command with type 'start_game'", () => {
    const cmd = createStartGameCommand(["A", "B", "C", "D"], 1000);
    expect(cmd.type).toBe("start_game");
  });

  it("should store player names", () => {
    const cmd = createStartGameCommand(["Alice", "Bob", "Carol", "Dave"], 1000);
    expect(cmd.playerNames).toEqual(["Alice", "Bob", "Carol", "Dave"]);
  });

  it("should store target score", () => {
    const cmd = createStartGameCommand(["A", "B", "C", "D"], 500);
    expect(cmd.targetScore).toBe(500);
  });

  it("should return a frozen object", () => {
    const cmd = createStartGameCommand(["A", "B", "C", "D"], 1000);
    expect(Object.isFrozen(cmd)).toBe(true);
    expect(Object.isFrozen(cmd.playerNames)).toBe(true);
  });
});

// ==============================================================
// createStartRoundCommand
// ==============================================================

describe("createStartRoundCommand", () => {
  it("should create a command with type 'start_round'", () => {
    const cmd = createStartRoundCommand();
    expect(cmd.type).toBe("start_round");
  });

  it("should return a frozen object", () => {
    const cmd = createStartRoundCommand();
    expect(Object.isFrozen(cmd)).toBe(true);
  });
});

// ==============================================================
// createPlaceBidCommand
// ==============================================================

describe("createPlaceBidCommand", () => {
  it("should create a pass bid command", () => {
    const cmd = createPlaceBidCommand(0 as PlayerPosition, "pass");
    expect(cmd.type).toBe("place_bid");
    expect(cmd.playerPosition).toBe(0);
    expect(cmd.bidType).toBe("pass");
  });

  it("should create a suit bid command with value and suit", () => {
    const cmd = createPlaceBidCommand(1 as PlayerPosition, "suit", 80, "hearts");
    expect(cmd.type).toBe("place_bid");
    expect(cmd.playerPosition).toBe(1);
    expect(cmd.bidType).toBe("suit");
    expect(cmd.value).toBe(80);
    expect(cmd.suit).toBe("hearts");
  });

  it("should create a coinche bid command", () => {
    const cmd = createPlaceBidCommand(2 as PlayerPosition, "coinche");
    expect(cmd.type).toBe("place_bid");
    expect(cmd.bidType).toBe("coinche");
  });

  it("should create a surcoinche bid command", () => {
    const cmd = createPlaceBidCommand(3 as PlayerPosition, "surcoinche");
    expect(cmd.type).toBe("place_bid");
    expect(cmd.bidType).toBe("surcoinche");
  });

  it("should return a frozen object", () => {
    const cmd = createPlaceBidCommand(0 as PlayerPosition, "pass");
    expect(Object.isFrozen(cmd)).toBe(true);
  });
});

// ==============================================================
// createPlayCardCommand
// ==============================================================

describe("createPlayCardCommand", () => {
  it("should create a command with type 'play_card'", () => {
    const idGen = createIdGenerator({ seed: 1 });
    const card = createCard("hearts", "ace", idGen);
    const cmd = createPlayCardCommand(0 as PlayerPosition, card);
    expect(cmd.type).toBe("play_card");
    expect(cmd.playerPosition).toBe(0);
    expect(cmd.card).toBe(card);
  });

  it("should return a frozen object", () => {
    const idGen = createIdGenerator({ seed: 1 });
    const card = createCard("spades", "jack", idGen);
    const cmd = createPlayCardCommand(2 as PlayerPosition, card);
    expect(Object.isFrozen(cmd)).toBe(true);
  });
});
