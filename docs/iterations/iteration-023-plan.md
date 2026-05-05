# Iteration 023 — Friends (schema, routes, panel UI)

> Fifth iteration of the "real backend" track. Adds a friends graph
> on top of the auth foundation. After 023 a logged-in user can
> search by email, send a friend request, accept incoming requests,
> and see their friends list.

## Goal

1. **Schema migration `0003_friendships.sql`** — one row per
   directed friendship attempt; symmetry enforced by checking both
   directions when listing.
2. **Friend queries**: `sendFriendRequest`, `acceptFriendRequest`,
   `rejectFriendRequest`, `cancelFriendRequest`, `removeFriend`,
   `listFriends`, `listIncomingRequests`, `listOutgoingRequests`.
3. **HTTP routes** under `/api/friends` (all require a user session,
   401 for guests):
   - `GET /api/friends` → `{ friends, incoming, outgoing }`
   - `POST /api/friends/requests` (body: `{ email }`) → 201 / 404 / 409
   - `POST /api/friends/requests/:id/accept`
   - `POST /api/friends/requests/:id/reject`
   - `DELETE /api/friends/requests/:id` (cancel sent)
   - `DELETE /api/friends/:friendUserId` (remove friend)
4. **`FriendsScreen` UI**: friends list + pending sections; add-friend
   form (email input).
5. **IdentityChip** gains a "Friends" item for users.

What this iteration does **not** ship: online presence indicators,
"invite to room" deep linking, friend-of-friend UI. Those land in
024 alongside the profile page.

## Decisions

| Decision                                                  | Choice                                                                                        | Why                                                                                                                                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Friendship is a single asymmetric row with a status field | `requester_user_id`, `addressee_user_id`, `status`                                            | Simpler than two-row symmetric models. Status fields: `pending` / `accepted` / `rejected`. List queries union both directions when status = accepted.                     |
| Look up by email, not by user id                          | `POST /api/friends/requests` takes `{ email }`                                                | Users don't see other users' opaque ids. Email is the only handle they have until usernames or friend-codes ship.                                                         |
| Reject vs cancel                                          | Reject = addressee declines incoming. Cancel = requester withdraws sent. Both DELETE the row. | Different verbs for different actors; same DB effect; cleanly named routes.                                                                                               |
| One pending request between two users at a time           | UNIQUE constraint on `(requester_user_id, addressee_user_id)` plus a check at request time    | Prevents accidental dup requests; sending again after a reject re-creates the row (we delete on reject).                                                                  |
| No request to yourself                                    | Server-side guard                                                                             | Trivial to enforce; UI can also disable the form when the email matches the current user's.                                                                               |
| Removing a friend deletes the row entirely                | DELETE both directions if any exist                                                           | After removal, either user can re-send a fresh request.                                                                                                                   |
| Existing IdentityChip dropdown vs separate panel screen   | Separate screen (`screen === "friends"`)                                                      | The chip dropdown is already showing 2-3 items; cramming a multi-section list into it would be ugly. Full-screen panel matches HistoryScreen patterns established in 022. |
| Rate-limit friend requests                                | Out of scope for now                                                                          | Worth doing eventually; trivial DOS surface today (no spam vector reaches this code), so deferring to a later iteration.                                                  |

## Schema (migration `0003_friendships.sql`)

```sql
CREATE TABLE friendships (
  id                  TEXT PRIMARY KEY,                       -- nanoid
  requester_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL,
  CHECK (requester_user_id <> addressee_user_id),
  UNIQUE (requester_user_id, addressee_user_id)
);

CREATE INDEX friendships_requester ON friendships(requester_user_id);
CREATE INDEX friendships_addressee ON friendships(addressee_user_id);
```

Note: rejected requests are deleted, not stored. Re-sending after a
reject creates a fresh row.

## Files to add / touch

### `packages/db/`

| File                                  | Purpose                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `src/migrations/0003_friendships.sql` | Schema                                                                      |
| `src/queries/friends.ts`              | All eight functions listed above; transactional where two rows could match. |
| `src/index.ts`                        | Re-exports.                                                                 |
| `__tests__/friends.test.ts`           | Per-function tests.                                                         |

### `packages/server/`

| File                               | Purpose                                                      |
| ---------------------------------- | ------------------------------------------------------------ |
| `src/friends/routes.ts`            | Five routes listed above.                                    |
| `src/bin/serve.ts`                 | Register friends routes alongside auth + match routes.       |
| `__tests__/friends-routes.test.ts` | inject-style coverage for each route, success + error cases. |

### `packages/ui/`

| File                                                           | Purpose                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/online/api/friends.ts`                                    | Typed wrappers.                                                          |
| `src/online/useFriends.ts`                                     | Hook: reads `/api/friends`; exposes mutations + auto-refetch on success. |
| `src/components/FriendsScreen/FriendsScreen.tsx + .module.css` | UI: friends list, incoming requests, outgoing requests, add-friend form. |
| `src/components/IdentityChip/IdentityChip.tsx`                 | Adds optional `onViewFriends` for users.                                 |
| `src/components/ModeSelectScreen/ModeSelectScreen.tsx`         | Forwards `onViewFriends`.                                                |
| `src/App.tsx`                                                  | New `screen === "friends"` state.                                        |
| `__tests__/FriendsScreen.test.tsx`                             | UI states.                                                               |
| `__tests__/IdentityChip.test.tsx`                              | + "Friends" item for users.                                              |

## TDD plan

1. `db/__tests__/friends.test.ts` → impl `db/queries/friends.ts` + migration.
2. `server/__tests__/friends-routes.test.ts` → impl routes.
3. `ui/__tests__/FriendsScreen.test.tsx` → impl UI.
4. `ui/__tests__/IdentityChip.test.tsx` (+) → chip item.
5. App + ModeSelect wiring.

## Out of scope

- Online-presence indicator (next to each friend).
- "Invite friend to current room" (deep link / WS push).
- Profile page (iteration 024).
- Friend-suggested matchmaking, friend-of-friend.

## Validation

- `pnpm test` — green. Expected delta ≈ +30.
- `pnpm typecheck` / `format:check` — clean.
- `pnpm lint` — delta-clean.
- `pnpm --filter ui exec vite build` — clean.
- Manual smoke after deploy: sign up two users (Alice, Bob) in two
  browser profiles. Alice sends a friend request to bob@x. Bob sees
  it under Incoming; clicks Accept. Both see each other under Friends.
  Either removes; the row disappears for both.

## Carryforward to iteration 024

- Profile page (`GET /api/users/:id`, `PATCH /api/users/me`) — uses
  the friend graph for "is this person my friend / friend-of-friend"
  visibility decisions.
- Online presence: gateway publishes a per-user "online" / "in_room"
  status that the FriendsScreen can subscribe to via the existing WS.
- "Invite to current room" button on each online friend in the panel.
