# Iteration 43 Report: GameController → React Hook

**Date**: 2026-02-23
**Status**: Complete

## Goal

Create a `useGameController` React hook that replaces the imperative `GameController` class for React-based rendering. Extracts turn-tracking into a pure reducer function, wraps session subscription in `useReducer`/`useEffect`, returns `GameView` + phase-gated dispatch functions.

## Scope

1. `use-game-controller.ts` — React hook with extracted pure functions
2. `controllerReducer(state, event)` — Pure reducer for active turn / dealer tracking
3. `buildGameView(session, playerNames, activeTurn)` — Pure view builder wrapping `mapGameStateToView`
4. `canPlayCard(phase)`, `canBid(phase)` — Pure phase gate helper functions
5. `useGameController(options)` — Thin React wrapper using `useReducer` + `useEffect` + `useCallback`
6. Returns `{ view, playCard, placeBid, pass }` to drive GameRoot
7. Tests for reducer, view builder, phase gates, exports (14 tests)
8. Barrel exports in `index.ts`
9. Old `game-controller.ts` unchanged

## PO Decisions Locked

- **Pure reducer for turn tracking**: `controllerReducer` is a pure function `(state, event) → state`, fully testable without React rendering context. Matches the same logic as imperative `GameController.trackActiveTurn()`.
- **Epoch counter in reducer state**: Every event increments `epoch` to guarantee React re-renders even when `activeTurn`/`dealerPosition` don't change (e.g., `game_started` event still needs to re-read `session.currentRound`).
- **No `@testing-library/react` dependency**: Tests focus on extracted pure functions (reducer, view builder, phase gates). The hook itself is a thin ~30-line wrapper; its integration is verified when GameRoot uses it in a future bootstrap iteration.
- **`canPlayCard`/`canBid` as standalone functions**: Extracted from inline checks so they're independently testable. Same phase-gating logic as imperative `GameController.wireInput()`.
- **`useCallback` for dispatch functions**: Stable function references prevent unnecessary child re-renders when GameRoot passes them as props to HandDisplayReact and BiddingPanelReact.

## Tests Written (14 test cases, written before implementation)

### `__tests__/use-game-controller.test.ts` — 14 tests

**Exports (1)**:
- exports all public API functions and constants (6 assertions)

**controllerReducer (8)**:
- initial state has null activeTurn, null dealerPosition, epoch 0
- round_started sets activeTurn to (dealer+1)%4 and stores dealerPosition
- bid_placed advances activeTurn to (player+1)%4
- bidding_completed sets activeTurn to (dealer+1)%4
- card_played advances activeTurn to (player+1)%4
- trick_completed sets activeTurn to winner
- clears activeTurn on round_completed, round_cancelled, game_completed
- unknown event increments epoch without changing activeTurn

**buildGameView (3)**:
- returns idle view when session has no round
- returns playing phase with round data
- maps team scores from session

**canPlayCard / canBid (2)**:
- canPlayCard returns true only for playing phase
- canBid returns true only for bidding phase

## Implementation Summary

### Files Created (2)

- `packages/ui/src/hooks/use-game-controller.ts` — React hook + extracted pure functions
- `packages/ui/__tests__/use-game-controller.test.ts` — 14 tests

### Files Modified (1)

- `packages/ui/src/index.ts` — barrel exports for hook, reducer, helpers, types

### Key Types

- `ControllerState` — `{ activeTurn, dealerPosition, epoch }`
- `UseGameControllerOptions` — `{ session, playerNames, humanPosition? }`
- `UseGameControllerResult` — `{ view, playCard, placeBid, pass }`

### Key Functions

- `controllerReducer(state, event)` — Pure turn-tracking reducer
- `buildGameView(session, playerNames, activeTurn)` — Pure view builder
- `canPlayCard(phase)` — Phase gate for card play
- `canBid(phase)` — Phase gate for bidding
- `useGameController(options)` — React hook

## Technical Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Pure reducer extraction | `controllerReducer` as standalone function | Testable without React rendering; mirrors imperative `trackActiveTurn` |
| Epoch counter | `epoch` field in ControllerState | Forces re-render on every event, even when turn state unchanged |
| buildGameView delegation | Wraps `mapGameStateToView` | Single source of truth for view building; already tested in game-view.test.ts |
| useCallback for dispatch | Stable references for playCard/placeBid/pass | Prevents unnecessary child re-renders in GameRoot component tree |
| No renderHook testing | Tests focus on pure functions | Avoids `@testing-library/react` dependency; hook integration verified via Storybook |
| Session reads at dispatch time | `session.currentRound?.phase` checked in callbacks | Phase state is always fresh at dispatch time, not stale from render |

## Errors Encountered and Fixed

1. **Missing `vi` import**: Test file used `vi.fn()` without importing `vi` from Vitest. Fixed by adding `vi` to the import.
2. **Prettier formatting**: 2 files (hook + test) needed formatting. Fixed with `prettier --write`.

## Refactoring Performed

None

## Risks Identified

- **Stale closure in dispatch callbacks**: `useCallback` deps include `[session, humanPosition]`. If the session reference changes (unlikely in practice), callbacks will be recreated. The `session.currentRound` is read at dispatch time (not at render time), so phase gating is always fresh.
- **No unmount cleanup test**: Without `@testing-library/react`'s `renderHook`, we can't test that the `useEffect` cleanup (unsubscribe) fires on unmount. The cleanup is straightforward (`return unsub`) and follows standard React patterns. Integration testing will verify this.

## Validation Results

- `pnpm test`: **941/941 passing** (14 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 44 (Remove old imperative code)

**Scope**: Delete old imperative component files, remove `<StoryCanvas>` helper, update barrel exports to remove imperative code, clean up unused dependencies.

**Acceptance criteria**:

1. All old imperative `.ts` component files deleted (9 components + game-renderer.ts)
2. Old imperative `.stories.tsx` wrapper stories removed
3. `<StoryCanvas>` helper removed (no longer needed)
4. `src/index.ts` updated — imperative exports removed, React-only exports remain
5. Old dev harness scenes deleted
6. All 4 checks pass
7. Storybook renders all React stories correctly
