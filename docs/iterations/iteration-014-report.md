# Iteration 014 Report — Random matchmaking

**Date**: 2026-05-04
**Status**: Complete
**Plan**: [iteration-014-plan.md](iteration-014-plan.md)

> Note: this file previously held a report for "TrickDisplay" from the
> pre-rebuild UI track. That work no longer exists in the current codebase;
> the file has been replaced with the active iteration 014 record.

## Goal

Enable the previously-disabled **Random** entry on `ModeSelectScreen`. Four
strangers join a global FIFO queue, the server auto-pairs them into a fresh
authoritative `Room`, and the in-game UX is identical to Friends mode.

## Scope delivered

1. Pure FIFO matchmaking queue (`MatchmakingQueue`).
2. Protocol additions: `find_random` / `cancel_random` (client → server) and
   `queued` / `match_cancelled` / `match_found` (server → client).
3. Gateway integration: matchmaking dispatch + ws-close cleanup.
4. UI: `ModeSelectScreen` enables Random; new `OnlineRandomScreen` for the
   nickname → searching → match flow; `useOnlineLobby` extended with the
   `queued` phase, `findRandom` / `cancelRandom`, and the new server message
   handlers; `App.tsx` routes the new mode through `OnlineRandomFlow` which
   reuses the existing `GameTableView` once the server reports a match.

## TDD trail

Strict TDD — each step landed red first.

| Step | Test file | Tests added | Notes |
| --- | --- | --- | --- |
| 1 | [packages/server/\_\_tests\_\_/matchmakingQueue.test.ts](../../packages/server/__tests__/matchmakingQueue.test.ts) | 11 | Pure logic: empty, enqueue, re-enqueue idempotency, FIFO matching, cancellation, position recompute, mid-queue cancel + match correctness. |
| 2 | [packages/protocol/\_\_tests\_\_/messages.test.ts](../../packages/protocol/__tests__/messages.test.ts) | 11 (additions) | Validators for `find_random`, `cancel_random`, `queued`, `match_cancelled`, `match_found` + negative cases (empty nickname, malformed code, missing fields). |
| 3 | [packages/server/\_\_tests\_\_/gateway.integration.test.ts](../../packages/server/__tests__/gateway.integration.test.ts) | 3 (additions) | Real `ws` clients: 4-way auto-pair end-to-end, cancel flow, queued client ws-close cleanup. |
| 4 | [packages/ui/\_\_tests\_\_/ModeSelectScreen.test.tsx](../../packages/ui/__tests__/ModeSelectScreen.test.tsx) | 6 | Random enabled, ranked still disabled, click routes correctly. |
| 5 | [packages/ui/\_\_tests\_\_/OnlineRandomScreen.test.tsx](../../packages/ui/__tests__/OnlineRandomScreen.test.tsx) | 8 | Idle vs queued render, nickname trimming, disabled states, error display, callbacks. |

**Net delta**: 610 → 646 tests (**+36** passing).

## Files

### Added

- [packages/server/src/matchmakingQueue.ts](../../packages/server/src/matchmakingQueue.ts)
- [packages/server/\_\_tests\_\_/matchmakingQueue.test.ts](../../packages/server/__tests__/matchmakingQueue.test.ts)
- [packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.tsx](../../packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.tsx)
- [packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.module.css](../../packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.module.css)
- [packages/ui/\_\_tests\_\_/ModeSelectScreen.test.tsx](../../packages/ui/__tests__/ModeSelectScreen.test.tsx)
- [packages/ui/\_\_tests\_\_/OnlineRandomScreen.test.tsx](../../packages/ui/__tests__/OnlineRandomScreen.test.tsx)
- [docs/iterations/iteration-014-plan.md](iteration-014-plan.md)

### Modified

- [packages/protocol/src/index.ts](../../packages/protocol/src/index.ts) — extended unions + validators
- [packages/protocol/\_\_tests\_\_/messages.test.ts](../../packages/protocol/__tests__/messages.test.ts) — new examples + negatives
- [packages/server/src/gateway.ts](../../packages/server/src/gateway.ts) — queue + dispatch + ws-close cleanup
- [packages/server/\_\_tests\_\_/gateway.integration.test.ts](../../packages/server/__tests__/gateway.integration.test.ts) — 3 matchmaking tests
- [packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx](../../packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx) — Random enabled
- [packages/ui/src/online/useOnlineLobby.ts](../../packages/ui/src/online/useOnlineLobby.ts) — `queued` phase, `findRandom` / `cancelRandom`, new message handlers
- [packages/ui/src/App.tsx](../../packages/ui/src/App.tsx) — `OnlineRandomFlow` wiring

## Validation

| Check | Status | Notes |
| --- | --- | --- |
| `pnpm test` | ✓ | 646 / 646 |
| `pnpm typecheck` | ✓ | clean |
| `pnpm lint` | delta clean | 178 errors, all pre-existing; iteration delta is **−1** |
| `pnpm format:check` | delta clean | 5 pre-existing files; iteration delta is **0** |

> Lint/format had 179 / 5 pre-existing issues before iteration 014 — none in
> files this iteration touched. The matchmaking changes pass both checks.

## Design notes

- **Why `match_found` is distinct from `room_joined`**: same payload shape,
  but the discriminator lets the UI choose the transition (matchmaking has no
  pre-existing lobby phase to render). Reusing `room_joined` would have forced
  the client to infer origin from a missing parent message.
- **Queue is FIFO without skill / region tiers** — explicit out-of-scope. Any
  future ranked / skill-tiered matchmaker becomes a separate `MatchmakingPool`
  alongside the queue, not a replacement.
- **Re-enqueue is idempotent**: a reconnect or refresh can't grow the queue
  beyond one slot per real client. Guarded at the pure layer so the gateway
  doesn't need to dedupe.
- **`hello` not required for matchmaking**: `find_random` carries the
  nickname directly. Friends mode keeps the `hello` + `create_room` /
  `join_room` flow untouched for backward compat.
- **`OnlineRandomScreen` props use property-syntax callbacks** (e.g.
  `readonly onFind: (nickname: string) => void`), not method-shorthand. Avoids
  `unbound-method` lint warnings when callers pass these around.

## Out of scope (carryforward)

Same list as the plan, unchanged:

- AI fill when fewer than 4 humans queue.
- Skill / region / latency-based matching.
- Ranked / MMR (next disabled button).
- Production hosting / deployment.
