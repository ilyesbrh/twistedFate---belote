# Iteration 053 — SA/TA trick-winning order

## Goal

Fix trick-playing logic so SA and TA contracts use correct card-ranking
and following rules. Currently `trick.trumpSuit` holds a "hearts"
sentinel for SA/TA, so trick winners and overtrump checks are wrong.

## Out of scope

- Announcements (tierce, carré…).
- AI bidding SA/TA.
- UI changes.

## Acceptance criteria

- [ ] `Trick.contractType: ContractType` field added.
- [ ] `createTrick` accepts `contractType` as 3rd arg.
- [ ] `isValidPlay` SA: must follow led suit; no trump obligation otherwise.
- [ ] `isValidPlay` TA: must follow led suit; must overtrump (by TA rank)
      if possible when can't follow.
- [ ] `determineTrickWinner` SA: highest NON_TRUMP_ORDER rank in led suit.
- [ ] `determineTrickWinner` TA: highest TRUMP_ORDER rank across all cards;
      tie → led-suit card wins.
- [ ] `round.ts` passes `contract.contractType` to `createTrick`.
- [ ] All 4 checks pass.

## Files to touch

### New

- `packages/coinche/core/__tests__/models/sa-ta-tricks.test.ts`

### Modified

- `packages/coinche/core/src/models/trick.ts`
- `packages/coinche/core/src/models/round.ts`
- `packages/coinche/core/__tests__/models/trick.test.ts` — add `"suit"` arg
- `packages/coinche/core/__tests__/ai/strategy.test.ts` — add `"suit"` arg
- Trick literal objects in scoring/contract-types tests — add `contractType` field

## Validation

- `pnpm test` — expected delta ≈ +12 tests.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — clean.
