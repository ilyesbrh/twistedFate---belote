# Iteration 22 Report: GameController — Event-Driven Bridge

**Date**: 2026-02-21
**Status**: Complete
**Commit**: `dedd8ff`

## Goal

Create `GameController`, the event-driven bridge between `GameSession` (app layer) and `GameRenderer` (UI layer). The controller subscribes to session events, tracks the active turn, rebuilds `GameView`, and pushes updates to the render target.

## Scope

1. `game-controller.ts` — Event subscription, turn tracking, view rebuilding
2. Decoupled interfaces: `GameSessionAccess`, `RenderTarget`
3. 24 TDD tests for event handling and turn tracking

## Tests Written (24 test cases)

### game-controller.test.ts (24 tests)

**Lifecycle (3 tests):**

- `start()` subscribes and renders initial view
- `stop()` unsubscribes
- Multiple start/stop cycles

**Turn tracking (8 tests):**

- `round_started` → dealer+1 is active
- `bid_placed` → next player active
- `bidding_completed` → dealer+1 leads first trick
- `card_played` → next player active
- `trick_completed` → winner is active
- `round_completed` → no active turn
- `round_cancelled` → no active turn
- `game_completed` → no active turn

**View rendering (5 tests):**

- Initial render produces valid GameView
- Phase mapping (bidding, playing, completed)
- Scores from session.game.teamScores
- Active seat from tracked turn

**Refresh on events (8 tests):**

- Each event type triggers a re-render
- View reflects latest session state after event

## Implementation Summary

### Files Created

- `packages/ui/src/game-controller.ts` — Event-driven bridge
- `packages/ui/__tests__/game-controller.test.ts` — 24 TDD test cases

### Key Types

```typescript
interface GameSessionAccess {
  on(listener: GameEventListener): () => void;
  dispatch(command: GameCommand): void;
  readonly currentRound: RoundSnapshot | null;
  readonly game: { readonly teamScores: readonly [number, number] } | null;
}

interface RenderTarget {
  update(view: GameView): void;
}

class GameController {
  constructor(
    session: GameSessionAccess,
    renderer: RenderTarget,
    playerNames: [string, string, string, string],
  );
  start(): void;
  stop(): void;
  wireInput(input: InputSource): void;
}
```

## Technical Decisions

| Decision             | Choice                               | Rationale                                                                              |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| Interface decoupling | `GameSessionAccess`, `RenderTarget`  | Controller doesn't depend on concrete GameSession or GameRenderer; testable with mocks |
| Turn tracking        | State machine in `trackActiveTurn()` | Each event type updates `activeTurn`; deterministic, no polling                        |
| Dealer tracking      | Stored from `round_started`          | Needed for `bidding_completed` → first-trick leader (dealer+1)                         |

## Validation Results

- `pnpm test`: **734/734 passing** (710 prior + 24 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean
