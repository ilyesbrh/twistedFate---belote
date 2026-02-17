# Iteration 4 Report: Bidding System

**Date**: 2026-02-17
**Status**: Complete

## Goal

Implement the Bidding System — the first game logic iteration introducing player interaction, validation rules, and state transitions. This is the prerequisite for trick-taking (iteration 5).

## Scope

1. Bid entity types: Pass, Suit bid, Coinche, Surcoinche
2. Bid factories with deterministic IDs (4 factory functions)
3. BiddingRound entity tracking state, current player, history
4. Helper functions: `getNextPlayerPosition()`, `isOnSameTeam()`
5. Bid validation: `isValidBid()` enforces all bidding rules
6. State transitions: `placeBid()` immutable update with auto-completion
7. Contract extraction: `getContract()` from completed round
8. BID_VALUES constant: [80, 90, 100, 110, 120, 130, 140, 150, 160]

## Tests Written (56 test cases, written before implementation)

- Bid Factories (8 tests): pass/suit/coinche/surcoinche creation, ID prefix, frozen, uniqueness, determinism, BID_VALUES constant
- BiddingRound Creation (5 tests): dealer position, current player = dealer+1, empty bids, in_progress state, no highest bid, frozen
- Helpers (4 tests): getNextPlayerPosition (0→1→2→3→0), isOnSameTeam partners, opponents, self
- Bid Validation (15 tests): first bid, pass, wrong player, closed round, outbid higher/equal/lower, invalid value, coinche opponent/same-team/no-bid/already-coinched, surcoinche no-coinche/team-member/opponent, suit after coinche
- placeBid (10 tests): adds bid, advances player, immutability, highest bid update, consecutive passes tracking, 3 passes→completed, 4 passes→all_passed, coinche flag, surcoinche flag + completed, team pass after coinche→completed, throws on invalid
- getContract (8 tests): suit/value extraction, bidder position, coincheLevel 1/2/4, contract ID prefix, frozen, throws not completed, throws all_passed
- Integration (4 tests): full multi-bid round, all-pass dead round, coinche+surcoinche, coinche without surcoinche

## Implementation Summary

### Files Created

- `packages/core/src/models/bid.ts` - Bid, BiddingRound, Contract types and all functions
- `packages/core/__tests__/models/bid.test.ts` - 56 TDD test cases

### Files Modified

- `packages/core/src/utils/id.ts` - Added "bid" and "contract" to EntityType union
- `packages/core/src/models/index.ts` - Added barrel exports for bid module
- `packages/core/src/index.ts` - Added root barrel exports for bid module
- `eslint.config.mjs` - Extended test overrides with `no-unsafe-argument` and `no-explicit-any`

### Key Functions

- `createPassBid(playerPosition, idGenerator)` - Creates frozen pass bid
- `createSuitBid(playerPosition, value, suit, idGenerator)` - Creates frozen suit bid
- `createCoincheBid(playerPosition, idGenerator)` - Creates frozen coinche bid
- `createSurcoincheBid(playerPosition, idGenerator)` - Creates frozen surcoinche bid
- `createBiddingRound(dealerPosition, idGenerator)` - Creates frozen bidding round
- `placeBid(round, bid)` - Validates and applies bid, returns new frozen round
- `isValidBid(round, bid)` - Checks if a bid is legal in the current round state
- `getContract(round, idGenerator)` - Extracts contract from completed round
- `getNextPlayerPosition(position)` - Clockwise rotation (pos + 1) % 4
- `isOnSameTeam(pos1, pos2)` - Partners check: |pos1 - pos2| === 2 or same

## Technical Decisions

| Decision              | Choice                                        | Rationale                                                                 |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| Bid identity          | `playerPosition` (not playerId)               | Enables team derivation without external data                             |
| 4 factory functions   | Separate per bid type                         | Cleaner than overloaded single factory, type-safe                         |
| Coinche flow          | Immediate end model                           | After coinche, only bidding team responds (surcoinche or pass), then done |
| Bid values            | 80-160 step 10, frozen const                  | Standard Tunisian range, `as const` for type safety                       |
| BiddingRound state    | Computed during `placeBid`                    | Auto-completion avoids external state management                          |
| Contract extraction   | Separate `getContract()` function             | Only valid on completed rounds, enforced by throw                         |
| ESLint test overrides | Added `no-unsafe-argument`, `no-explicit-any` | Tests intentionally use `85 as any` for invalid value testing             |

## Refactoring Performed

- Split `getContract` null checks into separate `if` statements to satisfy ESLint `prefer-optional-chain` while preserving TypeScript narrowing
- Extended ESLint test file overrides with `no-unsafe-argument` and `no-explicit-any`

## Risks Identified

- None blocking

## Validation Results

- `pnpm test`: 177/177 passing (121 prior + 56 new)
- `pnpm run typecheck`: Clean
- `pnpm run lint`: Clean
- `pnpm run format:check`: Clean

## Next Iteration: N+1 (Iteration 5)

**Trick Mechanics (TDD)**

- Trick entity (id, cards played, leading suit, winner)
- Play card logic with Belote rule validation (must follow suit, must trump, must overtrump)
- Trick winner determination (trump vs non-trump comparison)
- Remove played card from player hand
- 8 tricks per round validation

## Iteration N+2 Preview (Iteration 6)

**Round Scoring (TDD)**

- Score calculation per round (sum card points + last trick bonus)
- Contract success/failure evaluation (did contracting team reach their bid?)
- Points attribution based on contract result
- Coinche/surcoinche score multipliers
- Belote/Rebelote announcement bonus (+20)
