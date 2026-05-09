# Iteration 054 — Report

## What landed

- `"capot"` bid type in `BidType`; `Contract.isCapot: boolean`
- `createCapotBid(position, suit, idGen)` factory
- Capot in `placeBid` ends bidding immediately (`state = "completed"`)
- `getValidBids` returns 4 capot options (one per suit) in addition to 49 existing bids → 53 total
- `getContract` sets `isCapot: true`, sentinel `value: 160`, `contractType: "suit"`
- `calculateRoundScore` announced capot branch: 500 × coincheLevel (made/failed), belote +20 preserved
- Unannounced capot bonus in regular scoring: 250 + bid value when bidder wins all 8 tricks
- `contractingTeamWonAllTricks` helper

## Test files added

- `packages/coinche/core/__tests__/models/bid-capot.test.ts` — 12 tests
- `packages/coinche/core/__tests__/models/capot-scoring.test.ts` — 9 tests

## Checks

- Tests: 1996/1996
- Typecheck: clean
- Lint: 222 (baseline 237, delta -15)
- Format: clean

## Notes

- SA/TA coinche window for capot is out of scope — capot ends bidding immediately without a coinche window (consistent with Tunisian rule variant used here)
- Unannounced capot only applies when `coincheLevel === 1` (no coinche active); coinched contracts use standard payout formula
