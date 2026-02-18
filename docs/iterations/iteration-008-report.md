# Iteration 8 Report: AI Player / Basic Strategy

**Date**: 2026-02-18
**Status**: Complete

## Goal

Implement AI decision-making for computer-controlled players — basic heuristics for card play and bidding strategy. Also fill two utility gaps (`getValidPlays`, `getValidBids`) needed by both AI and future UI.

## Scope

1. **Domain utilities**: `getValidPlays` in trick.ts, `getValidBids` in bid.ts
2. **AI strategy module** (`ai/strategy.ts`): Heuristic-based card play and bidding

## Tests Written (56 test cases, written before implementation)

### trick.test.ts — getValidPlays (7 tests)

- Returns all cards when leading, only led-suit when must follow, only trump when must trump, all cards when no suit/trump, only higher trumps when must overtrump, all trumps when can't overtrump, empty for completed trick

### bid.test.ts — getValidBids (8 tests)

- Pass always included, all 37 options when no bid, only above highest, coinche for opponent, no coinche for teammate, surcoinche for teammate, no surcoinche for opponent, empty when completed

### strategy.test.ts (41 tests)

- **chooseCard — Leading** (6): Non-trump ace, aces over tens, all-trump hand, avoid leading trump, low cards, validity check
- **chooseCard — Following suit** (6): Cheapest winner, lowest when can't win, low for partner, ace to win, forced play, validity check
- **chooseCard — Must trump** (5): Lowest winning trump, lowest when can't overtrump, any when no trump on table, economy preference, validity check
- **chooseCard — Discarding** (4): Lowest value, zero-point preference, single card, validity check
- **chooseCardForRound** (4): Round extraction, hand by position, throw on wrong phase, throw on no trick
- **chooseBid — Hand evaluation** (8): Weak hand pass, J+9+A bid, strongest suit, ace support, strong hand high bid, below threshold pass, outbid, always pass on coinche
- **chooseBid — Integration** (4): Compatible with placeBid, first bidder, subsequent bidder, not-in-progress pass
- **evaluateHandForSuit** (4): J+9 scoring, ace support, empty suit, all-trump hand

## Implementation Summary

### Files Created

- `packages/core/src/ai/strategy.ts` — AI strategy: 4 public functions + private helpers
- `packages/core/src/ai/index.ts` — Barrel exports
- `packages/core/__tests__/ai/strategy.test.ts` — 41 TDD test cases
- `docs/iterations/iteration-008-report.md` — This report

### Files Modified

- `packages/core/src/models/trick.ts` — Added `getValidPlays()`
- `packages/core/src/models/bid.ts` — Added `getValidBids()`, imported `ALL_SUITS`
- `packages/core/src/models/index.ts` — Added `getValidPlays`, `getValidBids` exports
- `packages/core/src/index.ts` — Added utility + AI re-exports

### Key Types & Functions

```typescript
// Domain utilities
function getValidPlays(
  trick: Trick,
  playerPosition: PlayerPosition,
  playerHand: readonly Card[],
): Card[];
function getValidBids(
  biddingRound: BiddingRound,
  playerPosition: PlayerPosition,
  idGenerator: IdGenerator,
): Bid[];

// AI Card Play
function chooseCard(
  hand: readonly Card[],
  trick: Trick,
  trumpSuit: Suit,
  playerPosition: PlayerPosition,
): Card;
function chooseCardForRound(round: Round, playerPosition: PlayerPosition): Card;

// AI Bidding
function chooseBid(
  hand: readonly Card[],
  biddingRound: BiddingRound,
  playerPosition: PlayerPosition,
  idGenerator: IdGenerator,
): Bid;

// Hand Evaluation (exported for testing)
function evaluateHandForSuit(hand: readonly Card[], suit: Suit): number;
```

### Card Play Heuristics

| Situation                        | Strategy                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Leading                          | Play highest non-trump card (aces > tens > kings). If all trump: play lowest |
| Following suit (partner winning) | Play lowest suit card                                                        |
| Following suit (can win)         | Play cheapest winning card (economy)                                         |
| Following suit (can't win)       | Play lowest card of suit                                                     |
| Must trump (can overtrump)       | Play lowest winning trump                                                    |
| Must trump (can't overtrump)     | Play lowest trump                                                            |
| Discarding                       | Play lowest value card                                                       |

### Bidding Heuristics

- **Hand evaluation**: For each suit, sum trump points (J=20, 9=14, A=11, 10=10, K=4, Q=3) + length bonus (5 per trump) + ace support (11 per non-trump ace)
- **Threshold**: Bid if best suit strength >= minimum bid value (80 or next above current highest)
- **Value**: Bid highest value <= estimated strength
- **Simple AI**: Always passes when coinched (no surcoinche logic)

## Technical Decisions

| Decision                                           | Choice                    | Rationale                                                                                             |
| -------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `getValidPlays`/`getValidBids` in existing modules | trick.ts / bid.ts         | Companion utilities to `isValidPlay`/`isValidBid`, not AI-specific                                    |
| AI module location                                 | `packages/core/src/ai/`   | Separate concern from domain models, but still in core (pure functions)                               |
| `chooseCard` takes decomposed params               | Not full Round            | More testable, tests don't need full Round objects                                                    |
| `chooseCardForRound` as convenience wrapper        | Extracts state from Round | Clean API for callers who have a Round                                                                |
| `evaluateHandForSuit` exported                     | For testing               | Allows direct testing of hand evaluation logic                                                        |
| `firstElement`/`lastElement` helpers               | Avoids `!` and `as Type`  | Both `no-non-null-assertion` and `non-nullable-type-assertion-style` ESLint rules active              |
| `getValidBids` consumes IDs                        | Acceptable                | Uses `idGenerator` for each candidate bid; fine in production (random), tests use separate generators |

## Risks Identified

- Bidding thresholds may need tuning as gameplay testing reveals edge cases
- AI doesn't consider partner's bidding signals (future improvement)
- Simple AI always passes on coinche (no surcoinche logic)

## Validation Results

- `pnpm test`: 394/394 passing (338 prior + 7 getValidPlays + 8 getValidBids + 41 AI strategy)
- `pnpm run typecheck`: Clean
- `pnpm run lint`: Clean
- `pnpm run format:check`: Clean

## Next Iteration: N+1 (Iteration 9)

**App Layer / Command-Event Orchestration (TDD)**

- `@belote/app` package implementation
- Command/event pattern: `PlayCardCommand`, `PlaceBidCommand`, etc.
- Game session management integrating AI players
- Integration between core domain and application layer

## Iteration N+2 Preview (Iteration 10)

**UI Layer Foundation (TDD)**

- `@belote/ui` PixiJS setup
- Card rendering and table layout
- Basic interaction (tap to play)
- Integration with app layer commands
