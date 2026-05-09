import type { Card, Rank, Suit } from "./card.js";

// ── Types ──────────────────────────────────────────────────────

export type AnnouncementKind = "sequence" | "carre";

export interface Announcement {
  readonly kind: AnnouncementKind;
  /** For sequences: number of consecutive cards (3, 4, 5+). For carré: 4. */
  readonly length: number;
  readonly suit: Suit; // sequence's suit; for carré, suit of one of the cards (arbitrary)
  readonly highCard: Rank; // highest-ranking card in the announcement
  readonly points: number; // 20 / 50 / 100 / 150 / 200
}

// ── Sequence rank order (for announcement purposes only) ───────
// A > K > Q > J > 10 > 9 > 8 > 7 (differs from trick-winning order)
const ANNOUNCEMENT_ORDER: readonly Rank[] = [
  "ace",
  "king",
  "queen",
  "jack",
  "10",
  "9",
  "8",
  "7",
] as const;

function announcementRank(rank: Rank): number {
  const idx = ANNOUNCEMENT_ORDER.indexOf(rank);
  // higher return value = better rank
  return idx === -1 ? -1 : ANNOUNCEMENT_ORDER.length - 1 - idx;
}

function sequencePoints(length: number): number {
  if (length >= 5) return 100;
  if (length === 4) return 50;
  if (length === 3) return 20;
  return 0;
}

function carrePoints(rank: Rank): number {
  if (rank === "jack") return 200;
  if (rank === "9") return 150;
  if (rank === "ace" || rank === "10" || rank === "king" || rank === "queen") return 100;
  // 8 and 7 are not announceable
  return 0;
}

// ── findAnnouncements ──────────────────────────────────────────

export function findAnnouncements(hand: readonly Card[]): Announcement[] {
  const announcements: Announcement[] = [];

  // ── Sequences ────────────────────────────────────────────────
  // For each suit, find maximal runs of 3+ consecutive cards
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  for (const suit of suits) {
    const suitCards = hand.filter((c) => c.suit === suit);
    if (suitCards.length < 3) continue;

    // Sort by announcement rank descending (ace first)
    const sorted = [...suitCards].sort(
      (a, b) => announcementRank(b.rank) - announcementRank(a.rank),
    );

    // Find maximal contiguous runs (adjacent in ANNOUNCEMENT_ORDER means ranks differ by 1)
    let runStart = 0;
    while (runStart < sorted.length) {
      let runEnd = runStart;
      while (runEnd + 1 < sorted.length) {
        const current = sorted[runEnd];
        const next = sorted[runEnd + 1];
        if (current === undefined || next === undefined) break;
        if (announcementRank(current.rank) - announcementRank(next.rank) !== 1) break;
        runEnd++;
      }
      const runLength = runEnd - runStart + 1;
      if (runLength >= 3) {
        const highCardEntry = sorted[runStart];
        if (highCardEntry !== undefined) {
          announcements.push({
            kind: "sequence",
            length: runLength,
            suit,
            highCard: highCardEntry.rank,
            points: sequencePoints(runLength),
          });
        }
      }
      runStart = runEnd + 1;
    }
  }

  // ── Carrés ───────────────────────────────────────────────────
  const rankGroups = new Map<Rank, number>();
  for (const c of hand) {
    rankGroups.set(c.rank, (rankGroups.get(c.rank) ?? 0) + 1);
  }
  for (const [rank, count] of rankGroups) {
    if (count === 4 && carrePoints(rank) > 0) {
      announcements.push({
        kind: "carre",
        length: 4,
        suit: "hearts", // arbitrary suit for carré
        highCard: rank,
        points: carrePoints(rank),
      });
    }
  }

  return announcements;
}

// ── compareAnnouncements ───────────────────────────────────────
// Returns positive if a beats b, negative if b beats a, 0 if equal.

export function compareAnnouncements(
  a: Announcement,
  b: Announcement,
  trumpSuit: Suit | null,
): number {
  // 1. Carré beats any sequence
  if (a.kind !== b.kind) {
    return a.kind === "carre" ? 1 : -1;
  }

  // 2. Same kind: higher points wins
  if (a.points !== b.points) {
    return a.points - b.points;
  }

  // 3. Tied points: compare highCard rank
  const rankDiff = announcementRank(a.highCard) - announcementRank(b.highCard);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  // 4. Tied rank, sequences in different suits: trump suit wins
  if (a.kind === "sequence" && b.kind === "sequence" && a.suit !== b.suit && trumpSuit !== null) {
    if (a.suit === trumpSuit) return 1;
    if (b.suit === trumpSuit) return -1;
  }

  return 0;
}

// ── resolveAnnouncementWinner ──────────────────────────────────

export function resolveAnnouncementWinner(
  teamA: readonly Announcement[],
  teamB: readonly Announcement[],
  trumpSuit: Suit | null,
): "a" | "b" | null {
  if (teamA.length === 0 && teamB.length === 0) return null;
  if (teamA.length === 0) return "b";
  if (teamB.length === 0) return "a";

  // Find best announcement from each team
  const bestA = teamA.reduce((best, ann) =>
    compareAnnouncements(ann, best, trumpSuit) > 0 ? ann : best,
  );
  const bestB = teamB.reduce((best, ann) =>
    compareAnnouncements(ann, best, trumpSuit) > 0 ? ann : best,
  );

  const cmp = compareAnnouncements(bestA, bestB, trumpSuit);
  if (cmp > 0) return "a";
  if (cmp < 0) return "b";
  return null; // tie — no announcements scored
}

// ── calculateAnnouncementTotal ─────────────────────────────────

export function calculateAnnouncementTotal(announcements: readonly Announcement[]): number {
  return announcements.reduce((sum, ann) => sum + ann.points, 0);
}
