# Iteration 050 Report — Coinche playable in browser

**Date**: 2026-05-09
**Status**: Complete

## Goal

Make Coinche playable in the browser as a solo match vs 3 AI bots,
accessible from a new game-picker screen.

## Scope

1. `packages/coinche/app/src/commands.ts` — extended `PlaceBidCommand.bidType`
   to include `"sans-atout" | "tout-atout"`.
2. `packages/coinche/app/src/session.ts` — imported `createSansAtoutBid`
   / `createToutAtoutBid`; added cases to `_createBid`.
3. `packages/ui/src/hooks/useCoinchGameSession.ts` (NEW) — parallel
   hook to `useGameSession` for Coinche; imports from `@coinche/app` and
   `@coinche/core`; uses correct `calculateRunningPoints` signature with
   `contractType`; target score 3000.
4. `packages/ui/src/components/GamePickerScreen/` (NEW) — game-selector
   screen with Belote and Coinche tiles.
5. `packages/ui/src/components/CoinchGameTable/CoinchGameTable.tsx` (NEW)
   — thin wrapper: `useCoinchGameSession` + `GameTableView`.
6. `packages/ui/src/App.tsx` — added `"game-picker"` and `"coinche-ai"`
   to `Screen` type; initial screen changed to `"game-picker"`;
   added game-picker and coinche-ai rendering blocks.
7. `packages/ui/package.json` — added `@coinche/app` and `@coinche/core`
   as runtime dependencies.

## PO Decisions Locked

- Coinche UI temporarily lives in `packages/ui` (shared shell), not
  `@coinche/ui`. Will migrate during Phase 3/4 of the platform refactor.
- Human player can only bid suit bids for now; SA/TA bids not yet
  exposed in BidPanel (iteration 051 concern).
- Target score = 3000 per `docs/games/coinche/GAME_RULES.md`.
- Coinche `BiddingRound` cast to Belote's `BiddingRound` type is safe:
  `BidPanel` only reads `coinched`, `surcoinched`, `highestBid.value`,
  `currentPlayerPosition` — all identical between both types.

## Tests Written

Zero new test files — this is a UI hookup iteration. The existing
fixture smoke test (`__tests__/fixtures.test.tsx`) and app dev-mode
test still pass. Visual correctness requires a browser.

## Implementation Summary

### Files Created

- `packages/ui/src/hooks/useCoinchGameSession.ts` — 380 lines,
  mirrors `useGameSession` with coinche packages + SA/TA aware scoring.
- `packages/ui/src/components/GamePickerScreen/GamePickerScreen.tsx`
- `packages/ui/src/components/GamePickerScreen/GamePickerScreen.module.css`
- `packages/ui/src/components/CoinchGameTable/CoinchGameTable.tsx`

### Key design decisions

| Decision                                | Choice                             | Rationale                                                                            |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `useCoinchGameSession` in `packages/ui` | Not `@coinche/ui`                  | Avoids circular dep (`@coinche/ui` → `ui` → `@coinche/ui`). Temporary pre-Phase 4.   |
| `BiddingRound` cast                     | `as unknown as BeloteBiddingRound` | `BidPanel` only accesses structurally-identical fields.                              |
| `contract` cast                         | `as unknown as Contract \| null`   | Coinche Contract is a superset (has `contractType`); structural compat verified.     |
| Game-picker as initial screen           | Changed `initialScreen()` default  | Preserves existing Belote flow exactly; adds Coinche path without breaking anything. |
| SA/TA in BidPanel                       | Not yet                            | BidPanel only handles suit bids; human cannot bid SA/TA yet.                         |

## Risks Identified

- **SA/TA trick order wrong**: `trick.ts` still uses the sentinel `"hearts"` trump for SA/TA contracts (iteration 051 fixes this).
- **BidPanel shows only suit bids**: Human cannot bid SA/TA (iteration 051 adds a CoinchBidPanel).
- **messages array is empty**: No game-action chat for Coinche yet (lower priority, later iteration).
- **No test coverage for Coinche UI**: Visual correctness not verified by automated tests.

## Validation Results

| Check               | Result                                     |
| ------------------- | ------------------------------------------ |
| `pnpm test`         | ✅ **1932 / 1932 passing** (86 test files) |
| `pnpm typecheck`    | ✅ Clean                                   |
| `pnpm lint`         | ✅ Delta-clean (207 / 207 baseline)        |
| `pnpm format:check` | ✅ Clean                                   |

## Next Iteration: 051 — SA/TA trick-winning order

**Goal**: Update `trick.ts` so SA and TA contracts use correct card-ranking.

**Scope:**

- `Trick.trumpSuit: Suit | null` — make nullable (SA = no trump).
- `createTrick` accepts `Suit | null`.
- `isValidPlay` and `getTrickWinner` handle SA (no overtrump) and
  TA (all suits rank like trump).
- Thread `contractType` into `round.ts`'s `createTrick` calls.
- Tests: SA trick winner ignores overtrump; TA jack beats non-jack of any suit.

## Iteration 052 Preview — Coinche BidPanel with SA/TA options

Add `CoinchBidPanel` to `packages/ui` that extends `BidPanel` with
SA/TA option buttons, wired through `useCoinchGameSession.placeBid`.
