# Iteration 024 — Profile page (view + edit) + final live smoke

> Sixth (and last in this initial track) iteration of the "real
> backend" work. Adds the profile page on top of the auth + history
>
> - friends primitives, then runs an end-to-end live-URL smoke to
>   confirm the whole stack works.

## Goal

1. **`GET /api/users/:id`** — public profile: nickname, avatarUrl,
   account-age timestamp, derived stats (total matches, wins, win%).
   Email + sensitive fields hidden unless the requester == the user.
2. **`PATCH /api/users/me`** — edit own nickname / avatarUrl. Same
   validation parity with signup.
3. **`ProfileScreen` UI** — view a user's profile; if it's the
   current user, show an Edit button + inline form.
4. **IdentityChip menu** gains a "Profile" item linking to my-self.
5. **Final live smoke** — curl the deployed instance to verify the
   full chain: signup → me → guest mint flow → friends round-trip
   → profile → match-history empty list → logout.

## Decisions

| Decision                                         | Choice                                                          | Why                                                                                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stats are derived, not denormalized              | `SELECT COUNT(*)`, `SUM(...)` over `match_seats` + `matches`    | Cheap given index on `match_seats.user_id`; avoids the consistency burden of an `users.stats_cache` column.                                                     |
| Public vs private fields                         | Email + updated_at hidden from non-self viewers                 | Email is the only stable handle today; leaking it via id-lookup would make harvesting trivial. updated_at is a "you can edit your name" signal, not for others. |
| Edit only nickname + avatarUrl in this iteration | No email change, no password change                             | Keeps the route surface tight. Password change needs the old password + email-change needs verification — both are their own iterations.                        |
| URL-keyed routes                                 | `GET /api/users/:id` (id, not email)                            | Stable; lets /api/users/me be a meaningful alias eventually. Email-keyed lookup is a side path used only by friend-search.                                      |
| `/api/users/me` returns the _full_ self-profile  | Yes (with email)                                                | Avoids round-trip games where the client must compare ids.                                                                                                      |
| Avatar is a URL, no upload pipeline yet          | Frontend can paste a URL; later iterations can add upload + CDN | Upload + storage is a substantial scope on its own.                                                                                                             |

## Files to add / touch

### `packages/db/`

| File                            | Change                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| `src/queries/users.ts`          | Add `updateUser(db, id, patch)` and `getUserStats(db, id)`.   |
| `src/index.ts`                  | Re-export.                                                    |
| `__tests__/users.test.ts`       | + cases for `updateUser` (happy + invalid).                   |
| `__tests__/users-stats.test.ts` | New — counts and win% derived from `matches` + `match_seats`. |

### `packages/server/`

| File                               | Change                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `src/profiles/routes.ts`           | `GET /api/users/:id` (public summary or self-full), `PATCH /api/users/me`. |
| `src/bin/serve.ts`                 | Register profile routes.                                                   |
| `__tests__/profile-routes.test.ts` | Per-route inject coverage including stats payload.                         |

### `packages/ui/`

| File                                           | Change                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `src/online/api/profile.ts`                    | Typed wrappers: `apiGetProfile(id)`, `apiUpdateMyProfile(patch)`. |
| `src/online/useProfile.ts`                     | Hook for one user's profile + stats.                              |
| `src/components/ProfileScreen/`                | View + inline edit form. Stats card.                              |
| `src/components/IdentityChip/IdentityChip.tsx` | Adds "Profile" menu item for users.                               |
| `src/components/ModeSelectScreen/...`          | Forward `onViewProfile`.                                          |
| `src/App.tsx`                                  | New `screen === "profile"` state.                                 |
| `__tests__/ProfileScreen.test.tsx`             | View states, edit toggle, stats display.                          |

## TDD plan

1. `db/__tests__/users.test.ts` (+) → impl `updateUser`.
2. `db/__tests__/users-stats.test.ts` → impl `getUserStats` (counts + win% over `match_seats` + `matches`).
3. `server/__tests__/profile-routes.test.ts` → impl `profiles/routes.ts`.
4. `ui/__tests__/ProfileScreen.test.tsx` → impl `ProfileScreen`.
5. App + chip wiring.

## Live smoke (manual, after deploy)

Once CI deploys this iteration, run from a local shell against
`https://belote.3btechsolutions.com`:

```bash
# 1. Sign up
curl -i -c /tmp/c.txt -X POST https://belote.3btechsolutions.com/api/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"smoke@x.com","password":"hunter22-pw","nickname":"Smoke"}'
# expect: 200 + Set-Cookie

# 2. /api/auth/me confirms the cookie works
curl -b /tmp/c.txt https://belote.3btechsolutions.com/api/auth/me
# expect: { kind: "user", id, nickname: "Smoke", email: "smoke@x.com" }

# 3. /api/matches empty
curl -b /tmp/c.txt https://belote.3btechsolutions.com/api/matches
# expect: { matches: [] }

# 4. /api/friends empty
curl -b /tmp/c.txt https://belote.3btechsolutions.com/api/friends
# expect: { friends: [], incoming: [], outgoing: [] }

# 5. /api/users/:id (self)
ME=$(curl -s -b /tmp/c.txt https://belote.3btechsolutions.com/api/auth/me | jq -r .id)
curl -b /tmp/c.txt https://belote.3btechsolutions.com/api/users/$ME
# expect: { id, nickname, email, stats: { total: 0, wins: 0, winRate: 0 } }

# 6. PATCH nickname
curl -b /tmp/c.txt -X PATCH https://belote.3btechsolutions.com/api/users/me \
  -H 'content-type: application/json' \
  -d '{"nickname":"Smokey"}'
# expect: 200 + updated profile

# 7. Logout
curl -b /tmp/c.txt -X POST https://belote.3btechsolutions.com/api/auth/logout
# expect: 204

# 8. /api/auth/me now 401
curl -b /tmp/c.txt -i https://belote.3btechsolutions.com/api/auth/me
# expect: 401
```

Browser smoke: open the deployed URL, sign in as the smoke user,
visit Profile, edit nickname, refresh — see the new nickname in
the IdentityChip + Profile.

## Out of scope

- Email change, password change.
- Avatar upload (URL-only for now).
- Online presence indicators on profiles / friend rows.
- Match-detail page.

## Validation

- `pnpm test` — green. Expected delta ≈ +25.
- `pnpm typecheck` / `format:check` — clean.
- `pnpm lint` — delta-clean.
- `pnpm --filter ui exec vite build` — clean.
- Live smoke — all 8 curl steps return the expected statuses.

## Closing note

024 closes the initial "real backend" arc:

- 019 — auth foundation
- 020 — WS identity wiring
- 021 — visible auth UI
- 022 — match history
- 023 — friends
- 024 — profile + final live smoke

Anything beyond (online presence push, invite-to-room deep link,
avatar upload, match-detail, password reset, OAuth) lives in a
fresh track.
