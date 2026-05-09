# Iteration 056 — Announcements model: tierce/cinquante/cent + carré

## Goal

Build the announcements model in `@coinche/core` — pure functions for detecting,
comparing, and scoring tierce/cinquante/cent sequences and carré (4-of-a-kind)
per `docs/games/coinche/GAME_RULES.md` §8.

## Scope

### New: `packages/coinche/core/src/models/announcements.ts`

- `AnnouncementKind`, `Announcement` types
- `findAnnouncements(hand)` — detects all announceable sequences and carrés
- `compareAnnouncements(a, b, trumpSuit)` — comparison according to §8 rules
- `resolveAnnouncementWinner(teamA, teamB, trumpSuit)` — determines scoring team
- `calculateAnnouncementTotal(announcements)` — sums announcement points

### Modified: `packages/coinche/core/src/models/index.ts`
Export all announcement types and functions.

### Modified: `packages/coinche/core/src/index.ts`
Re-export from models index.

### New: `packages/coinche/core/__tests__/models/announcements.test.ts`
20 tests covering all detection, comparison, and winner-resolution cases.

## Out of scope

- Session/scoring integration — pure model only
- UI changes

## Forward planning

- **N+1 (057)**: Wire announcements into the bidding/round lifecycle — declare
  announcements just before the first trick; attach to `Round`; score the
  winning team's total in `calculateRoundScore`.
- **N+2 (058)**: UI announcement display — show declared announcements in the
  game table; highlight winning team's announcements.
