# Iteration 048 — Sans-Atout & Tout-Atout card-point tables

## Goal

Add `ContractType` and contract-type-aware card-point tables to
`@coinche/core` so scoring works correctly for all three Coinche
contract types.

## Out of scope

- Sans-Atout / Tout-Atout bids in the bidding model (iteration 049).
- Trick-winning order changes for TA/SA (all suits rank like trump in
  TA — separate iteration).
- UI changes, `@coinche/app`, `@coinche/ui`.

## Acceptance criteria

- [ ] `ContractType = "suit" | "sans-atout" | "tout-atout"` exported
      from `@coinche/core`.
- [ ] `getCoincheCardPoints(card, trumpSuit, contractType)` returns
      correct points per `docs/games/coinche/GAME_RULES.md` §3.
  - SA: Jack = 0, Ace = 19; every other card same as non-trump.
  - TA: J=14, 9=9, A=6, 10=5, K=3, Q=1, 8=0, 7=0 for every suit.
  - suit: existing trump/non-trump logic unchanged.
- [ ] `Contract` has `contractType: ContractType` field (defaults to
      `"suit"` in `getContract` until SA/TA bidding arrives in iter 049).
- [ ] `calculateTeamPoints`, `calculateTrickPoints`,
      `calculateRunningPoints`, `calculateRoundScore` all use
      `getCoincheCardPoints`, threaded via `contract.contractType`.
- [ ] All 4 checks pass.

## Files to touch

### Modified

- `packages/coinche/core/src/models/card.ts` — add `ContractType`,
  `SANS_ATOUT_POINTS`, `TOUT_ATOUT_POINTS`, `getCoincheCardPoints`.
- `packages/coinche/core/src/models/bid.ts` — add `contractType` to
  `Contract`, set `"suit"` in `getContract` for now.
- `packages/coinche/core/src/models/scoring.ts` — replace
  `getCardPoints` calls with `getCoincheCardPoints`, add
  `contractType` parameter to scoring helpers.
- `packages/coinche/core/src/models/index.ts` — export new symbols.

### New

- `packages/coinche/core/__tests__/models/contract-types.test.ts` —
  card-point table tests (written first, red phase confirmed).

## TDD plan

1. Jack = 0 in sans-atout for every suit
2. Ace = 19 in sans-atout for every suit
3. K=4, Q=3, 10=10 unchanged in sans-atout
4. Jack = 14 in tout-atout for every suit
5. 9 = 9 in tout-atout, A = 6, 10 = 5, K = 3, Q = 1 in tout-atout
6. suit contract with trump J = 20 (existing behaviour preserved)
7. SA per-suit total = 36 (4 × 36 = 144 card pts)
8. TA per-suit total = 38 (4 × 38 = 152 card pts)
9. `calculateRoundScore` SA: eight identical-point tricks where Jacks
   are played score 0 for the jack contribution
10. `calculateRoundScore` TA: jack of any suit scores 14

## Validation

- `pnpm test` — expected delta ≈ +10 tests.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — clean.
