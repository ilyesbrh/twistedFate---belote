# Iteration 019 Report — Auth foundation (db package + sessions)

**Date**: 2026-05-05
**Status**: Complete
**Test delta**: 705 → 769 (+64)

> Overwrites the pre-reset 019 report (menu visual makeover) per the
> numbering-reset convention noted in CLAUDE.md.

## Goal

Lay the persistence + identity primitives every later iteration in the
"real backend" track will consume:

1. New `@belote/db` workspace package — schema + queries.
2. HTTP auth routes on the existing Fastify instance:
   `POST /api/auth/{signup,login,logout,guest}`, `GET /api/auth/me`.
3. Session cookie with WS-friendly attrs.
4. Guest-allowed identity model (anonymous play preserved).

No UI in this iteration — fully server-side.

## Decisions taken (during execution)

| Decision                                  | Why                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node:sqlite` instead of `better-sqlite3` | The original plan paired `better-sqlite3` with Kysely. On Windows + Node 25 the prebuild was missing and the source build needs Visual Studio Build Tools — a sharp dev cliff. Pivoted to Node's built-in `node:sqlite`: zero native deps, same engine. Kysely was dropped along with it (raw SQL with typed wrappers is lighter for our scope). |
| Node engine bumped to ≥24                 | `node:sqlite` is stable from Node 24. Aligned local engine, CI workflow node-version, and the Docker base image (`node:24-bookworm-slim`).                                                                                                                                                                                                       |
| WS upgrade wiring deferred to 020         | Doing it cleanly meant changing the `hello_ack` wire shape to carry identity, which cascades into `OnlineClient` and the lobby hook. Scope-cut to keep this iteration server-only. Iteration 019 instead ships `POST /api/auth/guest` as the explicit pre-WS guest-mint route the client will call before connecting.                            |
| `experimental` warning ignored            | Node still emits a once-per-process `ExperimentalWarning: SQLite is an experimental feature`. Surface stability is fine; the warning is a fact, not a defect.                                                                                                                                                                                    |

## TDD trail

Order of red→green:

1. **`hash.test.ts`** (7 cases) — scrypt PHC encode/verify, salt randomness, malformed-hash rejection, length-stable output. → impl `hash.ts` (PHC `$scrypt$N=...,r=...,p=...$<salt>$<key>`, `crypto.scrypt` + `timingSafeEqual`).
2. **`migrations.test.ts`** (7 cases) — bookkeeping table creation, idempotency, version ordering, FK + CHECK enforcement at schema level. → impl `openDb.ts` (PRAGMAs: `foreign_keys=ON`, `journal_mode=WAL` off-memory only) + `migrations/runMigrations.ts` (forward-only, transactional per file) + `migrations/0001_init.sql`.
3. **`users.test.ts`** (9 cases) — hash never stored plain, email normalized lowercase, duplicate email rejected, lookup case-insensitive, password verify pass/fail. → impl `queries/users.ts`.
4. **`guests.test.ts`** (7 cases) — `Guest-XXXX` default, custom nickname, distinct ids, FK on upgrade. → impl `queries/guests.ts`.
5. **`sessions.test.ts`** (9 cases) — raw token returned once, sha256 stored, expired-on-read deletion, sweep, no-op delete, opaque token tampering rejection. → impl `queries/sessions.ts`.
6. **`auth.test.ts`** (15 cases) — full route coverage via `app.inject()`: signup ok / dup-409 / weak-pw-400 / missing-nickname-400; login ok / wrong-pw-401 / unknown-email-401 (same shape, no enumeration); logout clears cookie + DB row, idempotent; guest mint, custom nickname, /me round-trip; /me 401 / 200 / tampered-cookie-401. → impl `auth/cookie.ts`, `auth/sessionPlugin.ts` (`FastifyPluginCallback`), `auth/routes.ts`.

## Files added

```
packages/db/
  package.json                    (deps: nanoid; everything else built-in)
  tsconfig.json
  vitest.config.ts
  src/index.ts                    (barrel)
  src/openDb.ts                   (DatabaseSync factory + PRAGMAs)
  src/hash.ts                     (scrypt PHC)
  src/queries/users.ts
  src/queries/guests.ts
  src/queries/sessions.ts
  src/migrations/0001_init.sql
  src/migrations/runMigrations.ts
  __tests__/hash.test.ts
  __tests__/migrations.test.ts
  __tests__/users.test.ts
  __tests__/guests.test.ts
  __tests__/sessions.test.ts

