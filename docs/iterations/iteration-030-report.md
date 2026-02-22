# Iteration 30 Report: TrumpIndicator → React

**Date**: 2026-02-22
**Status**: Complete

## Goal

Rewrite TrumpIndicator as a React functional component (`.tsx`). First real component migration, establishing the pattern for all subsequent components.

## Scope

1. Create `src/components/hud/trump-indicator-react.tsx` as a React functional component
2. Extract testable helpers: `drawTrumpBadge` (Graphics draw callback) and `trumpTextConfig` (suit → symbol/color)
3. Write 7 tests (TDD: RED → GREEN)
4. Update barrel exports
5. Old `trump-indicator.ts` unchanged (file-level coexistence)

## PO Decisions Locked

- **Component naming**: `TrumpIndicatorReact` (suffixed with `React`) to coexist with imperative `TrumpIndicator` during migration. Suffix will be dropped at iteration 41 cleanup.
- **No hooks needed**: `drawTrumpBadge` is a stable module-level function (badge shape/color is static). `trumpTextConfig` is a pure function. No `useCallback`/`useMemo` required.
- **DropShadowFilter deferred**: The imperative version applies a DropShadowFilter. The React version omits it for now — adding filters requires either `useMemo` (hook) or module-level instantiation (WebGL dependency at import time). Will be added when the React root (`<Application>`) provides a proper rendering context.

## Tests Written (7 test cases, written before implementation)

### `__tests__/trump-indicator-react.test.tsx`

- `exports the component function` — verifies module exports
- `exports drawTrumpBadge function` — verifies draw callback export
- `exports trumpTextConfig function` — verifies text config helper export
- `returns a valid React element for each suit` — validates JSX output for all 4 suits
- `drawTrumpBadge applies THEME badge geometry` — mock Graphics, verifies clear/roundRect/fill/stroke with THEME tokens
- `trumpTextConfig returns correct symbol and color for each suit` — verifies all 4 suits map correctly
- `trumpTextConfig returns different values for red vs black suits` — verifies hearts vs spades differ

## Implementation Summary

### Files Created

- `packages/ui/src/components/hud/trump-indicator-react.tsx` — React functional component + extracted helpers
- `packages/ui/__tests__/trump-indicator-react.test.tsx` — 7 tests

### Files Modified

- `packages/ui/src/index.ts` — added `TrumpIndicatorReact`, `drawTrumpBadge`, `trumpTextConfig` exports + `TrumpIndicatorProps` type

### Key Functions

- `TrumpIndicatorReact({ suit }: TrumpIndicatorProps): React.JSX.Element` — renders `<pixiContainer>` with `<pixiGraphics>` badge + `<pixiText>` suit symbol
- `drawTrumpBadge(g: Graphics): void` — draws the rounded-rect badge using THEME.indicators tokens
- `trumpTextConfig(suit: Suit): { text: string; fill: string }` — maps suit to display symbol and color

## React Component Pattern Established

This iteration establishes the pattern for all subsequent component migrations:

1. **Extract testable logic**: Draw callbacks and config computation as named exports
2. **Test with mocks**: Graphics draw callback tested via mock object with `vi.fn()` spies
3. **Test React elements**: Validate `isValidElement()` on component output for all prop variants
4. **No hooks for static data**: When draw/config doesn't depend on state, use module-level functions
5. **File-level coexistence**: `.tsx` alongside `.ts`, both exported from barrel

## Technical Decisions

| Decision                 | Choice                             | Rationale                                                                                            |
| ------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Component name suffix    | `TrumpIndicatorReact`              | Avoids name collision with imperative `TrumpIndicator` during coexistence                            |
| Draw callback extraction | `drawTrumpBadge` as named export   | Enables unit testing without React reconciler or canvas                                              |
| Text config extraction   | `trumpTextConfig` as named export  | Pure function, testable without JSX                                                                  |
| No DropShadowFilter      | Deferred to React root integration | Filter instantiation requires WebGL; will add via `filters` prop when `<Application>` context exists |
| No hooks                 | Static module-level functions      | Badge geometry and THEME are compile-time constants; no state or side effects                        |

## Refactoring Performed

None.

## Risks Identified

- DropShadowFilter missing in React version — visual regression vs imperative version. Mitigated: will be re-added in iteration 38 when `<Application>` root provides WebGL context.

## Validation Results

- `pnpm test`: **832/832 passing** (7 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 31 (TurnIndicator → React)

**Scope**: Rewrite TurnIndicator as a React functional component with dynamic pill-shaped background. Tests `useRef` + measurement pattern needed for dynamic sizing.

**Acceptance criteria**:

1. `src/components/hud/turn-indicator-react.tsx` renders arrow + player name with pill background
2. Props interface: `{ seat: Seat; playerName: string }`
3. Tests: renders, updates on prop change, correct positioning
4. Old `turn-indicator.ts` unchanged (coexistence)
5. All 4 checks pass

## Iteration 32 Preview (ScorePanel → React)

Rewrite ScorePanel as a React functional component with team scores and labels. Two-column layout with THEME typography tokens.
