# Iteration 056 — Report

## Summary

Implemented the announcements model in `@coinche/core` as a pure, self-contained
module. Covers detection, comparison, and scoring of tierce/cinquante/cent
sequences and carré (4-of-a-kind) per GAME_RULES.md §8. No session integration
yet — pure model only.

## What was done

### New file
- `packages/coinche/core/src/models/announcements.ts`
  - `ANNOUNCEMENT_ORDER` constant: A>K>Q>J>10>9>8>7
  - `announcementRank()`, `sequencePoints()`, `carrePoints()` internal helpers
  - `findAnnouncements(hand)`: per-suit run detection (maximal runs ≥ 3),
    carré detection (4-of-rank with points > 0)
  - `compareAnnouncements(a, b, trumpSuit)`: 4-level comparison: kind → points
    → highCard rank → trump suit tiebreak
  - `resolveAnnouncementWinner(teamA, teamB, trumpSuit)`: picks winning team
    or null on tie / no announcements
  - `calculateAnnouncementTotal(announcements)`: sum of points

### Modified files
- `packages/coinche/core/src/models/index.ts`: exports all announcement
  types and functions
- `packages/coinche/core/src/index.ts`: re-exports from models index

### Tests
- `packages/coinche/core/__tests__/models/announcements.test.ts`: 21 tests
  (20 as specified + 1 edge case for empty calculateAnnouncementTotal)
  — all GREEN

## 4 checks

| Check | Status |
|-------|--------|
| `pnpm test` | 2043 / 2043 passed |
| `pnpm typecheck` | clean |
| `pnpm lint` | clean (delta-zero on new files) |
| `pnpm format:check` | clean |

## Forward planning

- **N+1 (057)**: Wire announcements into the round lifecycle — declare
  announcements just before first trick; attach to `Round`; score winning
  team's total in `calculateRoundScore`.
- **N+2 (058)**: UI announcement display — show declared announcements in
  game table; highlight winning team's announcements.
