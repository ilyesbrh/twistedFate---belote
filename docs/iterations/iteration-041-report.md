# Iteration 41 Report: TableLayout with @pixi/layout Flexbox

**Date**: 2026-02-23
**Status**: Complete

## Goal

Rewrite TableLayout as a React component using `@pixi/layout` Yoga-powered flexbox for zone positioning, replacing manual `computeLayout` zone math with percentage-based flex.

## Scope

1. `table-layout-react.tsx` — React component using `<layoutContainer>` for 5-zone flexbox layout
2. 5-zone structure: top (18%) + middle row (left 15% + center flex + right 15%) + bottom (28%)
3. Background drawn via `<pixiGraphics>` draw callback (radial gradient + felt pattern)
4. Zone slot props: `topContent`, `leftContent`, `centerContent`, `rightContent`, `bottomContent`
5. Extracted testable helpers: `zoneRatios`, `drawTableBackground`
6. Tests for component + helpers (8 tests)
7. Storybook story with 3 variants
8. Barrel exports in `index.ts`
9. Updated `pixi-react-setup.ts` with `@pixi/layout` and `@pixi/layout/react` imports
10. Old `table-layout.ts` unchanged

## PO Decisions Locked

- **@pixi/layout flexbox for zone positioning**: Zones sized via percentage strings (`"18%"`, `"28%"`, `"15%"`) matching the ratios from `computeLayout`. Yoga engine computes the actual pixel positions/sizes at runtime.
- **Non-layout background**: Background `<pixiGraphics>` sits as a sibling child (no `layout` prop) at position (0,0), rendered behind the flexbox zone structure. This avoids needing `<layoutGraphics>` registration.
- **Slot props for zone content**: Each zone accepts optional `ReactNode` content via `topContent`, `leftContent`, `centerContent`, `rightContent`, `bottomContent` props. This keeps the component composable.
- **Orientation-aware ratios**: `zoneRatios(orientation)` returns landscape or portrait percentage values, matching the existing `computeLayout` ratios.
- **`NumberPercent` type**: Zone ratio strings typed as `` `${number}%` `` template literal to satisfy `@pixi/layout`'s `NumberValue` type.

## Tests Written (8 test cases, written before implementation)

### `__tests__/table-layout-react.test.tsx` — 8 tests

- exports the TableLayoutReact component function
- exports the zoneRatios helper function
- exports the drawTableBackground helper function
- returns a valid React element
- returns a valid React element with slot content
- zoneRatios returns landscape ratios for landscape orientation
- zoneRatios returns portrait ratios for portrait orientation
- drawTableBackground draws gradient fill and felt pattern

## Implementation Summary

### Files Created (3)

- `packages/ui/src/components/table/table-layout-react.tsx` — React TableLayout with @pixi/layout flexbox
- `packages/ui/__tests__/table-layout-react.test.tsx` — 8 tests
- `packages/ui/src/components/table/table-layout-react.stories.tsx` — 3 story variants

### Files Modified (2)

- `packages/ui/src/pixi-react-setup.ts` — added `import '@pixi/layout'` (Container mixin) and `import '@pixi/layout/react'` (JSX type augmentation)
- `packages/ui/src/index.ts` — barrel exports for TableLayoutReact, zoneRatios, drawTableBackground, TableLayoutReactProps

### Key Types

- `TableLayoutReactProps` — `{ width, height, topContent?, leftContent?, centerContent?, rightContent?, bottomContent? }`
- `ZoneRatios` — `{ topHeight: NumberPercent, bottomHeight: NumberPercent, sideWidth: NumberPercent }`
- `NumberPercent` — `` `${number}%` `` (template literal matching @pixi/layout's NumberValue)

### Key Functions

- `TableLayoutReact(props)` — React functional component
- `zoneRatios(orientation)` — returns percentage zone dimensions for landscape/portrait
- `drawTableBackground(g, width, height)` — draws radial gradient + felt dot pattern

## Technical Decisions

| Decision                                      | Choice                                     | Rationale                                                      |
| --------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Flexbox via @pixi/layout                      | `<layoutContainer layout={{...}}>`         | Yoga-powered positioning replaces manual zone math             |
| Percentage zone sizing                        | `"18%"`, `"28%"`, `"15%"`                  | Matches existing computeLayout ratios, responsive              |
| Center zone via `flex: 1`                     | No explicit width for center               | Fills remaining space after left/right sidebars                |
| Background as non-layout child                | `<pixiGraphics>` without layout prop       | Avoids registering LayoutGraphics; draws at (0,0) behind zones |
| NumberPercent template type                   | `` `${number}%` ``                         | Satisfies @pixi/layout's strict NumberValue type               |
| `@pixi/layout` + `@pixi/layout/react` imports | Side-effect imports in pixi-react-setup.ts | Applies Container mixin globally + augments JSX types          |

## Errors Encountered and Fixed

1. **`layout` prop not recognized on `<layoutContainer>`**: Missing `import '@pixi/layout'` — the main export applies the Container mixin and `PixiMixins.ContainerOptions` augmentation that adds `layout` to constructor options. Added alongside existing `@pixi/layout/components` import.
2. **`string` not assignable to `NumberValue`**: Zone ratio strings typed as `string` but @pixi/layout expects `NumberPercent` (`` `${number}%` ``). Changed `ZoneRatios` interface to use `NumberPercent` template literal type.
3. **Prettier formatting**: 4 files — fixed with `prettier --write`.

## Refactoring Performed

None

## Risks Identified

- **Yoga calculation timing**: @pixi/layout computes positions asynchronously via the Yoga engine. Child components receiving zone rects as props won't automatically update when layout recalculates. During integration (iteration 42), the game root will need to either pass computed rects or let children read their container bounds.
- **Non-layout children interaction**: The `<pixiGraphics>` background has no layout and sits at (0,0). If @pixi/layout changes child ordering or positioning behavior in future versions, the background might shift.

## Validation Results

- `pnpm test`: **917/917 passing** (8 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 42 (GameRenderer → React `<GameRoot>`)

**Scope**: Replace the imperative GameRenderer with a React Application root. Receives `GameView` as props, distributes to child React components. All zone composition in JSX using `TableLayoutReact` with flexbox zones.

**Acceptance criteria**:

1. `game-root.tsx` wraps `<Application>` from `@pixi/react`
2. Receives `GameView` as props, distributes to child React components
3. All zone composition via `TableLayoutReact` slot props
4. Resize via `resizeTo` prop
5. Tests for component + valid React element
6. Story renders in Storybook
7. Old `game-renderer.ts` unchanged
8. All 4 checks pass

## Iteration 43 Preview (GameController → React hook)

**Scope**: Convert GameController to a React hook for state management. Wraps session subscription in `useState`/`useEffect`. Encapsulates event handling, active turn tracking, phase gating.
