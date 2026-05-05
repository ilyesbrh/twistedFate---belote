# Iteration 019 — Auth foundation (db package + sessions)

> First iteration of the multi-iteration "real backend" track. Lays the
> persistence + identity primitives every later iteration consumes
> (profiles, stats, history, friends). No UI in this iteration —
> everything is server-side and protocol-side, driven by tests.

## Goal

Stand up:

1. A new `@belote/db` workspace package — Node's built-in `node:sqlite`
   (no native compile, no Kysely) + hand-written typed query wrappers +
   numbered SQL migrations. In-memory mode for tests, file-backed mode
   for runtime. Project Node engine bumped to ≥24 (CI + Docker base too)
   so `node:sqlite` is available.
2. Schema for `users`, `sessions`, and `guests`.
3. HTTP routes on the existing Fastify instance:
   - `POST /api/auth/signup` — email + password + nickname
   - `POST /api/auth/login` — email + password
   - `POST /api/auth/logout` — clears session cookie + DB row
   - `GET /api/auth/me` — current user (or guest) summary
4. A session cookie (`belote.sid`, httpOnly, sameSite=lax, secure in
   production, 30-day expiry).
5. WebSocket upgrade hook that resolves the cookie → user/guest and
   attaches identity to the WS connection. Anonymous connections get a
   guest row + cookie automatically (decision: guest-allowed, see
   "Decisions" below).

What this iteration does **not** ship: any UI, profile editing,
stats endpoints, match history recording, friends, or password reset.
Each of those is a later iteration.

## Decisions

| Decision         | Choice                                    | Why                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB engine        | SQLite via `node:sqlite` (Node built-in)  | Single-VPS deploy, zero ops, sub-ms reads, file-based backup. **Zero native deps** — no `better-sqlite3` build pain on Windows / new Node versions. Trade-off: `node:sqlite` is still flagged "experimental" but the surface we use (`prepare`/`run`/`all`/`get`/`exec`) has been stable for months. Migration to Postgres later means rewriting one driver file. |
| Query layer      | Hand-written SQL + typed wrappers         | For 4 tables and ~12 queries, Kysely's typed-DSL value is dominated by its setup cost. Raw SQL stays auditable; wrappers give compile-time row types where it matters.                                                                                                                                                                                            |
| Migrations       | Hand-rolled `.sql` files + tiny runner    | No extra tooling. Files numbered `0001_*.sql`, runner records applied versions in a `_migrations` table. Reversible-ness deferred — forward-only is fine for this stage.                                                                                                                                                                                          |
| Password hashing | `crypto.scrypt` (Node built-in)           | OWASP-acceptable, no native dep beyond what's already in Node, PHC-format storable as a single string. Avoids adding `argon2` or `bcrypt` native modules.                                                                                                                                                                                                         |
| Session token    | 32-byte random, stored hashed             | DB leak doesn't grant impersonation. Token-in-cookie is the bearer; only its sha256 lives in DB.                                                                                                                                                                                                                                                                  |
| Cookie flags     | httpOnly, sameSite=lax, secure (prod)     | XSS-resistant, CSRF-mitigated by sameSite, clear-text only over TLS in production.                                                                                                                                                                                                                                                                                |
| Guest path       | Allowed (anonymous play preserved)        | Removing it is a regression vs today. Guest = `guests` row + same cookie shape; converts to a real user on signup, history kept (history wiring is iteration 021).                                                                                                                                                                                                |
| DB file location | `process.env.DB_PATH ?? ./data/belote.db` | Mounted as a docker volume in compose so data survives image swaps. Tests use `:memory:`.                                                                                                                                                                                                                                                                         |

## Schema (migration `0001_init.sql`)

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,            -- nanoid, 21 chars
  email         TEXT NOT NULL UNIQUE,        -- normalized lower
  password_hash TEXT NOT NULL,               -- scrypt PHC string
  nickname      TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    INTEGER NOT NULL,            -- ms epoch
  updated_at    INTEGER NOT NULL
);

