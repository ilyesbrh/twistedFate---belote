import { describe, it, expect } from "vitest";
import { RoomRegistry } from "../src/registry.js";
import type { Broadcaster } from "../src/room.js";

function noopBroadcaster(): Broadcaster {
  return {
    sendToSeat: () => undefined,
    broadcastAll: () => undefined,
  };
}

describe("RoomRegistry", () => {
  it("creates a room with a 4-letter uppercase code", () => {
    const reg = new RoomRegistry();
    const room = reg.createRoom(noopBroadcaster());
    expect(room.code).toMatch(/^[A-Z]{4}$/);
  });

  it("returns distinct codes for 100 rooms", () => {
    const reg = new RoomRegistry();
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(reg.createRoom(noopBroadcaster()).code);
    }
    expect(codes.size).toBe(100);
  });

  it("lookup returns the room by code and undefined for unknown", () => {
    const reg = new RoomRegistry();
    const r = reg.createRoom(noopBroadcaster());
    expect(reg.lookup(r.code)).toBe(r);
    expect(reg.lookup("ZZZZ")).toBeUndefined();
  });

  it("delete removes the room", () => {
    const reg = new RoomRegistry();
    const r = reg.createRoom(noopBroadcaster());
    reg.delete(r.code);
    expect(reg.lookup(r.code)).toBeUndefined();
  });

  it("accepts a custom code generator for deterministic tests", () => {
    const codes = ["ABCD", "EFGH", "IJKL"];
    let i = 0;
    const reg = new RoomRegistry({
      codeGenerator: () => codes[i++]!,
    });
    expect(reg.createRoom(noopBroadcaster()).code).toBe("ABCD");
    expect(reg.createRoom(noopBroadcaster()).code).toBe("EFGH");
  });

  it("retries on collision", () => {
    const seq = ["ABCD", "ABCD", "WXYZ"];
    let i = 0;
    const reg = new RoomRegistry({
      codeGenerator: () => seq[i++]!,
    });
    const r1 = reg.createRoom(noopBroadcaster());
    const r2 = reg.createRoom(noopBroadcaster());
    expect(r1.code).toBe("ABCD");
    expect(r2.code).toBe("WXYZ");
  });
});
