import { describe, it, expect } from "vitest";
import {
  findAnnouncements,
  compareAnnouncements,
  resolveAnnouncementWinner,
  calculateAnnouncementTotal,
} from "../../src/models/announcements.js";
import type { Announcement } from "../../src/models/announcements.js";
import { createCard } from "../../src/models/card.js";
import type { Card, Suit } from "../../src/models/card.js";
import { createIdGenerator } from "../../src/utils/id.js";

const idGen = createIdGenerator({ seed: 1 });

function card(suit: Suit, rank: Card["rank"]): Card {
  return createCard(suit, rank, idGen);
}

// ==============================================================
// findAnnouncements
// ==============================================================

describe("findAnnouncements", () => {
  it("1. detects a single tierce (3 consecutive hearts)", () => {
    const hand = [
      card("hearts", "ace"),
      card("hearts", "king"),
      card("hearts", "queen"),
      card("spades", "7"),
      card("diamonds", "9"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(1);
    const ann = result[0]!;
    expect(ann.kind).toBe("sequence");
    expect(ann.suit).toBe("hearts");
    expect(ann.highCard).toBe("ace");
    expect(ann.points).toBe(20);
    expect(ann.length).toBe(3);
  });

  it("2. detects a cinquante (4 consecutive hearts)", () => {
    const hand = [
      card("hearts", "ace"),
      card("hearts", "king"),
      card("hearts", "queen"),
      card("hearts", "jack"),
      card("spades", "7"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(1);
    const ann = result[0]!;
    expect(ann.kind).toBe("sequence");
    expect(ann.length).toBe(4);
    expect(ann.points).toBe(50);
    expect(ann.highCard).toBe("ace");
  });

  it("3. detects a cent (5 consecutive hearts)", () => {
    const hand = [
      card("hearts", "ace"),
      card("hearts", "king"),
      card("hearts", "queen"),
      card("hearts", "jack"),
      card("hearts", "10"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(1);
    const ann = result[0]!;
    expect(ann.kind).toBe("sequence");
    expect(ann.length).toBe(5);
    expect(ann.points).toBe(100);
    expect(ann.highCard).toBe("ace");
  });

  it("4. a 5-card sequence is ONE announcement (not overlapping shorter ones)", () => {
    const hand = [
      card("clubs", "ace"),
      card("clubs", "king"),
      card("clubs", "queen"),
      card("clubs", "jack"),
      card("clubs", "10"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(1);
    expect(result[0]!.points).toBe(100);
  });

  it("5. detects sequences in two different suits", () => {
    const hand = [
      card("hearts", "ace"),
      card("hearts", "king"),
      card("hearts", "queen"),
      card("diamonds", "jack"),
      card("diamonds", "10"),
      card("diamonds", "9"),
      card("spades", "7"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(2);
    const suits = result.map((a) => a.suit);
    expect(suits).toContain("hearts");
    expect(suits).toContain("diamonds");
  });

  it("6. detects carré of jacks (200 pts)", () => {
    const hand = [
      card("hearts", "jack"),
      card("spades", "jack"),
      card("diamonds", "jack"),
      card("clubs", "jack"),
      card("hearts", "7"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(1);
    const ann = result[0]!;
    expect(ann.kind).toBe("carre");
    expect(ann.highCard).toBe("jack");
    expect(ann.points).toBe(200);
    expect(ann.length).toBe(4);
  });

  it("7. detects carré of nines (150 pts)", () => {
    const hand = [
      card("hearts", "9"),
      card("spades", "9"),
      card("diamonds", "9"),
      card("clubs", "9"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(1);
    expect(result[0]!.points).toBe(150);
    expect(result[0]!.highCard).toBe("9");
  });

  it("8. detects carré of aces (100 pts)", () => {
    const hand = [
      card("hearts", "ace"),
      card("spades", "ace"),
      card("diamonds", "ace"),
      card("clubs", "ace"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(1);
    expect(result[0]!.points).toBe(100);
    expect(result[0]!.kind).toBe("carre");
  });

  it("9. carré of 7s is NOT announceable", () => {
    const hand = [
      card("hearts", "7"),
      card("spades", "7"),
      card("diamonds", "7"),
      card("clubs", "7"),
    ];
    const result = findAnnouncements(hand);
    expect(result).toHaveLength(0);
  });

  it("10. empty hand → no announcements", () => {
    expect(findAnnouncements([])).toHaveLength(0);
  });
});

// ==============================================================
// compareAnnouncements
// ==============================================================

describe("compareAnnouncements", () => {
  it("11. carré beats tierce regardless of points", () => {
    const carre: Announcement = {
      kind: "carre",
      length: 4,
      suit: "hearts",
      highCard: "9",
      points: 150,
    };
    const tierce: Announcement = {
      kind: "sequence",
      length: 3,
      suit: "hearts",
      highCard: "ace",
      points: 20,
    };
    expect(compareAnnouncements(carre, tierce, "hearts")).toBeGreaterThan(0);
    expect(compareAnnouncements(tierce, carre, "hearts")).toBeLessThan(0);
  });

  it("12. carré of jacks (200) beats carré of nines (150)", () => {
    const jacks: Announcement = {
      kind: "carre",
      length: 4,
      suit: "hearts",
      highCard: "jack",
      points: 200,
    };
    const nines: Announcement = {
      kind: "carre",
      length: 4,
      suit: "hearts",
      highCard: "9",
      points: 150,
    };
    expect(compareAnnouncements(jacks, nines, null)).toBeGreaterThan(0);
  });

  it("13. cent (100) beats cinquante (50) for sequences", () => {
    const cent: Announcement = {
      kind: "sequence",
      length: 5,
      suit: "hearts",
      highCard: "ace",
      points: 100,
    };
    const cinquante: Announcement = {
      kind: "sequence",
      length: 4,
      suit: "hearts",
      highCard: "ace",
      points: 50,
    };
    expect(compareAnnouncements(cent, cinquante, null)).toBeGreaterThan(0);
  });

  it("14. two tierces with same points: higher highCard wins (A-K-Q > K-Q-J)", () => {
    const tierceAce: Announcement = {
      kind: "sequence",
      length: 3,
      suit: "hearts",
      highCard: "ace",
      points: 20,
    };
    const tierceKing: Announcement = {
      kind: "sequence",
      length: 3,
      suit: "hearts",
      highCard: "king",
      points: 20,
    };
    expect(compareAnnouncements(tierceAce, tierceKing, null)).toBeGreaterThan(0);
  });

  it("15. two sequences same points and highCard, different suit: trump beats non-trump", () => {
    const trumpSeq: Announcement = {
      kind: "sequence",
      length: 3,
      suit: "spades",
      highCard: "ace",
      points: 20,
    };
    const nonTrumpSeq: Announcement = {
      kind: "sequence",
      length: 3,
      suit: "hearts",
      highCard: "ace",
      points: 20,
    };
    expect(compareAnnouncements(trumpSeq, nonTrumpSeq, "spades")).toBeGreaterThan(0);
    expect(compareAnnouncements(nonTrumpSeq, trumpSeq, "spades")).toBeLessThan(0);
  });
});

// ==============================================================
// resolveAnnouncementWinner
// ==============================================================

describe("resolveAnnouncementWinner", () => {
  it("16. only team A has announcements → 'a'", () => {
    const teamA: Announcement[] = [
      { kind: "sequence", length: 3, suit: "hearts", highCard: "ace", points: 20 },
    ];
    expect(resolveAnnouncementWinner(teamA, [], null)).toBe("a");
  });

  it("17. team A has carré, team B has cent → 'a'", () => {
    const teamA: Announcement[] = [
      { kind: "carre", length: 4, suit: "hearts", highCard: "jack", points: 200 },
    ];
    const teamB: Announcement[] = [
      { kind: "sequence", length: 5, suit: "diamonds", highCard: "ace", points: 100 },
    ];
    expect(resolveAnnouncementWinner(teamA, teamB, null)).toBe("a");
  });

  it("18. team A has tierce (A high), team B has tierce (K high) → 'a'", () => {
    const teamA: Announcement[] = [
      { kind: "sequence", length: 3, suit: "hearts", highCard: "ace", points: 20 },
    ];
    const teamB: Announcement[] = [
      { kind: "sequence", length: 3, suit: "spades", highCard: "king", points: 20 },
    ];
    expect(resolveAnnouncementWinner(teamA, teamB, null)).toBe("a");
  });

  it("19. both teams have no announcements → null", () => {
    expect(resolveAnnouncementWinner([], [], null)).toBeNull();
  });
});

// ==============================================================
// calculateAnnouncementTotal
// ==============================================================

describe("calculateAnnouncementTotal", () => {
  it("20. sums all announcement points correctly", () => {
    const announcements: Announcement[] = [
      { kind: "sequence", length: 3, suit: "hearts", highCard: "ace", points: 20 },
      { kind: "carre", length: 4, suit: "hearts", highCard: "jack", points: 200 },
      { kind: "sequence", length: 5, suit: "clubs", highCard: "king", points: 100 },
    ];
    expect(calculateAnnouncementTotal(announcements)).toBe(320);
  });

  it("20b. empty list returns 0", () => {
    expect(calculateAnnouncementTotal([])).toBe(0);
  });
});
