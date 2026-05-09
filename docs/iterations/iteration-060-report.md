# Iteration 060 — Report

## What was done

Extended the Coinche AI's bidding strategy to evaluate and bid Sans-Atout (SA) and
Tout-Atout (TA) contracts, in addition to the existing suit contracts.

### New exports in `strategy.ts`

- `evaluateHandForSansAtout(hand)` — sums `SANS_ATOUT_POINTS` across all cards
  (Ace=19, 10=10, K=4, Q=3; jacks score 0 in SA)
- `evaluateHandForToutAtout(hand)` — sums `TOUT_ATOUT_POINTS` across all cards
  (J=14, 9=9, A=6, 10=5, K=3, Q=1)

### Updated `chooseBid`

After computing the best suit score, also computes `saScore` and `taScore`. If SA
or TA score exceeds the best alternative by a 1.15× margin, it becomes the chosen
contract type. Threshold check (`BID_STRENGTH_RATIO = 0.65`) applies to the winning
score regardless of type. Dispatches to `createSansAtoutBid` or `createToutAtoutBid`
as appropriate.

### New imports in `strategy.ts`

- `SANS_ATOUT_POINTS`, `TOUT_ATOUT_POINTS` from `"../models/card.js"`
- `createSansAtoutBid`, `createToutAtoutBid` from `"../models/bid.js"`

## Tests added (strategy.test.ts)

12 new tests across 3 new `describe` blocks:

- `evaluateHandForSansAtout` — 4 tests (4 aces = 76, 4 tens = 40, jacks = 0, mixed)
- `evaluateHandForToutAtout` — 3 tests (4 jacks = 56, 4 nines = 36, mixed)
- `chooseBid — SA/TA contract selection` — 5 tests:
  - SA hand (4 aces + 4 tens, score 116) → bids `sans-atout`
  - TA hand (4 jacks + 4 nines, score 92) → bids `tout-atout`
  - Strong suit hand (hearts J+9+A+10+K + 2 aces support, score 106) → bids `suit`
  - SA bid passes `placeBid` validation (no throw)
  - TA bid passes `placeBid` validation (no throw)

## 4 checks

- `pnpm test` — 2105/2105 passed (99 test files)
- `pnpm typecheck` — clean (no errors)
- `pnpm lint` — clean (delta zero vs baseline)
- `pnpm format:check` — all changed files pass; pre-existing ENOENT for stale
  worktree `.claude/worktrees/agent-a5522fc620939ad7c/vitest.config.ts` is
  unrelated to this iteration

## Forward look

- N+1 (061): Card-play AI for SA could rank cards by `SANS_ATOUT_POINTS` when
  deciding which card to lead rather than just by rank order
- N+2 (062): AI could consider capot when hand is near perfect (score > 150)
