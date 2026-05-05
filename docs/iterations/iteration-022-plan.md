# Iteration 022 — Match history (backend recording + history screen)

> Fourth iteration of the "real backend" track. Records every completed
> game to the DB and surfaces the user's match history in the UI. After
> 022 a user can sign up, play a game, and see it on their history page.

## Goal

1. **Schema migration `0002_matches.sql`** — `matches` (one per game)
   - `match_seats` (one row per seat per match, linking to user/guest).
2. **`recordMatch` query** — atomic insert of match + 4 seats inside a
   transaction.
3. **`listUserMatches` / `listGuestMatches`** — fetch a user's history
   ordered by `ended_at DESC`.
4. **Game-end recording in the gateway** — Room exposes an
   `onGameCompleted` callback; gateway provides one that captures
   final scores + each seat's identity (from `ClientContext.userId` /
   `guestId`) and persists.
5. **`GET /api/matches`** — returns the current user's match history.
   401 for guests (history is per-user; guests can play but won't see
   a list until they sign up). Upgraded guests inherit history via
   `users.upgraded_to_user_id` (already in 019 schema).
6. **`HistoryScreen` UI** — list of past matches: date, partners,
   opponents, final score, win/loss badge.
7. **IdentityChip menu gains a "View history" item** for users only.

What this iteration does **not** ship: per-match detail page, stats
summary (wins / losses / win-rate), filtering, friends.

## Decisions

| Decision                                        | Choice                                                                                                                            | Why                                                                                                                                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recording happens at the gateway, not the Room  | Gateway provides Room with an `onGameCompleted` callback; Room invokes it post-event                                              | Room is pure orchestration of the GameSession; persistence lives at the gateway boundary alongside the cookie/identity plumbing. Keeps Room test-able without a DB.                                                |
| `match_seats` has both `user_id` and `guest_id` | Nullable FKs (one set per row)                                                                                                    | Same shape as `sessions`; lets us record guest games without losing them, and reuses the upgrade-to-user pathway from 019 (a guest who later signs up still sees their old games via `users.upgraded_to_user_id`). |
| Guests can't list their own history             | `GET /api/matches` requires a user session                                                                                        | Guests don't have a stable identity — their `belote.sid` cookie can be wiped any time. Showing a guest a history that won't survive a logout-equivalent is worse than no history. Sign up to keep your games.      |
| One row per match, scores at game-end only      | Don't persist round-by-round detail in this iteration                                                                             | Round data is large and the UX target here is just the summary list. Per-round detail can come as a future "match detail" iteration.                                                                               |
| `winner_team`: integer (0 or 1)                 | Match `team`/`PlayerPosition` semantics from `@belote/core`                                                                       | Frontend converts to "NS" / "EW" / "your team" / "their team" labels.                                                                                                                                              |
| History is opt-in past sign-up, not retroactive | A guest signs up → from that point all new matches are theirs. Past anonymous games are linked through guests.upgraded_to_user_id | Simple. The schema supports retroactive linking via the upgrade column; whether the UI shows them is a later UX call.                                                                                              |

## Schema (migration `0002_matches.sql`)

```sql
CREATE TABLE matches (
  id             TEXT PRIMARY KEY,
  code           TEXT NOT NULL,
  started_at     INTEGER NOT NULL,
  ended_at       INTEGER NOT NULL,
  target_score   INTEGER NOT NULL,
  final_score_ns INTEGER NOT NULL,
  final_score_ew INTEGER NOT NULL,
  winner_team    INTEGER NOT NULL CHECK (winner_team IN (0, 1))
);

CREATE TABLE match_seats (
  match_id   TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  seat       INTEGER NOT NULL CHECK (seat IN (0, 1, 2, 3)),
  user_id    TEXT REFERENCES users(id)  ON DELETE SET NULL,
  guest_id   TEXT REFERENCES guests(id) ON DELETE SET NULL,
  nickname   TEXT NOT NULL,
  PRIMARY KEY (match_id, seat)
);

CREATE INDEX match_seats_user_id  ON match_seats(user_id);
CREATE INDEX match_seats_guest_id ON match_seats(guest_id);
CREATE INDEX matches_ended_at     ON matches(ended_at);
```

## Files to add / touch

### `packages/db/`

