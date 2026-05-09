# Iteration 059 Report — AI chooseCard correct for SA/TA contracts

## Summary

Fixed the AI card-play strategy to correctly handle SA (sans-atout) and
TA (tout-atout) contracts. Previously `chooseCard` accepted `trumpSuit: Suit`
and blindly received the sentinel "hearts" value for SA/TA, causing wrong
heuristics (treating hearts as trump when there is no trump, or using a
single-suit heuristic when all suits rank as trump).

## Changes

### `packages/coinche/core/src/ai/strategy.ts`

- Updated `chooseCard` signature:
  ```ts
  export function chooseCard(
    hand: readonly Card[],
    trick: Trick,
    trumpSuit: Suit | null, // null for SA
    contractType: ContractType,
    playerPosition: PlayerPosition,
  ): Card;
  ```
- Added `chooseCardSA` helper:
  - Leading: play highest SA-point card (`SANS_ATOUT_POINTS`).
  - Following: play lowest if partner is winning; else play highest SA-point.
- Added `chooseCardTA` helper:
  - Leading: play highest TRUMP_ORDER rank (`getCardRankOrder(c, c.suit)`).
  - Following: play lowest-rank if partner is winning; else play highest rank.
- `chooseLeadCard` updated to accept `Suit | null` (handles SA leading).
- Updated `chooseCardForRound` to derive `trumpSuit = null` when
  `contractType !== "suit"` and pass `contractType` to `chooseCard`.

### `packages/coinche/core/__tests__/ai/strategy.test.ts`

- Updated all 21 existing `chooseCard` call sites to pass `"suit"` as
  the new `contractType` parameter (before `playerPosition`).
- Added `contractType: "suit"` and `isCapot: false` to all 3 inline
  contract fixture objects in `chooseCardForRound` tests.
- Added `describe("chooseCard — SA contract")` — 4 tests covering
  highest-point leading, highest-point following to win,
  lowest-point when partner winning, and valid-play invariant.
- Added `describe("chooseCard — TA contract")` — 4 tests covering
  jack-beats-all leading, jack over 9 leading, lowest-rank when
  partner winning, and valid-play invariant.

## Test counts

| Before | After |
| ------ | ----- |
| 513    | 521   |

## 4 checks

- `pnpm test` — 2081 / 2081 passed
- `pnpm typecheck` — clean
- `pnpm lint` — clean (delta 0 new warnings)
- `pnpm format:check` — clean

## Forward look

- **Iter 060**: `chooseBid` learns to bid SA/TA contracts (AI uses
  `evaluateHandForSA`/`evaluateHandForTA` helpers).
- **Iter 061**: AI difficulty levels or smarter card-play heuristics
  (e.g. partner communication, end-game counting).
