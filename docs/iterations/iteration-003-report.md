# Iteration 3 Report: Player and Team Models

**Date**: 2026-02-17
**Status**: Complete

## Goal

Implement Player and Team domain entities with card dealing - the prerequisite for bidding and trick-taking in Belote.

## Scope

1. Player entity with id, name, position (0-3), and hand of cards
2. Immutable player updates via `setPlayerHand()`
3. Team entity pairing two partner players
4. `dealCards()` distributes 32 cards round-robin to 4 players (8 each)
5. Runtime validation: throws on invalid deck size or player count
6. All entities frozen (immutable), deterministic with seeded ID generators

## Tests Written (33 test cases, written before implementation)

- Player creation (7 tests): name, position, ID prefix, empty hand, uniqueness, determinism, frozen, all 4 positions
- setPlayerHand (5 tests): immutable update, preserves identity, frozen, no mutation, empty hand (clearing)
- Team creation (6 tests): two players, ID prefix, uniqueness, frozen, preserves refs, determinism
- dealCards (12 tests): 8 cards each, all 32 distributed, no duplicates, no mutation, preserves identity, frozen, round-robin order, deterministic, throws on <32 cards, throws on >32 cards, throws on !=4 players, cards are subset of deck
- Integration (3 tests): full flow (create players > teams > deck > shuffle > deal), no team card overlap, partner positions (0,2) and (1,3)

## Implementation Summary

### Files Created

- `packages/core/src/models/player.ts` - Player, Team types, and functions
- `packages/core/__tests__/models/player.test.ts` - 33 TDD test cases

### Key Functions

- `createPlayer(name, position, idGenerator)` - Creates frozen Player with empty hand and unique ID
- `setPlayerHand(player, hand)` - Immutable update, returns new frozen Player preserving identity
- `createTeam(player1, player2, idGenerator)` - Creates frozen Team with two partners
- `dealCards(deck, players)` - Round-robin distribution of 32 cards to 4 players (8 each)

## Technical Decisions

| Decision                   | Choice                              | Rationale                                                                     |
| -------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `dealCards` parameter type | `readonly Player[]` (not 4-tuple)   | Enables runtime validation that `noUncheckedIndexedAccess` respects           |
| Dealing pattern            | Round-robin by position order       | Simple, deterministic, card 0 > player 0, card 1 > player 1, etc.             |
| Hand updates               | Separate `setPlayerHand()` function | Immutable updates without new ID, consistent functional domain style          |
| Team player storage        | Embedded tuple `[Player, Player]`   | Direct references, partners sit across (positions 0,2 and 1,3)                |
| ESLint test overrides      | Extended with 2 more rules          | `restrict-template-expressions` and `no-unnecessary-type-assertion` for tests |

## Refactoring Performed

- Applied review fix from Iteration 2: `shuffleDeck` now throws on invariant violation instead of silent skip
- Extended ESLint test file overrides with `restrict-template-expressions` and `no-unnecessary-type-assertion`
- Updated barrel exports in `models/index.ts` and root `index.ts`

## Risks Identified

- None blocking

## Validation Results

- `pnpm test`: 121/121 passing (88 prior + 33 new)
- `pnpm run typecheck`: Clean
- `pnpm run lint`: Clean
- `pnpm run format:check`: Clean

## Next Iteration: N+1 (Iteration 4)

**Bidding System (TDD)**

- Bid types: Pass, Suit bid (hearts/diamonds/clubs/spades), Coinche, Surcoinche
- Bid entity with player reference, bid value, suit choice
- Bidding round logic: clockwise from dealer+1, ends after 3 consecutive passes
- Bid validation: must outbid previous, coinche/surcoinche rules
- Contract entity: winning bid result (suit, team, coinche level)

## Iteration N+2 Preview (Iteration 5)

**Trick Mechanics (TDD)**

- Trick entity (id, cards played, leading suit, winner)
- Play card logic with Belote rule validation (must follow suit, must trump, etc.)
- Trick winner determination (trump vs non-trump comparison)
- Remove played card from player hand