| File                              | Change                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/migrations/0002_matches.sql` | New schema.                                                                                        |
| `src/queries/matches.ts`          | `recordMatch(db, input)`, `listUserMatches(db, userId)`, `listGuestMatches(db, guestId)` (helper). |
| `src/index.ts`                    | Re-export new functions and types.                                                                 |
| `__tests__/matches.test.ts`       | Insert + read-back; FK on user_id; ON DELETE CASCADE for seats; ordering by ended_at DESC.         |
| `__tests__/migrations.test.ts`    | Add a case asserting the new tables exist.                                                         |

### `packages/server/`

| File                                      | Change                                                                                                                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/room.ts`                             | New constructor option `onGameCompleted?: (info) => void`. Invoke after the game_completed event so the gateway can persist.                                                                  |
| `src/gateway.ts`                          | When constructing rooms (both `_handleCreateRoom` and `_formMatch`), pass an `onGameCompleted` that captures each seat's `ClientContext.userId`/`guestId` + nickname and calls `recordMatch`. |
| `src/match-history/routes.ts` (new)       | `GET /api/matches` route. Reads `request.session` (set by sessionPlugin) and queries by user id; 401 for guests / no session.                                                                 |
| `src/bin/serve.ts`                        | Register the new routes plugin alongside the auth routes.                                                                                                                                     |
| `__tests__/match-recording.test.ts` (new) | End-to-end via the gateway harness: 4 clients sign in (user cookie), play a game to completion, assert one match row + 4 seat rows.                                                           |
| `__tests__/match-routes.test.ts` (new)    | `app.inject()`-style: 401 without cookie / with guest cookie; 200 with user cookie returns the user's matches.                                                                                |

### `packages/ui/`

| File                                                    | Change                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/online/api/matches.ts` (new)                       | Typed wrapper: `apiListMatches(): Promise<MatchSummary[]>`.                                |
| `src/components/HistoryScreen/HistoryScreen.tsx`        | Lists matches; empty state.                                                                |
| `src/components/HistoryScreen/HistoryScreen.module.css` | Cream-paper rows, win/loss pill.                                                           |
| `src/components/IdentityChip/IdentityChip.tsx`          | Adds a "View history" menu item when `kind === "user"`. New optional `onViewHistory` prop. |
| `src/components/ModeSelectScreen/ModeSelectScreen.tsx`  | Adds optional `onViewHistory` to forward to chip.                                          |
| `src/App.tsx`                                           | New screen state `"history"`. Wires `onViewHistory` to `setScreen("history")`.             |
| `__tests__/HistoryScreen.test.tsx` (new)                | Loading state, empty state, list state with 2 matches, win/loss badge.                     |
| `__tests__/IdentityChip.test.tsx`                       | Add a case for the "View history" item visibility (user only).                             |

## TDD plan

1. **`db/__tests__/matches.test.ts`** → impl `db/queries/matches.ts` + migration file.
2. **`server/__tests__/match-recording.test.ts`** → impl Room callback + gateway wiring.
3. **`server/__tests__/match-routes.test.ts`** → impl `match-history/routes.ts`.
4. **`ui/__tests__/HistoryScreen.test.tsx`** → impl `HistoryScreen.tsx` + CSS.
5. **`ui/__tests__/IdentityChip.test.tsx`** → impl chip menu addition.
6. **App wiring** + `apiListMatches` client.

## Out of scope

- Per-match detail page (round-by-round, trick-by-trick).
- Stats summary (wins / losses / streak / ELO).
- Friends list, online presence (iteration 023).
- Profile page (iteration 024).
- Retroactive guest-history merging UI ("you played 3 games before
  signing up — claim them?"). The DB already supports it via
  `guests.upgraded_to_user_id`; UX surface comes later.

## Validation

- `pnpm test` — green. Expected delta ≈ +25.
- `pnpm typecheck` / `pnpm format:check` — clean.
- `pnpm lint` — delta-clean over baseline.
- `pnpm --filter ui exec vite build` — clean.
- **Manual smoke after deploy**:
  1. Sign up as Alice; play one AI-only game (placeholder for the UI
     — actual recording requires 4 humans in a real room, since AI
     games don't pass through the gateway). Skip for now.
  2. Open IdentityChip dropdown → "View history" → empty state ("No
     games yet").
  3. (Real verification once we have 4 humans testing) Complete a
     room game; refresh history page; see one row.

## Carryforward to iteration 023 (friends)

- Friend-of-friend joins use `match_seats.user_id` to back the
  shared-history view ("we played 7 games together").
- Online presence built on the gateway's existing `_clients` map.
- Friends panel mounted next to IdentityChip in the menu.
