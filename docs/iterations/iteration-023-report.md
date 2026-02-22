# Iteration 23 Report: UI Input Dispatch — Card Taps & Bids

**Date**: 2026-02-21
**Status**: Complete
**Commit**: `3d9c602`

## Goal

Wire user interactions (card taps, suit bids, pass) from PixiJS components back to the game session via `GameController.wireInput()`.

## Scope

1. `InputSource` interface — callback registration for card taps, suit bids, pass
2. `wireInput()` on GameController — bridges UI events to session commands
3. `onCardTap()` on HandDisplay — pointer events on card sprites
4. `onSuitBid()` / `onPass()` on BiddingPanel — button interaction callbacks
5. 6 new tests for input dispatch

## Tests Written (6 new → 740 total)

### game-controller.test.ts (6 new tests)

- Card tap dispatches `play_card` command with correct card
- Suit bid dispatches `place_bid` with suit
- Pass dispatches `place_bid` with bidType "pass"
- Card tap with unknown card is silent no-op
- Bid value defaults to 80
- Player position hardcoded to 0 (human)

## Implementation Summary

### Files Modified

- `packages/ui/src/game-controller.ts` — Added `wireInput()` method, `InputSource` interface
- `packages/ui/src/components/hand/hand-display.ts` — Added `onCardTap()`, `getCardSprites()`, pointer event handling
- `packages/ui/src/components/bidding/bidding-panel.ts` — Added `onSuitBid()`, `onPass()` callback registration
- `packages/ui/__tests__/game-controller.test.ts` — 6 new input dispatch tests
- `packages/ui/src/index.ts` — Exported `InputSource` type

### Key API

```typescript
interface InputSource {
  onCardTap(callback: (index: number, card: { suit: Suit; rank: string }) => void): void;
  onSuitBid(callback: (suit: Suit) => void): void;
  onPass(callback: () => void): void;
}

// GameController
wireInput(input: InputSource): void;
```

## Review Fixes Applied (commit `122f504`)

| Finding                              | Fix                                                         |
| ------------------------------------ | ----------------------------------------------------------- |
| Card tap cast UI card as domain Card | Look up full Card (with id) from player's hand instead      |
| Silent failure if card not found     | Return early (no-op) instead of dispatching invalid command |
| Event listener ordering in harness   | Register auto-start-round before dispatching commands       |
| Unused vi import                     | Removed from test file                                      |

## Validation Results

- `pnpm test`: **740/740 passing** (734 prior + 6 new)
- After review fixes: **741/741 passing**
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean
