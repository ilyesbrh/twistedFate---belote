import { describe, it, expect } from "vitest";
import { MatchmakingQueue } from "../src/matchmakingQueue.js";

function entry(
  clientId: string,
  nickname = `n_${clientId}`,
): { clientId: string; nickname: string } {
  return { clientId, nickname };
}

describe("MatchmakingQueue", () => {
  it("starts empty", () => {
    const q = new MatchmakingQueue();
    expect(q.size).toBe(0);
    expect(q.has("c1")).toBe(false);
    expect(q.cancel("c1")).toBe(false);
  });

  it("first enqueue returns position 1, no match", () => {
    const q = new MatchmakingQueue();
    const r = q.enqueue(entry("c1"));
    expect(r.matched).toBe(false);
    if (!r.matched) expect(r.position).toBe(1);
    expect(q.size).toBe(1);
    expect(q.has("c1")).toBe(true);
  });

  it("re-enqueue of the same clientId is a no-op (same position, no growth)", () => {
    const q = new MatchmakingQueue();
    q.enqueue(entry("c1"));
    q.enqueue(entry("c2"));
    const r = q.enqueue(entry("c1", "different-nickname-ignored"));
    expect(r.matched).toBe(false);
    if (!r.matched) expect(r.position).toBe(1);
    expect(q.size).toBe(2);
  });

  it("three distinct enqueues yield positions 1, 2, 3 with no match", () => {
    const q = new MatchmakingQueue();
    const r1 = q.enqueue(entry("c1"));
    const r2 = q.enqueue(entry("c2"));
    const r3 = q.enqueue(entry("c3"));
    expect(r1.matched).toBe(false);
    expect(r2.matched).toBe(false);
    expect(r3.matched).toBe(false);
    if (!r1.matched) expect(r1.position).toBe(1);
    if (!r2.matched) expect(r2.position).toBe(2);
    if (!r3.matched) expect(r3.position).toBe(3);
    expect(q.size).toBe(3);
  });

  it("the 4th distinct enqueue produces a match in FIFO order and empties the queue", () => {
    const q = new MatchmakingQueue();
    q.enqueue(entry("c1"));
    q.enqueue(entry("c2"));
    q.enqueue(entry("c3"));
    const r = q.enqueue(entry("c4"));
    expect(r.matched).toBe(true);
    if (r.matched) {
      expect(r.group.map((e) => e.clientId)).toEqual(["c1", "c2", "c3", "c4"]);
      expect(r.group[0].nickname).toBe("n_c1");
      expect(r.group[3].nickname).toBe("n_c4");
    }
    expect(q.size).toBe(0);
    for (const id of ["c1", "c2", "c3", "c4"]) {
      expect(q.has(id)).toBe(false);
    }
  });

  it("cancel of a queued client returns true and decrements size", () => {
    const q = new MatchmakingQueue();
    q.enqueue(entry("c1"));
    q.enqueue(entry("c2"));
    expect(q.cancel("c1")).toBe(true);
    expect(q.size).toBe(1);
    expect(q.has("c1")).toBe(false);
    expect(q.has("c2")).toBe(true);
  });

  it("cancel of a non-queued client returns false", () => {
    const q = new MatchmakingQueue();
    q.enqueue(entry("c1"));
    expect(q.cancel("ghost")).toBe(false);
    expect(q.size).toBe(1);
  });

  it("after cancelling, the same clientId can re-enqueue with a fresh position", () => {
    const q = new MatchmakingQueue();
    q.enqueue(entry("c1"));
    q.enqueue(entry("c2"));
    q.cancel("c1");
    const r = q.enqueue(entry("c1"));
    expect(r.matched).toBe(false);
    if (!r.matched) expect(r.position).toBe(2);
    expect(q.size).toBe(2);
  });

  it("a 5th enqueue lands at position 1 in a fresh queue after the first 4 match", () => {
    const q = new MatchmakingQueue();
    q.enqueue(entry("c1"));
    q.enqueue(entry("c2"));
    q.enqueue(entry("c3"));
    q.enqueue(entry("c4"));
    expect(q.size).toBe(0);
    const r = q.enqueue(entry("c5"));
    expect(r.matched).toBe(false);
    if (!r.matched) expect(r.position).toBe(1);
    expect(q.size).toBe(1);
  });

  it("cancelling the head shifts subsequent positions up", () => {
    const q = new MatchmakingQueue();
    q.enqueue(entry("c1"));
    q.enqueue(entry("c2"));
    q.enqueue(entry("c3"));
    q.cancel("c1");
    // c2 is now head: re-enqueue check via has, plus a new entry's position
    expect(q.has("c2")).toBe(true);
    expect(q.has("c3")).toBe(true);
    const r = q.enqueue(entry("c4"));
    expect(r.matched).toBe(false);
    if (!r.matched) expect(r.position).toBe(3);
  });

  it("cancel does not affect the FIFO order of remaining entries when matching", () => {
    const q = new MatchmakingQueue();
    q.enqueue(entry("c1"));
    q.enqueue(entry("c2"));
    q.enqueue(entry("c3"));
    q.cancel("c2");
    q.enqueue(entry("c4"));
    const r = q.enqueue(entry("c5"));
    expect(r.matched).toBe(true);
    if (r.matched) {
      expect(r.group.map((e) => e.clientId)).toEqual(["c1", "c3", "c4", "c5"]);
    }
  });
});