CREATE TABLE guests (
  id          TEXT PRIMARY KEY,              -- nanoid
  nickname    TEXT NOT NULL,                 -- defaulted to "Guest-XXXX"
  created_at  INTEGER NOT NULL,
  -- nullable FK: when a guest signs up, we set this to link history
  upgraded_to_user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE sessions (
  -- sha256(cookie token) — never store the raw token
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT REFERENCES users(id)  ON DELETE CASCADE,
  guest_id     TEXT REFERENCES guests(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  -- Exactly one of (user_id, guest_id) is set
  CHECK ((user_id IS NULL) <> (guest_id IS NULL))
);

CREATE INDEX sessions_user_id   ON sessions(user_id);
CREATE INDEX sessions_guest_id  ON sessions(guest_id);
CREATE INDEX sessions_expires   ON sessions(expires_at);

CREATE TABLE _migrations (
  version    INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
```

Why one `sessions` table for both kinds: the WS upgrade hook does one
lookup regardless of identity kind, and a guest→user upgrade is a
single column flip rather than a row migration.

## Files to add / touch

### New: `packages/db/`

| File                                   | Purpose                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `package.json`                         | deps: `better-sqlite3`, `kysely`, `nanoid`. devDeps: `vitest`, `tsx`.   |
| `tsconfig.json`                        | Mirror `packages/protocol/tsconfig.json`.                               |
| `src/index.ts`                         | Barrel: `openDb`, `runMigrations`, query modules, types.                |
| `src/schema.ts`                        | Kysely `Database` interface (typed row shapes).                         |
| `src/openDb.ts`                        | Factory: opens better-sqlite3, returns Kysely instance.                 |
| `src/migrations/0001_init.sql`         | Schema above.                                                           |
| `src/migrations/runMigrations.ts`      | Reads SQL files in order, applies missing versions.                     |
| `src/migrations/runMigrations.test.ts` | Idempotency, ordering, `_migrations` row written.                       |
| `src/queries/users.ts`                 | `createUser`, `findUserByEmail`, `findUserById`, `verifyPassword`.      |
| `src/queries/users.test.ts`            | Hash never stored plain, email normalized, duplicate email rejected.    |
| `src/queries/guests.ts`                | `createGuest`, `findGuestById`, `upgradeGuestToUser`.                   |
| `src/queries/guests.test.ts`           | Default nickname format, upgrade preserves id.                          |
| `src/queries/sessions.ts`              | `createSession`, `findSessionByToken`, `deleteSession`, `sweepExpired`. |
| `src/queries/sessions.test.ts`         | Token never stored plain (hash compared), expiry honoured, sweep works. |
| `src/hash.ts`                          | scrypt PHC encode/verify.                                               |
| `src/hash.test.ts`                     | Round-trip, wrong password rejected, hash format stable.                |

### Modified: `packages/server/`

| File                                   | Change                                                                                                                                                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                         | Add deps: `@belote/db: workspace:*`, `@fastify/cookie`.                                                                                                                                                                                         |
| `src/bin/serve.ts`                     | Open DB, run migrations on startup, register `@fastify/cookie`, register auth routes plugin.                                                                                                                                                    |
| `src/auth/sessionPlugin.ts` (new)      | Fastify plugin: decorates `request.session` (user/guest) by reading `belote.sid` cookie.                                                                                                                                                        |
| `src/auth/sessionPlugin.test.ts` (new) | Cookie absent → null session, valid cookie → resolved, expired → null + DB row deleted.                                                                                                                                                         |
| `src/auth/routes.ts` (new)             | The four auth endpoints.                                                                                                                                                                                                                        |
| `src/auth/routes.test.ts` (new)        | Per-route success + failure cases (see TDD plan).                                                                                                                                                                                               |
| `src/auth/cookie.ts` (new)             | Cookie name, attrs, helpers `setSessionCookie`, `clearSessionCookie`.                                                                                                                                                                           |
| `src/gateway.ts`                       | `_handleConnection` accepts the upgrade `IncomingMessage`, reads cookie, calls the resolver, attaches `userId` / `guestId` to `ClientContext`. Auto-mints a guest + cookie if no session present (Set-Cookie via the upgrade response headers). |

### Modified: `packages/protocol/`

| File                   | Change                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `src/messages.ts`      | `hello_ack` carries `{ identity: { kind: "user" \| "guest"; id; nickname; avatarUrl?: string } }`. |
| `src/messages.test.ts` | Schema validation for the new identity field.                                                      |

### Modified: deploy

| File                        | Change                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`                | Copy `packages/db` into both build and runtime stages. Install build deps for `better-sqlite3` in build stage (`python3`, `build-essential`); strip from runtime. |
| `deploy/docker-compose.yml` | Mount `/opt/belote/data:/app/data` for SQLite persistence. Set `DB_PATH=/app/data/belote.db`.                                                                     |

## TDD plan

Order of red→green, smallest unit first:

1. **`hash.test.ts`** — scrypt encode/verify round-trip. Smallest seam, fast.
2. **`runMigrations.test.ts`** — apply on empty DB writes 1 `_migrations` row; second call is a no-op; new `0002` file is picked up.
3. **`users.test.ts`** — `createUser` rejects duplicate email; email normalized to lowercase; `verifyPassword` true for the correct password and false otherwise; `password_hash` column never equals the plain password.
4. **`sessions.test.ts`** — `createSession` returns the raw token, stores `sha256(token)`; `findSessionByToken(raw)` resolves to the row; expired session not returned; `sweepExpired` deletes only past-expiry rows.
5. **`guests.test.ts`** — `createGuest` defaults nickname to `Guest-` + 4 hex; `upgradeGuestToUser` keeps the same `guests.id` and sets `upgraded_to_user_id`.
6. **`sessionPlugin.test.ts`** — Fastify request with no cookie → `request.session === null`; valid cookie → resolved user; expired cookie → null + DB row gone; tampered cookie → null.
7. **`auth/routes.test.ts`** — for each route:
   - `signup` 200 with cookie set, second signup with same email → 409.
   - `signup` weak password (< 8 chars) → 400.
   - `login` correct creds → 200 + cookie; wrong password → 401; unknown email → 401 (same shape, no enumeration).
   - `logout` with valid cookie → 204 + clear-cookie response; DB session row gone.
   - `me` no cookie → 401; valid user cookie → 200 with `{ kind: "user", id, nickname, email }`; valid guest cookie → 200 with `{ kind: "guest", id, nickname }`.
8. **`gateway.test.ts`** — extend the existing test to cover: a connection with no cookie receives a guest identity in `hello_ack` and a `Set-Cookie` header on the upgrade response.

Vitest discovery pattern matches existing convention (`*.test.ts` next
to source). For `routes.test.ts` we use Fastify's `app.inject()`, no
real socket required.

## Decisions deferred to later iterations

- **020** — profile read/write API (`GET/PATCH /api/users/:id`) + the
  derived stats query.
- **021** — `match_completed` event emitted from `@belote/core`'s
  game-end transition; server records into a `matches` table; basic
  history endpoint.
- **022** — friends: schema, request/accept routes, online presence via
  the gateway's existing connection registry.
- **023** — UI sweep: login, signup, profile, friends panel, history
  page, header chrome.

## Validation

- `pnpm test` — green. Expected delta ≈ +35 tests across the new files.
- `pnpm typecheck` — clean. New `@belote/db` `tsconfig.json` extends
  `tsconfig.base.json`.
- `pnpm lint` — delta clean over baseline (188 pre-existing parse errors
  on test files unchanged).
- `pnpm format:check` — clean.
- Manual smoke: `pnpm --filter @belote/server dev`, then
  `curl -i -X POST http://localhost:4100/api/auth/signup -H "content-type: application/json" -d '{"email":"a@b.c","password":"hunter22","nickname":"Alice"}'`
  → 200 with `Set-Cookie: belote.sid=…`. Hit `/api/auth/me` with that
  cookie → 200. Re-run with same email → 409.
- Manual WS smoke: connect via `wscat ws://localhost:4100/ws` with no
  cookie → first message is `hello_ack` with `identity.kind === "guest"`.

## Carryforward

- Note for 020: the profile route needs to enforce "user can only edit
  their own profile" — the session plugin already gives us
  `request.session.user.id`, so the rule is one line.
- Note for 021: `match_completed` should reference the `users.id` of
  each seat (or `guests.id` for unauthed players), not the in-memory
  `ClientContext.clientId`. Iteration 019 exposes `ws.userId ??
ws.guestId` on the per-client context, ready to be read at game end.
- Note for 023 (UI): the new `hello_ack.identity` field is the
  authoritative thing the lobby header should render; we'll wire it
  into `useOnlineLobby` then.
