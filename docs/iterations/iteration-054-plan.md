# Iteration 054 — Capot Bid + Announced/Unannounced Capot Scoring

## Goal

Add capot as a first-class bid type in the Coinche engine, and implement the two capot scoring modes (announced and unannounced).

## Scope

### Bid model (`packages/coinche/core/src/models/bid.ts`)

- Add `"capot"` to `BidType`
- `Contract.isCapot: boolean`
- `createCapotBid(position, suit, idGen)` factory
- `isValidBid`: capot valid when bidding is open, ends bidding immediately
- `getValidBids`: include 4 capot options (one per suit)
- `getContract`: derive `isCapot`, use sentinel `value: 160`

### Scoring (`packages/coinche/core/src/models/scoring.ts`)

- Announced capot branch in `calculateRoundScore`:
  - Made: 500 × coincheLevel to contracting team
  - Failed: 500 × coincheLevel to opponent team
  - Belote +20 preserved on top
- Unannounced capot (regular contract, bidder wins all 8):
  - Score = 250 + bid value
- Helper: `contractingTeamWonAllTricks(tricks, bidderPosition)`

## Tests (TDD — RED first)

- `bid-capot.test.ts`: 12 tests covering factory, isValidBid, placeBid, getValidBids, getContract
- `capot-scoring.test.ts`: 9 tests covering announced (×1/×2/×4 made+failed), unannounced bonus, belote preservation

## Checks

- `pnpm test` — 1996/1996
- `pnpm typecheck` — clean
- `pnpm lint` — delta-clean (222 vs 237 baseline = -15)
- `pnpm format:check` — clean