packages/server/src/auth/
  cookie.ts                       (SESSION_COOKIE, set/clear helpers)
  sessionPlugin.ts                (FastifyPluginCallback decorating req.session)
  routes.ts                       (signup/login/logout/guest/me)
packages/server/__tests__/
  auth.test.ts                    (15 inject() cases)
```

## Files modified

- `package.json` — engines.node bumped `>=20.0.0` → `>=24.0.0`.
- `packages/server/package.json` — added `@belote/db`, `@fastify/cookie`, `fastify-plugin`.
- `packages/server/src/bin/serve.ts` — opens DB, runs migrations on startup, registers cookie plugin + sessionPlugin + auth routes; SPA fallback now also excludes `/api/`.
- `Dockerfile` — `node:20-bookworm-slim` → `node:24-bookworm-slim` (build + runtime); copies `packages/db` into both stages; declares `/data` volume + `DB_PATH=/data/belote.db`.
- `deploy/docker-compose.yml` — named volume `belote_data` mounted at `/data`; `DB_PATH` env wired.
- `.github/workflows/server-deploy.yml` — `node-version: 22` → `node-version: 24`.

## Validation

- `pnpm test` — **769 / 769 green** (was 705; +64 new: 39 in db, 15 in server auth, plus 10 absorbed back when their parse errors disappeared from the lint baseline).
- `pnpm typecheck` — clean across composite refs.
- `pnpm format:check` — clean (auto-formatted then committed).
- `pnpm lint` — **175 problems**, vs **188 baseline** → delta-clean (−13).
- Local smoke: `pnpm --filter @belote/server dev`, then:
  ```
  curl -i -c c.txt -X POST localhost:4100/api/auth/signup \
    -H 'content-type: application/json' \
    -d '{"email":"a@b.c","password":"hunter22-pw","nickname":"Alice"}'
  # → 200 + Set-Cookie: belote.sid=…
  curl -b c.txt localhost:4100/api/auth/me
  # → {"kind":"user","id":…,"email":"a@b.c","nickname":"Alice","avatarUrl":null}
  ```

## Trade-offs surfaced

- **`node:sqlite` is still experimental.** The surface we use is the boring core (`prepare`/`run`/`all`/`get`/`exec`); it's been stable for several Node releases. If Node ever breaks API compat, swapping in `@libsql/client` is one-file-of-changes (only `openDb.ts` + the small set of `db.prepare(...).run/all/get` call sites in our own modules).
- **No Kysely.** Queries are raw SQL — typed only at the wrapper boundary, not at the DSL level. For 4 tables + ~12 queries this is the right call. If we add 5+ more tables with cross-cutting joins we should revisit.
- **Auth is email/password only.** Magic links / Google OAuth are easy to bolt on later as additional `auth/*` routes — the cookie/session machinery is provider-agnostic.
- **No CSRF tokens.** Mitigated by `sameSite=lax` + `httpOnly` for the session cookie. Sufficient for the surface in this iteration; revisit when adding state-changing GET routes (which we won't have) or third-party-embed scenarios.

## Carryforward to iteration 020

- **Wire identity into the WS gateway.** Modify `Gateway._handleConnection` to accept the upgrade `IncomingMessage`, parse the cookie, resolve via `findSessionByToken`, and attach `userId` / `guestId` to `ClientContext`. Extend `hello_ack` in `@belote/protocol` with `identity?: { kind, id, nickname, avatarUrl? }`. Update `OnlineClient` to surface that to `useOnlineLobby`.
- **Frontend pre-WS guest mint.** Before opening the WS, the lobby calls `GET /api/auth/me`; if 401, calls `POST /api/auth/guest`; then opens the WS with the cookie set. Avoids touching the WS upgrade response headers.
- **Profile read/write API** is the headline of 020 (originally 020 in the plan).
- **Dependency sweep.** When 020 lands the gateway change, drop the `nickname` field from the `hello` message — server already knows who you are.

## Notes for the next reader

- The `_migrations` table is updated transactionally per file. If a future migration partially fails, the DB is left at the previous version — re-running after a fix is safe.
- `data/belote.db` is gitignored (added implicitly because the dir doesn't exist in repo). The host volume preserves it across image deploys.
- `experimental SQLite` warning is emitted once per process. Don't suppress globally — its presence is a useful canary if Node ever ships a breaking change.
