# Iteration 058 — Report: Announcement bubbles + chat in Coinche UI

## What was done

### New event: `AnnouncementsRevealedEvent`

**`packages/coinche/app/src/events.ts`**

- Added `AnnouncementsRevealedEvent` interface with:
  - `byPosition: Partial<Record<PlayerPosition, readonly Announcement[]>>` — sparse per-player breakdown.
  - `winner: "ns" | "ew" | null`.
  - `totalPoints: number`.
- Added `"announcements_revealed"` to `GameEventType`.
- Added `AnnouncementsRevealedEvent` to the `GameEvent` union.
- Imported `Announcement` type from `@coinche/core`.

### Session emits the event

**`packages/coinche/app/src/session.ts`**

- Added import for `findAnnouncements` from `@coinche/core` and `Announcement` type.
- Added private helper `_emitAnnouncementsIfAny(round: Round)` that:
  1. Returns immediately if both `nsAnnouncements` and `ewAnnouncements` are empty.
  2. Iterates `round.players` to compute per-player announcements using `findAnnouncements`.
  3. Emits `announcements_revealed` with the sparse `byPosition` map, `winner`, and `totalPoints`.
- Called from both `_afterBidding()` and `_processNextBid()` immediately after emitting `bidding_completed`.

### UI hook handles the event

**`packages/ui/src/hooks/useCoinchGameSession.ts`**

- Added import for `Announcement` and `PlayerPosition` from `@coinche/core`.
- In `coinchEventToMessage`: added explicit early-return `null` for `"announcements_revealed"` (handled separately to avoid double processing).
- In the `useEffect` event listener, added `announcements_revealed` handler:
  - For each position in `byPosition`, generates a `GameMessage` with the announcement text (e.g. "Tierce ♠", "Cinquante ♥", "Carré de jacks").
  - Calls `setMessages` and `showBubble` for each player message.
  - When `winner !== null`, appends a system message (anchored at south) reporting the winning team and total points.

### Export

**`packages/coinche/app/src/index.ts`**

- Exported `AnnouncementsRevealedEvent` type.

### Tests

**`packages/coinche/app/__tests__/announcements-event.test.ts`** — 3 new tests:

1. `announcements_revealed` fires after `bidding_completed` (verified by event index ordering) when the deal produces announcements.
2. `byPosition` entries contain only valid positions (0-3) and each entry has ≥1 announcement.
3. `winner` and `totalPoints` in the event match the corresponding `round.announcementWinner` and `round.announcementPoints` captured at `bidding_completed` time.

## 4-checks result

| Check               | Result                                  |
| ------------------- | --------------------------------------- |
| `pnpm test`         | 2081 / 2081 passed (99 test files)      |
| `pnpm typecheck`    | clean                                   |
| `pnpm lint`         | delta-clean (no new errors vs baseline) |
| `pnpm format:check` | clean for changed files                 |

## Forward notes (N+1, N+2)

- **Iter 059**: Could add announcement visibility on the game board — show a small badge or overlay near each player seat when they have announcements, referencing `byPosition` data passed through `GameSessionState`.
- **Iter 060**: Consider a richer announcement comparison reveal (show both teams' announcements simultaneously with a winner highlight animation).
