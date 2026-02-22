# Iteration 36 Report: BiddingPanel → React

**Date**: 2026-02-22
**Status**: Complete

## Goal

Rewrite BiddingPanel as a React functional component with 5 buttons (4 suits + pass), using `computeBiddingLayout` (unchanged).

## Scope

1. Create `bidding-panel-react.tsx` with `BiddingPanelReact` component
2. Extract testable helpers: `drawSuitButtonBg`, `drawPassButtonBg`, `suitButtonConfig`
3. Props: `zone: Rect`, `onSuitBid?: (suit: Suit) => void`, `onPass?: () => void`
4. Write TDD tests (red → green)
5. Create `bidding-panel-react.stories.tsx` with Landscape/Portrait variants
6. Update barrel exports
7. Old `bidding-panel.ts` unchanged
8. All 4 checks pass

## PO Decisions Locked

- **FancyButton deferred**: Manual Graphics + pointerdown events for consistency with imperative version and simplicity. `@pixi/ui` FancyButton can be explored in a future polish iteration.
- **Props over methods**: `onSuitBid` and `onPass` are callback props (React pattern), not method-based registration like the imperative `panel.onSuitBid(cb)`.
- **Named constants**: `BUTTON_RADIUS`, `SUIT_SYMBOL_OFFSET_Y`, `SUIT_NAME_OFFSET_Y` extracted from magic numbers in the imperative version.
- **Label parity**: React component uses the same labels as imperative version (`bidding-panel`, `bid-{suit}`, `bid-pass`, `button-bg`, `button-suit`, `button-name`, `button-text`).

## Tests Written (10 test cases, written before implementation)

### `__tests__/bidding-panel-react.test.tsx`

- `exports the component function` — verifies module export
- `exports drawSuitButtonBg function` — verifies draw helper export
- `exports drawPassButtonBg function` — verifies draw helper export
- `exports suitButtonConfig function` — verifies config helper export
- `returns a valid React element` — validates createElement with zone prop
- `accepts onSuitBid and onPass callback props` — validates optional callback props
- `drawSuitButtonBg draws dark background with gold border` — validates Graphics calls with THEME tokens
- `drawPassButtonBg draws subtler background with muted border` — validates Graphics calls with muted style
- `suitButtonConfig returns symbol, color, and name for each suit` — validates per-suit config output
- `suitButtonConfig returns distinct names for all 4 suits` — validates uniqueness of suit names

## Implementation Summary

### Files Created

- `packages/ui/src/components/bidding/bidding-panel-react.tsx` — React BiddingPanel component + extracted helpers
- `packages/ui/src/components/bidding/bidding-panel-react.stories.tsx` — 2 story variants
- `packages/ui/__tests__/bidding-panel-react.test.tsx` — 10 tests

### Files Modified

- `packages/ui/src/index.ts` — added `BiddingPanelReact`, `drawSuitButtonBg`, `drawPassButtonBg`, `suitButtonConfig`, `BiddingPanelReactProps` exports

### Key Types

- `BiddingPanelReactProps` — `{ zone: Rect; onSuitBid?: (suit: Suit) => void; onPass?: () => void }`

### Key Functions

- `BiddingPanelReact({ zone, onSuitBid, onPass })` — React component rendering 5 interactive buttons
- `drawSuitButtonBg(g, width, height)` — Graphics callback for suit button background
- `drawPassButtonBg(g, width, height)` — Graphics callback for pass button background
- `suitButtonConfig(suit)` — returns `{ symbol, color, name }` for a given suit

## Technical Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| FancyButton vs manual Graphics | Manual Graphics + pointerdown | Consistency with imperative version; FancyButton adds complexity for minimal gain at this stage |
| Callback props vs method registration | Props (`onSuitBid`, `onPass`) | React idiomatic pattern; callbacks flow down from parent |
| computeBiddingLayout reuse | Unchanged pure math | Layout math is framework-agnostic; survives migration per plan preservation rules |
| Event handling | `onPointerDown` on pixiContainer | Same event as imperative `pointerdown`; touch-compatible |

## Refactoring Performed

None. Imperative `bidding-panel.ts` untouched.

## Risks Identified

- **Visual rendering not verified**: Component built to TypeScript/lint compliance. Run `pnpm storybook` to confirm buttons render correctly in Landscape and Portrait variants.
- **Touch target sizing**: `computeBiddingLayout` enforces `MIN_TAP_SIZE` (44px) from THEME — same as imperative version. Visually verify in Storybook that buttons are large enough for thumb interaction.

## Validation Results

- `pnpm test`: **869/869 passing** (10 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 37 (HandDisplay → React)

**Scope**: Rewrite HandDisplay as a React component with card fan and tap interaction.

**Acceptance criteria**:

1. `hand-display-react.tsx` renders N cards using `computeHandLayout` (unchanged)
2. CardSprite mounted via ref (imperative class stays for now)
3. Playable/non-playable alpha and eventMode via props
4. `onCardTap(index, card)` callback prop
5. `hand-display-react.stories.tsx` renders in Storybook
6. Tests for component logic + valid React element
7. Old `hand-display.ts` unchanged
8. All 4 checks pass

## Iteration 38 Preview (OpponentHand → React)

**Scope**: Rewrite OpponentHand as a React component with face-down cards. Uses `computeOpponentLayout` (unchanged). CardSprite via ref pattern (same as HandDisplay). Includes Storybook story.
