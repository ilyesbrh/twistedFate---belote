# Iteration 023 Report — Friends (schema, routes, panel UI)

**Date**: 2026-05-05
**Status**: Complete
**Test delta**: 854 → 889 (+35)

> Overwrites the pre-reset 023 report (in-game UI chrome alignment)
> per the numbering-reset convention.

## Goal

Friend graph on top of the auth foundation. After 023 a logged-in
user can search by email, send a friend request, accept incoming
ones, see their list, remove a friend.

## TDD trail

1. **`db/__tests__/friends.test.ts`** (14) → impl
   `db/migrations/0003_friendships.sql` + `db/queries/friends.ts`.
   Reject + cancel both DELETE the row; re-sending after reject
   succeeds; accept flips status to `accepted`; `listFriends`
   unions both directions and joins `users`.
2. **`server/__tests__/friends-routes.test.ts`** (11) → impl
   `server/src/friends/routes.ts`. 401 for guests on every route.
   401/404/409 sequencing on requests; 403 when non-addressee
   tries to accept.
3. **`ui/__tests__/FriendsScreen.test.tsx`** (8) → impl
   `FriendsScreen.tsx` + CSS. Loading / empty / friends / incoming /
   outgoing sections; add-friend form; back navigation.
4. **`ui/__tests__/IdentityChip.test.tsx`** (+2) → "Friends" menu
   item visible only to users when `onViewFriends` is provided.
5. **App + ModeSelect + useFriends** wiring — new
   `screen === "friends"` state. Container component owns the data
   hook and forwards to the presentational screen.

## Files added

```
packages/db/
  src/migrations/0003_friendships.sql
  src/queries/friends.ts
  __tests__/friends.test.ts

packages/server/
  src/friends/routes.ts
  __tests__/friends-routes.test.ts

packages/ui/
  src/components/FriendsScreen/FriendsScreen.tsx + .module.css
  src/online/api/friends.ts
  src/online/useFriends.ts
  __tests__/FriendsScreen.test.tsx
```

## Files modified

- `packages/db/src/index.ts` — re-exports the friend surface.
- `packages/server/src/bin/serve.ts` — `registerFriendsRoutes`.
- `packages/ui/src/components/IdentityChip/IdentityChip.tsx` —
  optional `onViewFriends` prop, "Friends" menu item for users.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — forwards `onViewFriends` to the chip.
- `packages/ui/src/App.tsx` — `screen === "friends"` state and a
  `FriendsScreenContainer`.
- `packages/ui/__tests__/IdentityChip.test.tsx` — +2 cases.

## Trade-offs

- **No online-presence indicator** in this iteration. Adding it
  cleanly requires a server→client push channel (the existing WS),
  which is invasive enough to justify its own iteration.
- **No "invite to current room" button** on each friend; same
  reason — needs a deep-link or WS-push, deferred to 024.
- **Friend search by email only.** Username search would be nicer
  but we don't have unique usernames yet; emails are the only
  stable handle a user knows.
- **Rate-limit deferred.** No bursty caller in this code path
  today; no backstop friend-request spam vector. Worth doing
  before any kind of public sign-up rollout.

## Validation

- `pnpm test` — **889 / 889 green** (was 854; +35 = 14 db + 11 server + 8 UI screen + 2 chip).
- `pnpm typecheck` — clean.
- `pnpm format:check` — clean.
- `pnpm lint` — **182 problems vs 188 baseline → delta-clean (−6)**.
- `pnpm --filter ui exec vite build` — clean (375 modules, 349 kB JS gzipped to 109 kB).

## Browser smoke (deferred to live URL)

After deploy:

1. Sign up as Alice in browser A. Sign up as Bob in browser B.
2. Alice → IdentityChip → "Friends". Empty list with "Add by email".
3. Type `bob@x.com` → Add. See "Sent request" row.
4. Bob → IdentityChip → "Friends". See "Incoming" row from Alice.
5. Bob clicks Accept. Both see each other under "Friends".
6. Alice clicks Remove on Bob. Both panels empty again.

## Carryforward to iteration 024

- **Profile page** (`GET/PATCH /api/users/:id`, public + edit-own).
- **Online presence** + "invite to room" — gateway publishes
  per-user online status over the WS; FriendsScreen subscribes.
- **Match-detail page** (round-by-round) — uses identity from 020
  - history from 022.
