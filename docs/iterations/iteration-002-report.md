# Iteration 2 Report: Card Entity

**Date**: 2026-02-17
**Status**: Complete

## Goal

Implement the Card domain entity with Belote-specific point values, rank ordering, deck creation, and Fisher-Yates shuffle - all TDD-driven.

## Scope

1. Card types: Suit (4 suits), Rank (8 ranks)
2. Belote point constants: trump and non-trump values
3. Rank ordering: trump order (Jack > 9 > Ace > ...) and non-trump order (Ace > 10 > King > ...)
4. Card creation with deterministic IDs via IdGenerator
5. Immutable cards (Object.freeze)
6. Full 32-card deck creation
7. Deterministic Fisher-Yates shuffle

## Tests Written (47 test cases, written before implementation)

- Constants validation (13 tests): suit/rank counts, point values, totals (62 trump, 30 non-trump), ordering arrays
- Card creation (6 tests): suit/rank assignment, ID prefix, uniqueness, determinism, all combinations, immutability
- Card points (7 tests): trump vs non-trump, null trump, special cards (Jack=20, 9=14), exhaustive rank checks
- Card rank order (9 tests): trump ordering (Jack highest), non-trump ordering (Ace highest), uniqueness, full sequence validation
- Deck creation (6 tests): 32 cards, all combinations, unique IDs, determinism, 8 per suit
- Deck shuffle (6 tests): immutability, card preservation, deterministic shuffle, different seeds, edge cases

## Implementation Summary

### Files Created

- `packages/core/src/models/card.ts` - Card types, constants, and functions
- `packages/core/src/models/index.ts` - Barrel exports
- `packages/core/__tests__/models/card.test.ts` - 47 TDD test cases

### Key Functions

- `createCard(suit, rank, idGenerator)` - Creates frozen Card with unique ID
- `getCardPoints(card, trumpSuit)` - Returns trump or non-trump points
- `getCardRankOrder(card, trumpSuit)` - Returns ordering index for comparison
- `createDeck(idGenerator)` - Generates all 32 Belote cards
- `shuffleDeck(deck, rng)` - Immutable Fisher-Yates shuffle

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Card immutability | Object.freeze | Prevents accidental mutation, enforces value semantics |
| Shuffle algorithm | Fisher-Yates | O(n), unbiased, well-proven |
| Shuffle immutability | Returns new array | Original deck preserved, functional style |
| RNG injection | `rng: () => number` parameter | Allows deterministic testing with seeded PRNG |
| ESLint test rules | Relaxed for test files | Tests are the spec - config adapts to tests, not reverse |

## Refactoring Performed

- Added test-specific ESLint override: disabled `no-non-null-assertion`, `no-unused-vars`, `explicit-function-return-type` for test files
- Lesson learned: **never modify tests to satisfy linter - modify linter config instead (TDD discipline)**

## Risks Identified

- None blocking

## Validation Results

- `pnpm test`: 88/88 passing (285ms)
- `pnpm run typecheck`: Clean
- `pnpm run lint`: Clean
- `pnpm run format:check`: Clean

## Next Iteration Candidate

**Iteration 3: Player and Team Models (TDD)**

- Player entity (id, name, hand, team reference)
- Team entity (id, players, score)
- Deal cards to players (8 cards each from shuffled deck)
