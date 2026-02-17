# Iteration 5 Report: Trick Mechanics

**Date**: 2026-02-17
**Status**: Complete

## Goal

Implement the Trick Mechanics — the core gameplay loop where players play cards following Belote rules and trick winners are determined. This builds on the bidding system (iteration 4) and is the prerequisite for round scoring (iteration 6).

## Scope

1. **Refactoring**: Extract `getNextPlayerPosition`/`isOnSameTeam` from `bid.ts` to shared `player-helpers.ts` (review note from iteration 4)
2. Trick entity (id, played cards, leading player, trump suit, winner)
3. Play card validation with Belote rule enforcement (must follow suit, must trump, must overtrump)
4. Trick winner determination (trump vs non-trump comparison)
5. Hand management: remove played card from player's hand
6. Turn order enforcement via clockwise rotation

**Deferred from iteration 4 N+1**: "8 tricks per round validation" — belongs to the Round entity lifecycle, deferred to iteration 7 (Round/Game State Machine).

## PO Decision Locked

- **Overtrump when partner winning**: Must ALWAYS overtrump, even if partner is currently winning the trick (strict rule)

## Tests Written (52 test cases, written before implementation)

- Trick Creation (7 tests): ID prefix, leading player, trump suit, empty cards, in_progress state, null winner, frozen
- PlayedCard Tracking (4 tests): add card, track led suit, maintain order, immutability
- Must Follow Suit (7 tests): allow led suit, reject non-led suit when has led suit, allow any led suit card, allow non-led when no led suit, leading player any card, validate hand, reject card not in hand
- Must Trump (6 tests): require trump, reject non-trump, allow any trump (no trump on table), allow anything when no trump, follow suit priority, correct trump identification
- Must Overtrump (8 tests): require higher trump, reject lower trump, allow lower when no higher, must overtrump even if partner winning (PO decision), allow anything when no trump, rank comparison, multiple trumps on table, follow suit priority over overtrump
- Winner Determination (8 tests): highest led suit, highest trump, ignore off-suit non-trump, trump ranking (jack highest), non-trump ranking (ace highest), throw if not completed, single trump, multiple trumps
- Hand Management (5 tests): remove card, immutability, preserve player fields, throw if not in hand, frozen
- Integration (7 tests): full trick no trump, trump beats led suit, auto-complete, reject 5th card, turn order, overtrumping scenario, winner tracking

## Implementation Summary

### Files Created

- `packages/core/src/models/player-helpers.ts` - Shared helpers extracted from bid.ts
- `packages/core/src/models/trick.ts` - Trick entity, validation, winner determination, hand management
- `packages/core/__tests__/models/trick.test.ts` - 52 TDD test cases

### Files Modified

- `packages/core/src/models/bid.ts` - Import + re-export helpers from player-helpers.ts
- `packages/core/src/models/index.ts` - Updated barrel exports (helpers from player-helpers.js, trick exports)
- `packages/core/src/index.ts` - Updated root barrel exports
- `docs/GAME_RULES.md` - Updated overtrump PO decision

### Key Functions

- `createTrick(leadingPlayerPosition, trumpSuit, idGenerator)` - Creates frozen trick
- `isValidPlay(trick, card, playerPosition, playerHand)` - Validates play against all rules
- `playCard(trick, card, playerPosition, playerHand)` - Validates + applies card, auto-completes at 4 cards
- `getTrickWinner(trick)` - Returns winner of completed trick, throws otherwise
- `removeCardFromHand(player, card)` - Removes card from hand, returns new frozen player

### Validation Priority Chain (isValidPlay)

1. Trick must be `in_progress`
2. Must be correct player's turn (clockwise order)
3. Card must be in player's hand
4. Leading player can play anything
5. Must follow suit if able
6. Must trump if unable to follow suit and has trump
7. Must overtrump if trump already on table and has higher trump
8. Otherwise, play any card

## Technical Decisions

| Decision               | Choice                                     | Rationale                                                        |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| Shared helpers module  | `player-helpers.ts`                        | Both bid.ts and trick.ts need player position helpers            |
| Backward compatibility | bid.ts re-exports from player-helpers.ts   | Existing imports from bid.js continue to work                    |
| `trumpSuit` type       | `Suit` (not `Suit \| null`)                | Contract always determines a trump suit in Belote                |
| Turn order enforcement | Inside `isValidPlay`                       | Prevents out-of-order plays; uses shared `getNextPlayerPosition` |
| Winner at completion   | Computed in `playCard` when 4th card added | No separate mutation step needed; winner is part of frozen Trick |
| `removeCardFromHand`   | In trick.ts                                | Logically tied to trick play; delegates to `setPlayerHand`       |
| `isOnSameTeam` unused  | Not needed in trick validation             | Overtrump-always rule eliminates team checks in validation       |
| Card comparison        | Reuse `getCardRankOrder` from card.ts      | Already handles trump vs non-trump ranking correctly             |

## Refactoring Performed

- Extracted `getNextPlayerPosition` and `isOnSameTeam` from `bid.ts` to `player-helpers.ts` (iteration 4 review note)
- Updated `bid.ts` to import and re-export from `player-helpers.ts` for backward compatibility
- Updated barrel exports in `models/index.ts` to source helpers from `player-helpers.js`

## Risks Identified

- None blocking

## Validation Results

- `pnpm test`: 229/229 passing (177 prior + 52 new)
- `pnpm run typecheck`: Clean
- `pnpm run lint`: Clean
- `pnpm run format:check`: Clean

## Next Iteration: N+1 (Iteration 6)

**Round Scoring (TDD)**

- Score calculation per round (sum card points + last trick bonus of 10)
- Contract success/failure evaluation (did contracting team reach their bid?)
- Points attribution based on contract result
- Coinche/surcoinche score multipliers (×2 / ×4)
- Belote/Rebelote announcement bonus (+20)

## Iteration N+2 Preview (Iteration 7)

**Round/Game State Machine (TDD)**

- Full round lifecycle (deal → bid → 8 tricks → score)
- Game loop with target score tracking
- Round entity connecting bidding, tricks, and scoring
- Game completion conditions
