# Iteration 022 Report — Match history (recording + history screen)

**Date**: 2026-05-05
**Status**: Complete
**Test delta**: 833 → 854 (+21)

> Overwrites the pre-reset 022 report (InstallPrompt cream-paper
> restyle) per the numbering-reset convention noted in CLAUDE.md.

## Goal

Persist every completed game and surface a logged-in user's match
history in a new `HistoryScreen`. Backend captures `userId` /
`guestId` per seat (already attached by 020) and writes a row +
4 seat rows on game-end. Frontend lists them with a win/loss badge.

## TDD trail

1. **`db/__tests__/matches.test.ts`** (8 cases) → impl
   `db/migrations/0002_matches.sql` + `db/queries/matches.ts`.
   `recordMatch` is transactional; `listUserMatches` /
   `listGuestMatches` newest-first; CHECK + FK constraints
   verified at the schema level.
2. **`server/src/room.ts`** — Room accepts `onGameCompleted`
   callback. Tracks `_startedAt` on `startGame()`. Emits the
   callback inside `_onGameEvent` when the dispatch produces a
   `game_completed` event.
3. **`server/src/registry.ts`** — `createRoom` forwards `RoomOptions`
   to the constructor.
4. **`server/src/gateway.ts`** — `_persistMatch` builds a
   `RecordMatchInput` from the live `_roomMembers` map (one
   `ClientContext` per seat → `userId`/`guestId`/nickname). Skips
   silently if any seat is fully anonymous (no userId, no guestId)
   or if no DB is wired. Both `_handleCreateRoom` and `_formMatch`
   pass the same callback into `createRoom`.
5. **`server/__tests__/match-routes.test.ts`** (4 cases) → impl
   `server/src/match-history/routes.ts` (`GET /api/matches`).
   401 for no session / guest cookie; 200 + ordered list for users.
6. **`ui/__tests__/HistoryScreen.test.tsx`** (7 cases) → impl
   `HistoryScreen.tsx` + CSS. Loading / empty / list / win / loss /
   error / back states.
7. **`ui/__tests__/IdentityChip.test.tsx`** (+2 cases) — adds
   `onViewHistory` prop, surfaced as a "View history" item visible
   only to users.
8. **`ui/src/online/api/matches.ts`** + **`useMatchHistory.ts`** —
   typed fetch wrapper + a per-mount fetcher hook.
9. **`App.tsx`** wiring — new `screen === "history"` state. The chip
   gets `onViewHistory` only when the current user is authenticated.

## Files added

```
packages/db/
  src/migrations/0002_matches.sql
  src/queries/matches.ts
  __tests__/matches.test.ts

packages/server/
  src/match-history/routes.ts
  __tests__/match-routes.test.ts

packages/ui/
  src/components/HistoryScreen/HistoryScreen.tsx + .module.css
  src/online/api/matches.ts
  src/online/useMatchHistory.ts
  __tests__/HistoryScreen.test.tsx
```

## Files modified

- `packages/db/src/index.ts` — re-exports the new match query
  surface and types.
- `packages/server/src/room.ts` — `RoomOptions.onGameCompleted` and
  the GameCompletionInfo it passes back; `_startedAt` tracked.
- `packages/server/src/registry.ts` — `createRoom` accepts
  `RoomOptions`.
- `packages/server/src/gateway.ts` — `_persistMatch` and the two
  call sites that wire it through `createRoom`.
- `packages/server/src/bin/serve.ts` — `registerMatchRoutes(app, { db })`.
- `packages/ui/src/components/IdentityChip/IdentityChip.tsx` —
  optional `onViewHistory` prop, "View history" menu item for users.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — forwards `onViewHistory` to the chip.
- `packages/ui/src/App.tsx` — `screen === "history"` state and a
  `HistoryScreenContainer` that owns the data hook.
- `packages/ui/__tests__/IdentityChip.test.tsx` — +2 cases for the
  history menu item.

## Trade-offs

- **No full game-completion integration test.** Driving a real
  Belote game to completion in tests requires bidding + 32 card
  plays per game — heavy ceremony for a thin gluing layer. The DB
  query is unit-tested, the route is integration-tested, and the
  `_persistMatch` glue is small + readable. If a regression bites,
  add the full E2E then.
- **Guests get 401 from `/api/matches`.** Showing a guest a list
  that won't survive a sign-out is worse than no list. The schema
  already supports retroactive linking via
  `guests.upgraded_to_user_id`; iteration 023+ can surface that UX.
- **Match data is summary-only — no round-by-round detail.** A
  per-match detail page is a future iteration. Keeping
  `match_seats` shaped to support it (one row per seat) means the
  detail iteration won't need a schema migration of its own.
- **Anonymous-only games are not persisted.** Skipping is cheaper
  than the alternative (synthetic placeholder ids) and matches the
  user-facing semantics: if no one in the room had an identity,
  nothing meaningful to show in history.

## Validation

- `pnpm test` — **854 / 854 green** (was 833; +21 = 8 db + 4 server + 7 history + 2 chip).
- `pnpm typecheck` — clean.
- `pnpm format:check` — clean.
- `pnpm lint` — **179 problems vs 188 baseline → delta-clean (−9)**.
- `pnpm --filter ui exec vite build` — clean (375 modules, 343 kB JS gzipped to 107 kB).

## Browser smoke (deferred to live URL)

After deploy on `https://belote.3btechsolutions.com/`:

1. Sign up as Alice, log in.
2. Click identity chip → "View history" → empty state (no games yet).
3. (Once 4 humans test) Complete a room game; refresh history page;
   see one row with the room code, the partners' names, the
   final score line, the date, and a "Win" or "Loss" badge.

## Carryforward to iteration 023 (friends)

- `match_seats` is the back-bone of "we played 7 games together" —
  iteration 023 reads it for friend-affinity scoring.
- Online presence built on the gateway's existing `_clients` map.
- Friends panel mounted next to IdentityChip in the menu, or as a
  separate menu screen if the chip dropdown gets crowded.
