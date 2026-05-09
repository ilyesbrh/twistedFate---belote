# Iteration 060 — Plan

## Goal

Extend the Coinche AI's `chooseBid` in `packages/coinche/core/src/ai/strategy.ts` to sometimes bid Sans-Atout and Tout-Atout contracts when hand evaluation warrants it.

## Scope

**Files to modify:**

- `packages/coinche/core/src/ai/strategy.ts` — add `evaluateHandForSansAtout`, `evaluateHandForToutAtout`, update `chooseBid`
- `packages/coinche/core/__tests__/ai/strategy.test.ts` — add 5 new tests

**Files to create:**

- `docs/iterations/iteration-060-plan.md` (this file)
- `docs/iterations/iteration-060-report.md`

## Design

### New evaluation functions

```ts
export function evaluateHandForSansAtout(hand: readonly Card[]): number;
export function evaluateHandForToutAtout(hand: readonly Card[]): number;
```

SA rewards: Ace=19, 10=10, K=4, Q=3 (from `SANS_ATOUT_POINTS`).
TA rewards: J=14, 9=9, A=6, 10=5, K=3, Q=1 (from `TOUT_ATOUT_POINTS`).

### Updated `chooseBid` logic

After computing `bestSuitScore`, also compute `saScore` and `taScore`.
If SA or TA score exceeds best suit score by 1.15x, prefer that contract type.
Threshold check uses same `BID_STRENGTH_RATIO` (0.65).

### SA/TA score range

Max SA score (8 aces): 8×19 = 152. Practical strong hand (~4 aces + 4 tens): 4×19+4×10 = 116.
Max TA score (8 jacks): 8×14 = 112. Practical strong hand (~4 jacks + 4 nines): 4×14+4×9 = 92.

### New imports needed in strategy.ts

- `SANS_ATOUT_POINTS`, `TOUT_ATOUT_POINTS` from `"../models/card.js"`
- `createSansAtoutBid`, `createToutAtoutBid` from `"../models/bid.js"`

## Test plan (TDD — red then green)

1. `evaluateHandForSansAtout` with 4 aces → 76 pts (4×19)
2. `evaluateHandForToutAtout` with 4 jacks → 56 pts (4×14)
3. `chooseBid` with 4 aces + 4 tens (SA-heavy) bids SA
4. `chooseBid` with 4 jacks + 4 nines (TA-heavy) bids TA
5. `chooseBid` with strong suit but weak SA/TA still bids suit

## Forward look

- N+1 (061): AI strategy for card play SA/TA could use `SANS_ATOUT_POINTS` more in `chooseCardSA`
- N+2 (062): Bidding AI could consider capot when very strong hand

## 4 checks

`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`
