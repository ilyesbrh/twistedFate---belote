# Iteration 40 Report: TrickDisplay → React (with MaskedFrame)

**Date**: 2026-02-23
**Status**: Complete

## Goal

Rewrite TrickDisplay as a React functional component using `computeTrickLayout` (unchanged) and `createMaskedCard` for face-up trick cards with proper scaling.

## Scope

1. `trick-display-react.tsx` — React component rendering 0–4 played cards at N/S/E/W positions
2. Cards scaled to fit trick dimensions, then wrapped in `createMaskedCard` for bordered rendering
3. Props: `zone: Rect`, `cards: readonly TrickCardReact[]`
4. Tests for component export + valid React element (4 tests)
5. Storybook story with 4 variants (Empty, OneCard, TwoCards, FullTrick)
6. Barrel exports in `index.ts`
7. Old `trick-display.ts` unchanged

## PO Decisions Locked

- **Card scaling before masking**: Unlike hand cards which are close to natural Graphics size, trick cards are smaller (35% of zone height). Card face Graphics is explicitly scaled to fit trick dimensions before being wrapped in `createMaskedCard`, ensuring the entire card face is visible at the smaller size.
- **Same ref-callback mounting pattern**: Follows established pattern from HandDisplayReact and OpponentHandReact — imperative Graphics creation in ref callback, wrapped in MaskedFrame.
- **No interaction states**: Trick cards are view-only (no tap, no hover, no playable/non-playable distinction). Simpler than HandDisplayReact.
- **Key by position+suit+rank**: React key uses `${position}-${suit}-${rank}` for stable identity.

## Tests Written (4 test cases, written before implementation)

### `__tests__/trick-display-react.test.tsx` — 4 tests

- exports the TrickDisplayReact component function
- returns a valid React element with trick cards (4 cards)
- returns a valid React element with empty cards
- returns a valid React element with one card

## Implementation Summary

### Files Created (3)

- `packages/ui/src/components/trick/trick-display-react.tsx` — React TrickDisplay component
- `packages/ui/__tests__/trick-display-react.test.tsx` — 4 tests
- `packages/ui/src/components/trick/trick-display-react.stories.tsx` — 4 story variants

### Files Modified (1)

- `packages/ui/src/index.ts` — barrel exports for TrickDisplayReact, TrickCardReact, TrickDisplayReactProps

### Key Types

- `TrickCardReact` — `{ position: TrickPosition, suit: Suit, rank: Rank }`
- `TrickDisplayReactProps` — `{ zone: Rect, cards: readonly TrickCardReact[] }`

### Key Functions

- `TrickDisplayReact(props)` — React functional component

## Technical Decisions

| Decision              | Choice                                                            | Rationale                                                                                       |
| --------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Scale before mask     | `gfx.scale.set(cardWidth/naturalWidth, cardHeight/naturalHeight)` | Trick cards are smaller than natural Graphics size; scaling ensures entire card face is visible |
| Ref-callback mounting | Same pattern as HandDisplayReact                                  | Consistency; imperative Graphics don't map to JSX                                               |
| No extracted helpers  | No pure helpers to test separately                                | Component is simple — no interaction logic, no computed states                                  |
| 4 story variants      | Empty, OneCard, TwoCards, FullTrick                               | Covers all meaningful card counts (0, 1, 2, 4)                                                  |

## Refactoring Performed

None

## Risks Identified

- **MaskedFrame PixiJS warning**: `"Mask bounds, renderable is not inside the root container"` appears during tests. This is a known PixiJS warning when MaskedFrame is used outside a running Application — harmless in headless test environment.

## Errors Encountered and Fixed

1. **`@typescript-eslint/no-non-null-assertion`**: `ALL_CARDS[0]!` in story — changed to `ALL_CARDS.slice(0, 1)`
2. **Prettier formatting**: 3 files — fixed with `prettier --write`

## Validation Results

- `pnpm test`: **909/909 passing** (4 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 41 (TableLayout with @pixi/layout flexbox)

**Scope**: Rewrite TableLayout using Yoga-powered flexbox from `@pixi/layout`. 5-zone structure with column flex. Background felt as `<pixiGraphics>` draw callback.

**Acceptance criteria**:

1. `table-layout-react.tsx` uses LayoutContainer for Yoga-powered flexbox zone positioning
2. 5-zone structure: top (18%) + middle row (left 15% + center 70% + right 15%) + bottom (28%)
3. Background felt as `<pixiGraphics>` draw callback
4. Tests for component + valid React element
5. `table-layout-react.stories.tsx` renders in Storybook
6. Old `table-layout.ts` unchanged
7. All 4 checks pass

## Iteration 42 Preview (GameRenderer → React `<GameRoot>`)

**Scope**: Replace the imperative GameRenderer with a React Application root. Receives `GameView` as props, distributes to child React components. All zone composition in JSX using TableLayout flexbox.
