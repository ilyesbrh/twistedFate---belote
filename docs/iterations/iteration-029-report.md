# Iteration 29 Report: useTheme Hook + TSX Pipeline Validation

**Date**: 2026-02-22
**Status**: Complete

## Goal

Create the `useTheme` hook, validate the `.tsx` pipeline end-to-end, and refine the coexistence strategy based on `@pixi/react` API constraints.

## Scope

1. Create `src/hooks/use-theme.ts` returning the frozen THEME object
2. Write first `.tsx` test file to validate JSX compilation, pragma resolution, and functional component patterns
3. Update barrel exports with `useTheme`
4. Revise coexistence strategy: dropped `renderReactIntoContainer` bridge (see Technical Decisions)

## PO Decisions Locked

- **Bridge concept dropped**: `@pixi/react`'s `createRoot` takes a DOM element and owns the entire Application lifecycle — there is no API to render a React sub-tree into an existing PixiJS Container. Coexistence is at the file level (`.tsx` alongside `.ts`), not at runtime.
- `useTheme` is a plain function (not a true React hook) until we add runtime theme switching. This keeps it usable in both React and non-React code.

## Tests Written (6 test cases, written before implementation)

### `__tests__/use-theme.test.ts`

- `exports useTheme function` — verifies module exports
- `returns the frozen THEME object` — verifies colors, typography, spacing, frozen
- `returns the same object on repeated calls` — verifies referential identity

### `__tests__/tsx-pipeline.test.tsx`

- `JSX compiles to valid React elements` — validates `react-jsx` pragma with `<div>`
- `React.createElement produces valid elements` — validates createElement API
- `functional component produces element with correct type` — validates custom component JSX

## Implementation Summary

### Files Created

- `packages/ui/src/hooks/use-theme.ts` — `useTheme()` function returning frozen THEME
- `packages/ui/__tests__/use-theme.test.ts` — 3 tests
- `packages/ui/__tests__/tsx-pipeline.test.tsx` — 3 tests (first `.tsx` file in the project)

### Files Modified

- `packages/ui/src/index.ts` — added `useTheme` export
- Migration plan file — updated coexistence strategy

### Key Functions

- `useTheme(): Readonly<Theme>` — returns the frozen THEME design tokens

## Technical Decisions

| Decision                             | Choice                                        | Rationale                                                                                                                  |
| ------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Drop renderReactIntoContainer bridge | File-level coexistence instead                | `@pixi/react` `createRoot` takes DOM elements, not PixiJS Containers; no API for React sub-trees in imperative scene graph |
| useTheme as plain function           | Not a true React hook (no useState/useEffect) | THEME is static and frozen; when we need runtime theme switching, we'll wrap in React context                              |
| TSX test assertions                  | `isValidElement` + `.type` only               | Avoids `element.props` (typed as `any`) which triggers strict `no-unsafe-member-access` lint errors                        |

## Refactoring Performed

None.

## Risks Identified

None — this iteration is low-risk infrastructure.

## Validation Results

- `pnpm test`: **825/825 passing** (6 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 30 (TrumpIndicator → React)

**Scope**: Rewrite TrumpIndicator as a React functional component (`.tsx`). First real component migration establishing the pattern for all subsequent components.

**Acceptance criteria**:

1. `src/components/hud/trump-indicator.tsx` renders suit badge using `<pixiGraphics>` + `<pixiText>`
2. Props interface: `{ suit: Suit }`
3. Tests: renders, updates on prop change, correct symbol/color from THEME
4. Old `trump-indicator.ts` unchanged (coexistence)
5. All 4 checks pass

## Iteration 31 Preview (TurnIndicator → React)

Rewrite TurnIndicator as a React functional component with dynamic pill-shaped background. Tests `useRef` + measurement pattern needed for dynamic sizing.
