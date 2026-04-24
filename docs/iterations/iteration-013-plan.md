# Iteration 013 — Online multiplayer (Friends mode)

## Goal

Four friends play a full Belote Coinchée round online using a room code. No AI; no login; no persistence. Same rules engine on client and server — the server is authoritative, clients send intents.

## Out of scope (this iteration)

- **Random** matchmaking (button visible but disabled — "Coming soon").
- **Ranked** mode (button visible but disabled).
- Accounts / auth / OAuth.
- Persistent room history, chat beyond what the client already has.
- Reconnection after disconnect (room is dropped if anyone leaves mid-game, v1).
- Deployment / hosting. Local dev only.

## Architecture

### New packages

- **`@belote/protocol`** — wire protocol: `ClientMessage` / `ServerMessage` discriminated unions + runtime validators. Zero runtime deps. Consumed by both server and UI.
- **`@belote/server`** — `Room`, `RoomRegistry`, command→event translation, Fastify + `ws` transport. Imports `@belote/core`, `@belote/app`, `@belote/protocol`.

### Runtime topology

```
┌──────────┐   ws JSON    ┌──────────────┐
│ UI (web) │ ──────────── │ @belote/server│
└──────────┘              │  ┌──────────┐│
                          │  │  Room    ││   owns:
                          │  │          ││   - code "ABCD"
                          │  │          ││   - 4 sockets[] (seat → ws)
                          │  │          ││   - GameSession (from @belote/app)
                          │  └──────────┘│
                          └──────────────┘
```

### Protocol (draft)

**Client → Server**

- `hello { clientId: string, nickname: string }` — opening handshake.
- `create_room {}` → `room_created { code, seat }`.
- `join_room { code }` → `room_joined { seat, players }` or `error`.
- `start_game { targetScore }` — any seated player can trigger once the room is full.
- `place_bid { type, value?, suit? }` — dispatched via `@belote/app`.
- `play_card { cardId }` — dispatched via `@belote/app`.
- `ping` / `pong`.

**Server → Client**

- `room_created { code, seat }`
- `room_joined { seat, players }`
- `player_joined { seat, nickname }` / `player_left { seat }`
- `public_state { phase, bids, contract, tricks, scores }` — authoritative public state snapshot.
- `private_state { hand, legalActions }` — sent only to the seat whose hand it is.
- `event { ... }` — passthrough of domain events (trick_completed, round_completed, …) for animation cues.
- `error { reason, code }` — for invalid actions.

All messages are tagged unions on `type`, validated server-side and client-side.

### Authority model

Server owns a single `GameSession`. Clients never mutate local game state directly. Flow:

1. Client sends `place_bid` / `play_card` intent.
2. Server validates via `@belote/core` (`isValidBid` / `getValidPlays`).
3. If valid: server dispatches through `GameSession`, receives events, broadcasts updated `public_state` + targeted `private_state` to each seat.
4. If invalid: server replies `error` to the originator only.

### Per-seat privacy

Hands are secret. The server broadcasts `public_state` to all sockets and a seat-specific `private_state` only to that seat's ws connection.

## Iteration breakdown

### 013-A — `@belote/protocol` package (unit)

- New pnpm workspace package.
- TypeScript types for every message shape.
- Hand-rolled validator functions `isClientMessage(msg)` / `isServerMessage(msg)` (no Zod dep — matches `@belote/core` zero-dep philosophy). Each message variant has its own validator.
- Unit tests for each variant + invalid payload rejection.

### 013-B — `@belote/server` room logic (unit, no network)

- `Room` class: create, join, leave, seat assignment (0..3), start game, dispatch bid/card, translate events to `public_state` + `private_state` broadcasts.
- `RoomRegistry`: code generation (4 char, collision-free), lookup, deletion.
- Pure tests — no ws: feed a mock `Broadcaster` interface and assert the messages it receives.

### 013-C — WebSocket transport (integration)

- Fastify server exposing `/ws`. Each connection goes through a router calling `Room`.
- Integration test using `ws` client library: 4 real connections, create/join/start/pass-pass-pass-pass → round begins.

### 013-D — UI: mode-select + online lobby

- New `ModeSelectScreen` replacing the current direct-to-game start. 4 buttons: AI (current), Friends, Random (disabled), Ranked (disabled).
- New `OnlineLobby` component: create-room or join-room. Shows 4 seats filling in.
- New `useOnlineSession` hook: connects to ws, maintains state from server messages, exposes the same `GameSessionState` shape so `GameTable` renders unchanged.
- Playwright smoke: menu → Friends → create → code shown.

### 013-E — Full e2e (gate)

- Playwright drives 4 browser contexts.
- Host creates room → code copied → 3 contexts join → host clicks Start → each context plays a card when it's its seat's turn → round completes → all four show RoundSummary.
- This test is the **done gate** for online Friends mode.

## Per-iteration quality gates

All 4 checks must pass before moving to the next iteration:

- `pnpm test` (unit + integration)
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- The iteration's own smoke/e2e test.

## Deferred follow-ups

- Reconnection window.
- Random matchmaking (pool 2→4 players).
- Ranked ELO + persistence.
- Deploy to a host (Fly/Render/Hetzner) with TLS and sticky sessions.
- Auth (email or Google).
- Server-side chat relay (currently chat is local).

## Commit cadence

One commit per sub-iteration, with its own short report in `docs/iterations/iteration-013-{A|B|C|D|E}-report.md`.
