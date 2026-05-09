# Iteration 058 — Plan: Announcement bubbles + chat in Coinche UI

## Goal

Surface player announcement declarations (tierce, carré etc.) in the Coinche game UI as thought bubbles and chat messages, immediately after bidding completes.

## Context

- `@coinche/core` `Round` now has `nsAnnouncements`, `ewAnnouncements`, `announcementWinner`, `announcementPoints` (iter 057).
- `@coinche/app/src/session.ts` fires `bidding_completed` with a `Contract`.
- `useCoinchGameSession.ts` handles events and generates `messages` + `bubbles`.
- No `@belote/` packages to be touched.

## Steps

### Step 1 — `announcements_revealed` event type

Add `AnnouncementsRevealedEvent` to `packages/coinche/app/src/events.ts`:

- `type: "announcements_revealed"`
- `byPosition: Partial<Record<PlayerPosition, readonly Announcement[]>>` — sparse per-player breakdown
- `winner: "ns" | "ew" | null`
- `totalPoints: number`

Add to `GameEventType` union and `GameEvent` union.

### Step 2 — Emit in `session.ts`

In `_afterBidding()` and `_processNextBid()`, immediately after emitting `bidding_completed`, call a new private helper `_emitAnnouncementsIfAny(round)` that:

1. Returns early if no announcements on either team.
2. Iterates `round.players` to compute per-player announcements via `findAnnouncements`.
3. Emits `announcements_revealed` with `byPosition`, `winner`, `totalPoints`.

Import `findAnnouncements` from `@coinche/core` and `Announcement` type.

### Step 3 — Handle in `useCoinchGameSession`

In the `useEffect` event listener, handle `announcements_revealed`:

- For each entry in `byPosition`, generate a `GameMessage` with the player's announcement text.
- Also add a system message when `winner !== null` indicating which team won.
- Mark `coinchEventToMessage` to return `null` for `announcements_revealed` (handled separately).

### Step 4 — Export

Export `AnnouncementsRevealedEvent` from `packages/coinche/app/src/index.ts`.

## Tests

`packages/coinche/app/__tests__/announcements-event.test.ts` with 3 tests:

1. `announcements_revealed` fires after `bidding_completed` when announcements exist, in correct order.
2. `byPosition` contains only positions with ≥1 announcement, valid keys (0-3).
3. `winner` and `totalPoints` match the round fields at time of emission.

## Scope

- Only touches `@coinche/app` and `@coinche/ui` (hook only); no `@belote/` packages.
- Estimated size: small (~100 loc net).
