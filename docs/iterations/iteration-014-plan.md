# Iteration 014 — Random matchmaking

## Goal

Enable the **Random** entry on `ModeSelectScreen` (currently disabled / "Coming soon").
Four players who don't know each other can join a global queue, get auto-paired
into a fresh authoritative `Room`, and start a Belote Coinchée game with the
exact same in-game UX as Friends mode.

## Out of scope (this iteration)

- AI fill when fewer than 4 humans are queued — random mode requires 4 humans.
- Skill / region / latency-based matching — single global FIFO queue.
- Persistent match history, MMR, ranking — those belong to "Ranked".
- Reconnection back into a matchmade game once playing has started — same
  reconnect path as Friends (matchmade rooms produce a `playerToken`); the user
  flow into the queue itself is single-shot.
- Visible "N other players in queue" leaderboard. The UI shows only this
  player's queue position (`i / 4`).

## Architecture

### Pure core (TDD anchor)

New module `packages/server/src/matchmakingQueue.ts`:

```ts
export interface QueueEntry {
  readonly clientId: string;
  readonly nickname: string;
}

export interface MatchResult {
  readonly matched: true;
  readonly group: readonly [QueueEntry, QueueEntry, QueueEntry, QueueEntry];
}

export class MatchmakingQueue {
  enqueue(entry: QueueEntry): MatchResult | { matched: false; position: number };
  cancel(clientId: string): boolean;
  has(clientId: string): boolean;
  readonly size: number;
}
```

Behaviour:

- FIFO. When `size` reaches 4 on `enqueue`, the four head entries are popped
  and returned as `group`.
- `enqueue` for an already-queued `clientId` is a no-op; returns the existing
  `{ matched: false, position }`.
- `cancel` returns `true` only if the client was in the queue.
- Pure: zero side effects, zero dependencies. Fully unit-tested.

### Protocol additions

Add to `ClientMessage`:

- `{ type: "find_random"; nickname: string }` — enter the queue.
- `{ type: "cancel_random" }` — leave the queue.

Add to `ServerMessage`:

- `{ type: "queued"; position: number; size: number }` — broadcast to all
  queued clients each time the queue size changes (entry, exit, match).
- `{ type: "match_cancelled" }` — confirmation of explicit cancel.
- `{ type: "match_found"; code; seat; playerToken; players }` — analogous to
  `room_joined`, but carries the matchmaking origin so the UI can choose its
  transition. (Same payload shape as `room_joined`.)

`hello` is folded into `find_random` (it carries the nickname directly), so
matchmaking does not require a prior handshake.

### Gateway integration

`Gateway` owns a single `MatchmakingQueue` instance. New dispatch branches:

- `find_random` → enqueue; if matched, `_registry.createRoom`, `room.join` each
  member in order, send each `match_found` with their own seat/token, and
  broadcast `queued` updates to anyone still in the queue.
- `cancel_random` → `cancel`; send `match_cancelled` to the canceller and a
  refreshed `queued` to the rest.
- `ws.close` → if the client was queued, cancel them (mirror friends-mode
  `markDisconnected`).

The matchmade `Room` reuses the existing `Broadcaster` shape — it's just a
fresh per-room members map populated up-front with all 4 clients.

### UI

- `ModeSelectScreen`: flip `random.disabled` to `false`, drop the "Coming soon"
  subtitle.
- New screen `OnlineRandomMatchmakingScreen` (or a new phase in the existing
  `OnlineLobby`):
  - Nickname input → "Find a game" button.
  - While searching: shows "Searching… N/4" with a Cancel button.
  - On `match_found`: transitions to the same in-game view as Friends mode.
- `useOnlineLobby` (or a new sibling hook `useOnlineMatchmaking`) handles
  `find_random` / `cancel_random` / `queued` / `match_found` / `match_cancelled`
  and exposes `phase: "queued" | "in_room" | …`.

Choice: extend `useOnlineLobby` with the matchmaking states rather than a
parallel hook, since the `OnlineClient` connection is single-socket and both
flows converge on the same `in_room` state once a room exists.

## TDD order

Strict TDD. Each step writes failing tests first, then implementation.

1. **`matchmakingQueue.test.ts`** — pure queue logic.
   - empty queue: `size === 0`, `has` returns false, `cancel` returns false
   - single enqueue → `{ matched: false, position: 1 }`, `size === 1`
   - re-enqueue same client → still `{ matched: false, position: 1 }`, `size === 1`
   - 3 different enqueues → all unmatched, positions `1, 2, 3`
   - 4th distinct enqueue → `{ matched: true, group }` with the 4 entries in
     FIFO order; `size === 0` after
   - `cancel` of queued client → `true`, `size` decrements; subsequent
     `enqueue` of same client succeeds with new position
   - `cancel` of non-queued client → `false`
   - 5 enqueues, 4 are matched, 5th remains queued at position 1
2. **`protocol`** — extend `ClientMessage` / `ServerMessage` discriminated
   unions and validators; add unit tests for the new branches.
3. **`gateway.integration.test.ts`** — new tests for matchmaking flows:
   - 4 clients each send `find_random` with different nicknames; all 4 receive
     `match_found` with the same `code`, distinct seats, and a populated
     `players[]` list.
   - 1 client `find_random` then `cancel_random` → receives `queued` then
     `match_cancelled`; queue is empty after.
   - 2 clients in queue receive `queued` updates with `size: 2` then `size: 1`
     when one cancels.
4. **UI**:
   - `ModeSelectScreen.test.tsx` — `mode-btn-random` is no longer disabled and
     calling `onSelect("random")` fires once when clicked.
   - Lobby hook test (or component test) — `phase` transitions from `idle` →
     `queued` → `in_room` on the right messages.
5. **Smoke test** — `scripts/smoke-iteration-014.mjs` — four browser contexts
   pick "Random", all four see "Searching…", all four transition into the same
   game.

## Validation

- `pnpm test` — all green, expected delta ≈ +25–35 tests.
- `pnpm typecheck` — clean.
- `pnpm lint` / `pnpm format:check` — clean.
- Smoke script runs end-to-end against `pnpm --filter @belote/server dev` +
  `pnpm --filter @belote/ui dev`.
