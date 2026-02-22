# Iteration 21 Report: GameRenderer & GameView State Mapping

**Date**: 2026-02-21
**Status**: Complete
**Commit**: `a253b4e`

## Goal

Create the top-level integration layer: a pure state mapper (`game-view.ts`) that converts `@belote/core` domain types to a UI view model, and `GameRenderer` that wires all 9 components into TableLayout zones and updates them from GameView snapshots.

## Scope

1. `game-view.ts` — Pure state mapping: PlayerPosition → Seat, Round → GameView
2. `game-renderer.ts` — Root PixiJS integration: creates components, places them in zones, updates from GameView
3. 26 TDD tests for the view mapper
4. Storybook stories for full-table rendering

## Tests Written (26 test cases)

### game-view.test.ts (26 tests)

**positionToSeat (4 tests):**

- Position 0 → south, 1 → west, 2 → north, 3 → east

**seatToPosition (5 tests):**

- Inverse mapping + roundtrip identity test

**opponentOrientation (3 tests):**

- North → horizontal, west/east → vertical

**mapHandToView (2 tests):**

- Maps Card[] preserving suit/rank, empty array

**mapTrickToView (3 tests):**

- Null trick → empty array, maps played cards to seat positions, full 4-card trick

**mapGameStateToView (9 tests):**

- Idle view (null round), playing phase, bidding phase
- Human hand cards, opponent card counts, player info for all seats
- Current trick mapping, scores, active seat

## Implementation Summary

### Files Created

- `packages/ui/src/game-view.ts` — Pure state mapper (no DOM, no side effects)
- `packages/ui/src/game-renderer.ts` — Root PixiJS integration
- `packages/ui/src/game-renderer.stories.ts` — Full-table Storybook stories
- `packages/ui/__tests__/game-view.test.ts` — 26 TDD test cases

### Key Types

```typescript
interface GameView {
  readonly players: readonly PlayerView[];
  readonly hand: readonly HandCard[];
  readonly opponents: readonly OpponentView[];
  readonly trick: readonly TrickCard[];
  readonly trumpSuit: Suit | null;
  readonly activeSeat: Seat | null;
  readonly scores: { readonly team1: number; readonly team2: number };
  readonly phase: GamePhase;
}

type GamePhase = "idle" | "bidding" | "playing" | "completed";

interface RoundSnapshot {
  readonly players: readonly { position: PlayerPosition; hand: readonly Card[] }[];
  readonly contract: { readonly suit: Suit } | null;
  readonly currentTrick: Trick | null;
  readonly phase: RoundPhase;
}
```

### Key Functions

- `positionToSeat(position)` — Maps PlayerPosition (0-3) to Seat
- `seatToPosition(seat)` — Inverse mapping
- `mapHandToView(cards)` — Card[] → HandCard[] (suit + rank + playable)
- `mapTrickToView(trick)` — Trick → TrickCard[]
- `mapGameStateToView(input)` — Full state → GameView (frozen, immutable)

## Technical Decisions

| Decision           | Choice                               | Rationale                                                                 |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------------- |
| Pure mapper        | `game-view.ts` has zero side effects | Fully unit-testable without PixiJS; GameRenderer only consumes the output |
| RoundSnapshot      | Minimal interface, not full Round    | Decouples UI from core internals; only reads what's needed                |
| Deep freeze        | All GameView output frozen           | Prevents accidental mutation; enforces one-way data flow                  |
| Human = position 0 | Convention throughout                | south seat always maps to human player                                    |

## Validation Results

- `pnpm test`: **710/710 passing** (684 prior + 26 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean
