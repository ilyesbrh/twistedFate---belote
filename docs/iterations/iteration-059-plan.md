# Iteration 059 Plan — AI chooseCard correct for SA/TA contracts

## Goal

Fix the AI `chooseCard` and `chooseCardForRound` strategy in
`packages/coinche/core/src/ai/strategy.ts` to handle SA (sans-atout)
and TA (tout-atout) contracts correctly.

## Problem

`chooseCard(hand, trick, trumpSuit, playerPosition)` receives
`trumpSuit = round.contract.suit` which is the "hearts" sentinel value
for SA and TA bids — it is not semantically meaningful in those
contract types. This causes wrong heuristics:

- SA: AI treats hearts as trump when there is no trump.
- TA: AI uses a single-suit trump heuristic when all suits rank as trump.

## Solution

### `strategy.ts`

1. Add `contractType: ContractType` parameter to `chooseCard`.
   Make `trumpSuit: Suit | null` (null for SA).
2. Dispatch on `contractType`:
   - `"suit"` — existing logic unchanged (trumpSuit is the real trump).
   - `"sans-atout"` — new `chooseCardSA` helper: play highest-point
     valid play (using `getCoincheCardPoints(card, null, "sans-atout")`);
     play lowest if partner is winning.
   - `"tout-atout"` — new `chooseCardTA` helper: play highest
     TRUMP_ORDER rank (`getCardRankOrder(card, card.suit)`) from valid
     plays; play lowest if partner is winning.
3. Update `chooseCardForRound` to derive `contractType` from
   `contract.contractType` and `trumpSuit` as null when not suit.

### `strategy.test.ts`

- Update existing `chooseCard` call sites to pass `"suit"` as
  `contractType` (new 4th positional parameter, before `playerPosition`).
- Add `describe("chooseCard — SA contract")` with 2+ tests.
- Add `describe("chooseCard — TA contract")` with 2+ tests.

## Files changed

- `packages/coinche/core/src/ai/strategy.ts`
- `packages/coinche/core/__tests__/ai/strategy.test.ts`

## Forward look

- Iter 060: SA/TA AI bidding (`chooseBid` learns to bid SA/TA).
- Iter 061: AI difficulty levels / smarter card-play heuristics.
