# Iteration 024 Report — Profile page + CI smoke-check fix

**Date**: 2026-05-05
**Status**: Complete
**Test delta**: 889 → 918 (+29)

> Overwrites the pre-reset 024 report (paper game board) per the
> numbering-reset convention.

## Goal

Profile page (view + edit own) on top of every primitive built in
019–023, plus a fix for a CI smoke-check race that's been
false-flagging recent deploys as failures even when the container
came up healthy.

## TDD trail

1. **`db/__tests__/users-stats.test.ts`** (8) → impl `getUserStats`
   - `updateUser` in `db/queries/users.ts`. Stats derived from
     `match_seats` + `matches` at read time (no denormalized cache).
2. **`server/__tests__/profile-routes.test.ts`** (11) → impl
   `server/src/profiles/routes.ts`. `GET /api/users/:id` returns
   public profile (no email) for non-self viewers; full self-profile
   when `id === me`. `PATCH /api/users/me` updates nickname /
   avatarUrl. 401 for guests.
3. **`ui/__tests__/ProfileScreen.test.tsx`** (10) → impl
   `ProfileScreen.tsx` + CSS. Loading / error / view / edit
   modes, monogram avatar, win-rate display, edit form with save +
   cancel.
4. **App + IdentityChip** wiring — chip menu gains "Profile" item;
   App routes screen="profile" via a thin container that fetches
   the profile via `apiGetProfile(self.id)` and updates via
   `apiUpdateMyProfile`. After a successful save, calls
   `auth.refresh()` so the chip's nickname updates immediately.

## CI smoke-check race fix

Iteration 020 and 022 deploys both showed red in the **smoke check**
step, even though the docker container came up healthy and was
serving traffic. The cause: `docker compose up -d` returns as soon as
the container is created, but the Node process inside takes another
3–5 seconds to bind port 4100. The workflow's `curl --fail` ran
immediately and got "Recv failure: Connection reset by peer" before
the listener was ready.

Fix: replace the single curl with a loop that retries up to 10×3s
before declaring failure. The container's own healthcheck has a 15s
`start_period` already; the workflow now matches that window.

Verified live: `curl -s -o /dev/null -w "%{http_code}\n" https://belote.3btechsolutions.com/health` → **200**. The 020/022 deploys were always succeeding at the docker level; only the workflow status was misleading.

## Files added

```
packages/db/
  __tests__/users-stats.test.ts                 (8 cases)

packages/server/
  src/profiles/routes.ts
  __tests__/profile-routes.test.ts              (11 cases)

packages/ui/
  src/components/ProfileScreen/ProfileScreen.tsx + .module.css
  src/online/api/profile.ts
  __tests__/ProfileScreen.test.tsx              (10 cases)
```

## Files modified

- `packages/db/src/queries/users.ts` — `updateUser`, `getUserStats`,
  `UserPatch`, `UserStats` types.
- `packages/db/src/index.ts` — re-exports.
- `packages/server/src/bin/serve.ts` — registers profile routes.
- `packages/ui/src/components/IdentityChip/IdentityChip.tsx` —
  optional `onViewProfile` prop, "Profile" menu item.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — forwards `onViewProfile`.
- `packages/ui/src/App.tsx` — `screen === "profile"` state +
  `ProfileScreenContainer` that owns the data fetch.
- `.github/workflows/server-deploy.yml` — smoke-check now retries
  for up to ~30s.

## Trade-offs

- **Stats derived, not cached.** Cheap given index on
  `match_seats.user_id`; avoids a `users.stats_cache` column and the
  consistency burden of keeping it correct on every match insert.
  If we ever paginate friend-leaderboard pages, revisit.
- **Avatar is a URL only — no upload.** Upload + storage warrants
  its own iteration (CDN choice, max size, content-type allow-list).
- **No password change / email change.** Each needs an extra
  verification step. Future iteration.
- **Profile of _other_ users is reachable only by knowing the id**
  (no public username search). Intentional for now: friends-list +
  match-history rows are the only way to surface other ids; that
  scopes who can be looked up.

## Validation

- `pnpm test` — **918 / 918 green** (was 889; +29 = 8 + 11 + 10).
- `pnpm typecheck` — clean.
- `pnpm format:check` — clean.
- `pnpm lint` — **183 problems vs 188 baseline → delta-clean (−5)**.
- `pnpm --filter ui exec vite build` — clean (375 modules, 355 kB JS / 110 kB gzip).
- Live `https://belote.3btechsolutions.com/health` → 200 (verified
  during this iteration; the previous "CI failed" runs were false
  alarms from the smoke-check race).

## Closing the initial backend arc

```
019 — auth foundation (db, /api/auth/*)
020 — WS gateway resolves identity from cookie
021 — visible auth UI (IdentityChip, login/signup screens)
022 — match history (recording + history screen)
023 — friends (schema, routes, panel UI)
024 — profile page (this iteration) + CI smoke-check fix
```

Next iteration tracks (out of scope here):

- **Online-presence** push channel (gateway → friends panel) and
  "invite friend to current room" deep link.
- **Match-detail** page (round-by-round, trick-by-trick).
- **Avatar upload** + CDN.
- **Email/password change**, password reset, magic links, OAuth.
- **Public username search** + handle uniqueness.
