# Iteration 049 — SA/TA bid types in the bidding model

## Goal

Add `sans-atout` and `tout-atout` as first-class bid types in
`@coinche/core`'s bidding model so a won contract carries the correct
`contractType` and scoring activates the right card-point table.

## Out of scope

- Trick-winning order changes for SA/TA (iteration 050).
- UI changes for SA/TA bid panel.
- `@coinche/app` session wiring of SA/TA bids (follows automatically
  since `getValidBids` will include them).

## Acceptance criteria

- [ ] `BidType` includes `"sans-atout"` and `"tout-atout"`.
- [ ] `createSansAtoutBid(position, value, idGen)` and
      `createToutAtoutBid(position, value, idGen)` factories exist.
- [ ] `isValidBid` accepts SA/TA bids using the same value-escalation
      rules as suit bids (must be strictly higher than current highest
      bid).
- [ ] `placeBid` transitions bidding state for SA/TA identically to
      suit bids.
- [ ] `getValidBids` returns SA and TA bids at each valid value.
- [ ] `getContract` derives `contractType` from the winning bid's type
      (`"sans-atout"` / `"tout-atout"` / `"suit"`).
- [ ] A `calculateRoundScore` call driven by a SA contract from
      `getContract` uses the SA card-point table (jack = 0).
- [ ] All 4 checks pass.

## Files to touch

### Modified

- `packages/coinche/core/src/models/bid.ts` — extend `BidType`,
  add factories, update `isValidBid`, `placeBid`, `getValidBids`,
  `getContract`.
- `packages/coinche/core/src/models/index.ts` — export new factories.

### New

- `packages/coinche/core/__tests__/models/bid-sa-ta.test.ts` —
  SA/TA-specific bid tests (written first, red phase confirmed).

## TDD plan

1. `createSansAtoutBid` returns bid with type `"sans-atout"`, value,
   suit=null
2. `createToutAtoutBid` returns bid with type `"tout-atout"`, value,
   suit=null
3. `isValidBid` — SA bid valid when value > current highest
4. `isValidBid` — SA bid invalid when value <= current highest
5. `isValidBid` — TA bid valid when value > SA bid
6. `placeBid` — SA bid becomes new highestBid
7. `getValidBids` — returns SA and TA options at each valid value
8. `getContract` — SA winning bid yields `contractType: "sans-atout"`
9. `getContract` — TA winning bid yields `contractType: "tout-atout"`
10. `coinche` is valid after an SA bid by the opponent
11. Coinched SA contract: `calculateRoundScore` uses SA table (j=0)

## Validation

- `pnpm test` — expected delta ≈ +11 tests.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` — clean.
