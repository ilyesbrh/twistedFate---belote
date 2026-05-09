# Iteration 053 Report — SA/TA trick-winning order

**Date**: 2026-05-09
**Status**: Complete

## Goal

Fix trick-playing logic so SA and TA contracts use the correct
card-ranking and following rules. Previously `trick.trumpSuit` held
a "hearts" sentinel for SA/TA, causing wrong trick winners and
invalid overtrump checks.

## Scope

1. `packages/coinche/core/src/models/trick.ts` — added
   `contractType: ContractType` to `Trick`, updated `createTrick`,
   `isValidPlay`, `determineTrickWinner`, `playCard`.
2. `packages/coinche/core/src/models/round.ts` — passes
   `contract.contractType` to `createTrick` at both call sites.
3. Updated 7 test files to add `"suit"` / `contractType` fields.
4. New `packages/coinche/core/__tests__/models/sa-ta-tricks.test.ts`
   — 11 SA/TA-specific tests.

## PO Decisions Locked

- SA following: must follow led suit; play anything if unable — no
  trump obligation.
- SA winner: highest `NON_TRUMP_ORDER` rank in led suit (ace beats
  jack).
- TA following: must follow led suit; if unable, must overtrump
  (`TRUMP_ORDER` rank) any card on table if possible.
- TA winner: highest `TRUMP_ORDER` rank across all 4 cards; tied
  rank → led-suit card wins.

## Tests Written (11 new, written before implementation)

| Test name                                         | Asserts                                               |
| ------------------------------------------------- | ----------------------------------------------------- |
| SA — leading player can play any card             | isValidPlay = true for jack                           |
| SA — must follow led suit                         | heart valid, spade invalid when hearts in hand        |
| SA — any card when can't follow (no trump oblig.) | both non-hearts valid                                 |
| SA winner — ace beats jack of led suit            | position 1 (ace) wins over position 0 (jack)          |
| SA winner — cross-suit cards cannot win           | 7♥ beats aces of 3 other suits                        |
| TA — must follow led suit                         | heart valid, spade invalid when hearts in hand        |
| TA — must overtrump when can't follow             | jack valid, 7 invalid when jack can overtrump         |
| TA — any card when can't overtrump                | both low cards valid when jack already on table       |
| TA winner — jack of spades beats ace of hearts    | position 1 (J♠) wins over position 0 (A♥)             |
| TA winner — 9 beats ace and 10 from any suit      | position 2 (9♦) wins                                  |
| TA winner — tied rank → led-suit wins             | position 0 (7♥ led) wins over three 7s of other suits |

**Red phase confirmed**: 22 tests failed before implementation.

## Implementation Summary

### Files Created

- `packages/coinche/core/__tests__/models/sa-ta-tricks.test.ts`

### Files Modified

- `packages/coinche/core/src/models/trick.ts`:
  - `Trick.contractType: ContractType` added.
  - `createTrick` gains `contractType` as 3rd arg (before `idGenerator`).
  - Added `taRank(card)` and `saRank(card)` private helpers.
  - `isValidPlay` switches on `trick.contractType`:
    - SA: returns `true` when can't follow (no trump obligation).
    - TA: computes `highestOnTable` via `taRank`; must overtrump if
      any non-led-suit card in hand beats it.
    - suit: existing logic unchanged.
  - `determineTrickWinner` switches on `contractType`:
    - SA: highest `saRank` in led-suit cards.
    - TA: highest `taRank` across all cards; tie → led-suit card wins.
    - suit: unchanged.
  - `playCard` passes `trick.contractType` to `determineTrickWinner`
    and preserves field in returned trick.
- `packages/coinche/core/src/models/round.ts` — both `createTrick`
  calls pass `contract.contractType`.
- `packages/coinche/core/__tests__/models/scoring.test.ts` —
  `contractType: "suit"` added to trick helpers.
- `packages/coinche/core/__tests__/models/coinche-scoring.test.ts` —
  same.
- `packages/coinche/core/__tests__/models/contract-types.test.ts` —
  fixed wrong field names (`leadPlayerPosition` → `leadingPlayerPosition`)
  and added `contractType`/`trumpSuit`.
- `packages/coinche/core/__tests__/models/bid-sa-ta.test.ts` —
  added `contractType: "sans-atout"`.
- `packages/coinche/core/__tests__/models/trick.test.ts` — 55 calls
  updated with `"suit"` arg.
- `packages/coinche/core/__tests__/ai/strategy.test.ts` — 24 calls
  updated.

### Key functions changed

- `createTrick(leader, trumpSuit, contractType, idGen)` — 4 args.
- `taRank(card)` — `getCardRankOrder(card, card.suit)` (TRUMP_ORDER).
- `saRank(card)` — `getCardRankOrder(card, null)` (NON_TRUMP_ORDER).

## Technical Decisions

| Decision                                      | Choice                                       | Rationale                                                                     |
| --------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `contractType` on `Trick` vs. parameter       | Store on `Trick`                             | Single source; `isValidPlay`/`determineTrickWinner` don't need extra arg      |
| `taRank` passes card's own suit               | `getCardRankOrder(card, card.suit)`          | Existing helper returns TRUMP_ORDER when suit matches trumpSuit; no new table |
| TA tie-breaking → led-suit card wins          | `cr === wr && current.card.suit === ledSuit` | Mirrors normal "trump beats non-trump" logic; edge case rarely occurs         |
| `trumpSuit` kept on `Trick` for "suit" branch | Not removed                                  | The `determineTrickWinner` suit-branch still needs it; removing it cascades   |

## Refactoring Performed

None beyond the targeted feature.

## Risks Identified

- **`Trick.trumpSuit` is still a sentinel "hearts" for SA/TA
  contracts** — it is only read in the `"suit"` branch of the switch,
  so it never affects SA/TA scoring/following. Future refactoring
  could make it `Suit | null`, but that's a separate iteration.
- **AI strategy (`chooseBid`/`chooseCard`)** still uses
  `round.contract.suit` for trump heuristics. For SA/TA contracts
  this is the sentinel — AI card selection may be suboptimal, but it
  produces valid plays (validated by `isValidPlay`).

## Validation Results

| Check               | Result                                     |
| ------------------- | ------------------------------------------ |
| `pnpm test`         | ✅ **1954 / 1954 passing** (88 test files) |
| `pnpm typecheck`    | ✅ Clean                                   |
| `pnpm lint`         | ✅ Delta-clean                             |
| `pnpm format:check` | ✅ Clean                                   |

## Next Iteration: 054 — Capot bid type

**Goal**: Add `"capot"` to the Coinche bid model per
`docs/games/coinche/GAME_RULES.md` §7.

**Scope:**

- `BidType` gains `"capot"`.
- `createCapotBid(playerPosition, idGen)` factory.
- Bidding ends immediately when capot is bid.
- `calculateCapotScore`: not-bid capot = 250 + contract; bid+made =
  500; bid+failed = 500 to opponents; coinched = 1000/2000.
- Tests first per TDD discipline.

## Iteration 055 Preview — Announcements model

Add `AnnouncementType` (tierce, quarte, quinte, carré) to
`@coinche/core` with `validateAnnouncements(hand)` and announcement
scoring hooks per `docs/games/coinche/GAME_RULES.md` §8.
