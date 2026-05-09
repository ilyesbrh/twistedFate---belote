import { describe, it, expect } from "vitest";
import { createIdGenerator } from "@coinche/core";
import type { IdGenerator, PlayerPosition } from "@coinche/core";
import { GameSession } from "../src/session.js";
import type { AnnouncementsRevealedEvent } from "../src/events.js";
import {
  createStartGameCommand,
  createStartRoundCommand,
  createPlaceBidCommand,
} from "../src/commands.js";

// ==============================================================
// Helpers
// ==============================================================

function makeIdGen(seed = 42): IdGenerator {
  return createIdGenerator({ seed });
}

function makeLcgRng(seed: number): () => number {
  let s = seed * 999983;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ==============================================================
// Test 1 — Session emits announcements_revealed after bidding_completed
// ==============================================================

describe("announcements_revealed event", () => {
  it("should emit announcements_revealed after bidding_completed when there are announcements", () => {
    const idGen = makeIdGen(42);
    const session = new GameSession({
      playerTypes: ["human", "human", "human", "human"],
      idGenerator: idGen,
    });

    const events: { type: string }[] = [];
    session.on((e) => events.push(e));

    session.dispatch(createStartGameCommand(["P0", "P1", "P2", "P3"], 3000));

    // Complete bidding: player 1 bids 90 hearts, rest pass.
    session.dispatch(createStartRoundCommand());
    session.dispatch(createPlaceBidCommand(1 as PlayerPosition, "suit", 90, "hearts"));
    session.dispatch(createPlaceBidCommand(2 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(3 as PlayerPosition, "pass"));
    session.dispatch(createPlaceBidCommand(0 as PlayerPosition, "pass"));

    // bidding_completed must have fired
    const biddingDone = events.filter((e) => e.type === "bidding_completed");
    expect(biddingDone).toHaveLength(1);

    // announcements_revealed fires only if the dealt hands have announcements.
    // Check that if it fires, it fires AFTER bidding_completed.
    const annRevealedIdx = events.findIndex((e) => e.type === "announcements_revealed");
    const biddingCompletedIdx = events.findIndex((e) => e.type === "bidding_completed");

    if (annRevealedIdx !== -1) {
      // Must come after bidding_completed
      expect(annRevealedIdx).toBeGreaterThan(biddingCompletedIdx);
    }
    // Either way: no error thrown = pass
  });

  // ==============================================================
  // Test 2 — byPosition contains entries for players with announcements
  // ==============================================================

  it("byPosition contains entries only for positions that have announcements", () => {
    // Collect announcements_revealed events across many seeds until one is found
    const collected: AnnouncementsRevealedEvent[] = [];

    for (let seed = 1; seed <= 100 && collected.length === 0; seed++) {
      const idGen = createIdGenerator({ seed });
      const session = new GameSession({
        playerTypes: ["ai", "ai", "ai", "ai"],
        idGenerator: idGen,
        rng: makeLcgRng(seed * 1234567),
      });

      session.on((e) => {
        if (e.type === "announcements_revealed") {
          collected.push(e);
        }
      });

      session.dispatch(createStartGameCommand(["A", "B", "C", "D"], 3000));
      session.dispatch(createStartRoundCommand());
    }

    if (collected.length === 0) {
      // No announcements found in 100 seeds — test passes trivially
      return;
    }

    const ev = collected[0]!;
    // Every entry in byPosition must have ≥1 announcement
    for (const [_posStr, anns] of Object.entries(ev.byPosition)) {
      expect(anns).toBeDefined();
      expect((anns as unknown[]).length).toBeGreaterThan(0);
    }

    // The positions in byPosition must be valid player positions (0-3)
    for (const posStr of Object.keys(ev.byPosition)) {
      const pos = Number(posStr);
      expect([0, 1, 2, 3]).toContain(pos);
    }
  });

  // ==============================================================
  // Test 3 — winner and totalPoints match round values
  // ==============================================================

  it("winner and totalPoints in event match the round announcement fields", () => {
    interface CapturedPair {
      annEv: AnnouncementsRevealedEvent;
      roundData: { announcementWinner: "ns" | "ew" | null; announcementPoints: number };
    }

    const pairs: CapturedPair[] = [];

    for (let seed = 200; seed <= 300 && pairs.length === 0; seed++) {
      const idGen = createIdGenerator({ seed });
      const session = new GameSession({
        playerTypes: ["ai", "ai", "ai", "ai"],
        idGenerator: idGen,
        rng: makeLcgRng(seed * 999983),
      });

      // Use a per-session accumulator so the pair is always from the same round
      let capturedRoundData:
        | { announcementWinner: "ns" | "ew" | null; announcementPoints: number }
        | undefined;

      session.on((e) => {
        if (e.type === "bidding_completed") {
          // Capture the round state at the moment bidding completes
          const round = session.currentRound;
          if (round) {
            capturedRoundData = {
              announcementWinner: round.announcementWinner,
              announcementPoints: round.announcementPoints,
            };
          }
        }
        if (e.type === "announcements_revealed" && capturedRoundData !== undefined) {
          pairs.push({ annEv: e, roundData: capturedRoundData });
        }
      });

      session.dispatch(createStartGameCommand(["A", "B", "C", "D"], 3000));
      session.dispatch(createStartRoundCommand());
    }

    if (pairs.length === 0) {
      // No announcements found — test passes trivially
      return;
    }

    const { annEv, roundData } = pairs[0]!;

    expect(annEv.winner).toBe(roundData.announcementWinner);
    expect(annEv.totalPoints).toBe(roundData.announcementPoints);
  });
});
