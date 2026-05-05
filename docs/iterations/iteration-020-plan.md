# Iteration 020 — WS identity wiring + pre-WS guest flow

> Second iteration of the "real backend" track. Picks up the WS-side
> work that was scope-cut from 019 so the gateway can attribute every
> connection to a user or a guest. No new persistence schema in this
> iteration; just wiring 019's cookie machinery through to the
> long-lived WS connection and exposing the identity to the frontend.

## Goal

1. Extend `@belote/protocol` so `hello_ack` carries an optional
   `identity: { kind: "user" | "guest"; id; nickname; avatarUrl? }`.
2. `Gateway` accepts a `Db`, parses the `belote.sid` cookie from the
   upgrade `IncomingMessage`, resolves it to a session, and attaches
   `userId` / `guestId` to its per-client `ClientContext`. The
   `hello_ack` it sends includes the resolved identity (when any).
3. Frontend (`useOnlineLobby`) calls `GET /api/auth/me` before opening
   the WS; on 401 it `POST`s `/api/auth/guest` to mint a guest cookie;
   then opens the WS so the upgrade carries the cookie. The lobby hook
   exposes the identity from `hello_ack` to consumers.
4. No UI presentation of the identity yet — that lives in the eventual
   UI sweep iteration. Surfacing it through the hook is enough to
   unblock 021 (match history).

What this iteration does **not** ship: profile read/write API, stats,
match history, friends, or any header avatar / name chrome.

## Decisions

| Decision                                             | Choice                                                             | Why                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cookie source on WS upgrade                          | Read from `request.headers.cookie` in the `wss.connection` handler | The `ws` library already exposes the `IncomingMessage` to the connection event when we opt in; no need to switch to manual `httpServer.on('upgrade')`. Avoids the Set-Cookie-on-101 awkwardness — the cookie is already minted by an earlier HTTP call, the WS upgrade just **carries** it. |
| Cookie parsing                                       | Hand-rolled (10 LOC), not `cookie` package                         | One-liner; adding a dep to parse `name=value; name=value` is overkill.                                                                                                                                                                                                                      |
| `hello_ack.identity` shape                           | `{ kind, id, nickname, avatarUrl? }` — no `email`                  | Email is PII; `hello_ack` is a server→client envelope received before the client has done anything. Email can be exposed later via `/api/auth/me` only.                                                                                                                                     |
| Identity is optional on `hello_ack`                  | Yes (older clients still work, anon-cookie paths still work)       | Lets the gateway operate without a Db (tests, dev), and accepts upgrades without a cookie (legacy clients, curl smoke).                                                                                                                                                                     |
| Pre-WS flow runs unconditionally                     | Yes — every page-load fetches `/me` before opening WS              | The cost is one HTTP round-trip on first load; subsequent opens reuse the cookie. Simpler than a "try-without-cookie, fall back to guest mint" branch on the WS open event.                                                                                                                 |
| Don't drop the existing `hello { nickname }` message | Keep it for now; iteration 023 (UI sweep) reconsiders              | Anonymous transient nickname-only play (without a guest row) still works as a fallback if the auth fetches fail. Removing `hello` would orphan that path before we have a full UX answer.                                                                                                   |
| Test the gateway change with the real WS harness     | Yes — extend `gateway.integration.test.ts`                         | An `app.inject()`-style mock can't simulate the cookie-on-upgrade behaviour faithfully. The existing harness already spins up an `http.createServer` we can attach the gateway to, with a real `WebSocket` client setting the `cookie` header.                                              |

## Files to add / touch

### Modified: `packages/protocol/`

