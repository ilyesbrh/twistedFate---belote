# Iteration 047 — Coinche multiplier formula

## Goal

Fix `calculateRoundScore` in `@coinche/core` to use the Coinche-correct
`(contract + 160) × coincheLevel` formula instead of the inherited
Belote formula `160 × coincheLevel`.

## Out of scope

- Capot bid type (capot is not yet in `BidValue` — separate iteration).
- Sans-Atout / Tout-Atout point tables (iteration 048).
- Any UI or server changes.
- Changes to `@belote/core`.

## Acceptance criteria

- [ ] `calculateRoundScore` in `@coinche/core` uses
      `(contract.value + FAILED_CONTRACT_POINTS) × coincheLevel` for
      both success-coinched (winner's score) and failure-coinched
      (opponent's score).
- [ ] All 4 checks pass.
- [ ] `@belote/core` scoring is **unchanged**.
- [ ] New test file
      `packages/coinche/core/__tests__/models/coinche-scoring.test.ts`
      exists and passes, covering all coinche/surcoinche branches.

## Files to touch

### New

- `packages/coinche/core/__tests__/models/coinche-scoring.test.ts` —
  Coinche-specific scoring tests (TDD anchor).

### Modified

- `packages/coinche/core/src/models/scoring.ts` — fix the
  coinched-success and coinched-failure branches.

## Reusable symbols

- `Contract`, `createSuitBid`, `getContract`, `createBiddingRound`,
  `placeBid` from `@coinche/core` — used to build test contracts.
- `calculateTeamPoints`, `roundToNearestTen`, `FAILED_CONTRACT_POINTS`
  from `@coinche/core/src/models/scoring.ts` — unchanged helpers.

## TDD plan

Write these tests FIRST, confirm RED, then implement:

1. `"plain (×1): bidder success — scores taken + contract value"` — coincheLevel=1, bidder meets contract; check `contractingTeamFinalScore = taken + contract`.
2. `"plain (×1): bidder failure — opponents score 160 + contract value"` — coincheLevel=1, bidder fails; opponents get `160 + contract.value`.
3. `"coinched (×2): bidder success — winner scores (contract + 160) × 2"` — coincheLevel=2, bidder succeeds; `contractingTeamFinalScore = (contract.value + 160) × 2`.
4. `"coinched (×2): bidder failure — opponents score (contract + 160) × 2"` — coincheLevel=2, bidder fails; `opponentTeamFinalScore = (contract.value + 160) × 2`.
5. `"coinched (×2): loser scores 0"` — success or failure, the losing side's base score is 0 before belote.
6. `"surcoinched (×4): bidder success — winner scores (contract + 160) × 4"`.
7. `"surcoinched (×4): bidder failure — opponents score (contract + 160) × 4"`.
8. `"belote bonus is always added to the holding team, unaffected by coinche level"` — belote team gets +20 regardless.
9. `"belote counted toward meeting the contract even when coinched"`.
10. `"formula differs from ×160-only: contract=80 coinched gives 480 not 320"` — regression guard.

## Validation

- `pnpm test` — expected delta ≈ +10–15 tests.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — clean.

## Carryforward for N+1 and N+2

**N+1 (iteration 048) — Sans-Atout + Tout-Atout contracts:**

Scope: `ContractType = "suit" | "sans-atout" | "tout-atout"` in
`@coinche/core`. Switch card-point table per contract type: J=0 in
sans-atout, flat-rebalanced values in tout-atout (per
`docs/games/coinche/GAME_RULES.md` §3). No coinche-level changes needed.

Acceptance criteria:

- `getCardPoints(card, trumpSuit, contractType)` variant function.
- Sans-atout ace=19, jack=0.
- Tout-atout every suit ranks like trump; flat-rebalanced points.
- Failing tests for each table first.

**N+2 (iteration 049) — Capot bid type:**

Scope: add `"capot"` as a special bid value; `calculateCapotScore`
per `GAME_RULES.md` §7 (not-bid capot = 250 + contract; bid capot
made = 500; bid capot failed = 500 to opponents; coinched capot
= 1000/2000).