| File                         | Change                                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`               | `ServerMessage` `hello_ack` branch grows optional `identity`. New exported `Identity` type. Validator `isServerMessage` validates the optional field shape. |
| `__tests__/messages.test.ts` | Cases: `hello_ack` w/ user identity, w/ guest identity, w/o identity (still valid), invalid identity shape rejected.                                        |

### Modified: `packages/server/`

| File                                    | Change                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/gateway.ts`                        | New optional config field `db?: Db`. `_handleConnection(ws, request)` (request now passed). Parse `belote.sid` from `request.headers.cookie`. If present + `db` is set, resolve via `findSessionByToken` + lookup user/guest. Attach `userId` / `guestId` to `ClientContext`. Send identity in `hello_ack`. When no `db` or no cookie, behaviour is exactly as today. |
| `src/bin/serve.ts`                      | Pass the existing `db` into `new Gateway(wss, { db })`.                                                                                                                                                                                                                                                                                                               |
| `__tests__/gateway.integration.test.ts` | New cases: connection with valid user-cookie carries identity in hello_ack; with valid guest-cookie carries guest identity; without cookie omits identity (back-compat).                                                                                                                                                                                              |

### Modified: `packages/ui/`

| File                                    | Change                                                                                                                                                                                                                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/online/ensureSession.ts` (new)     | `ensureSession(): Promise<Identity>` — `fetch('/api/auth/me', { credentials: 'include' })`; on 401, `fetch('/api/auth/guest', { method: 'POST', credentials: 'include' })`; throws on network error.                                                                                                            |
| `src/online/useOnlineLobby.ts`          | Before instantiating `OnlineClient`, call `ensureSession`. Hold the identity in state, expose via the `OnlineLobbyState`. On `hello_ack` with `identity`, prefer the wire value (it reflects the resolved server-side state). Keep `nickname` semantics for now; new identity is **additional**, not replacing. |
| `__tests__/useOnlineLobby.test.tsx`     | Mock `fetch`. Cases: 401-then-guest path; 200-user-path; surface from `hello_ack` overrides preflight identity.                                                                                                                                                                                                 |
| `__tests__/ensureSession.test.ts` (new) | Mock `fetch`. Cases: 200 returns identity; 401 → POST guest succeeds; both fail → throws.                                                                                                                                                                                                                       |

## TDD plan

Order:

1. **Protocol** — `messages.test.ts` failing cases for `hello_ack.identity` shape; impl extension to types + validator. Smallest blast radius.
2. **`ensureSession.ts`** — pure function, just `fetch` orchestration; testable with `vi.mock("global", () => ({ fetch: ... }))`.
3. **Gateway** — add Db option + cookie parsing + identity attachment. Extend `gateway.integration.test.ts` to set the `cookie` header on the test client and assert `hello_ack` carries the right shape.
4. **`useOnlineLobby`** — preflight ensureSession + surface identity from hello_ack.

## Out of scope

- Profile read / write routes (`GET/PATCH /api/users/:id`) — moves to iteration 021.
- Match history schema + recording — moves to 022.
- Friends — moves to 023.
- UI presentation of the identity (header avatar, name chip, etc.) — moves to the UI sweep iteration.
- Removing the legacy `hello { nickname }` client message — kept for back-compat through this iteration; reconsider during the UI sweep.

## Validation

- `pnpm test` — green. Expected delta ≈ +12.
- `pnpm typecheck` — clean. New optional field on `hello_ack` is non-breaking for existing consumers.
- `pnpm lint` — delta clean over baseline (175).
- `pnpm format:check` — clean.
- Manual smoke: with the deployed image,
  ```
  curl -s -c c.txt -X POST https://belote.3btechsolutions.com/api/auth/guest
  # → cookie minted
  wscat -H "cookie: $(awk '/belote.sid/{print "belote.sid=" $7}' c.txt)" \
        -c wss://belote.3btechsolutions.com/ws
  # → first inbound message is hello_ack with identity.kind === "guest"
  ```

## Carryforward to iteration 021

- Match history can now reference `userId` / `guestId` from the `ClientContext` at game-end. The `_formMatch` / `_handleCreateRoom` / `_handleJoinRoom` paths all populate `ctx.userId`/`ctx.guestId` automatically.
- The `nickname` field on `ClientContext` and `hello { nickname }` message become redundant once the UI sweep lands — leave them for now; remove in 023.
- If we ever want to **prevent** anonymous play (gated mode), it's a one-line change in `_handleCreateRoom` / `_handleJoinRoom`: reject if `!ctx.userId && !ctx.guestId`.
