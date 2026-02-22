# Iteration 27 Report: React + @pixi/react Foundation Setup

**Date**: 2026-02-22
**Status**: Complete

## Goal

Install React 19 and @pixi/react v8, configure TypeScript for JSX, and establish the `extend()` setup module — the foundation for the React/PixiJS migration.

## Scope

1. Add `react`, `react-dom`, `@pixi/react` as production dependencies
2. Add `@types/react`, `@types/react-dom` as dev dependencies
3. Configure `tsconfig.base.json` with `jsx: "react-jsx"`
4. Add `*.tsx` to `tsconfig.json` and `tsconfig.build.json` include patterns
5. Create `pixi-react-setup.ts` with `extend()` registering Container, Graphics, Text, Sprite
6. Update ESLint config to handle `.tsx` files in story/test patterns
7. Update `UI_MANIFESTO.md` technology table — React now adopted, not rejected
8. Update barrel exports in `index.ts`
9. Configure Vitest to inline `@pixi/react` (ESM resolution fix)

## PO Decisions Locked

- React is now an accepted technology for the UI layer (reversing previous manifesto rejection)
- `@pixi/react` v8 with its JSX pragma (`pixiContainer`, `pixiSprite`, etc.) eliminates the DOM impedance mismatch that justified the original rejection
- Migration will proceed component-by-component with coexistence during transition

## Tests Written (3 test cases, written before implementation)

### `__tests__/pixi-react-setup.test.ts`

- `exports initPixiReact function` — verifies module exports the function
- `initPixiReact does not throw` — verifies extend() completes without error
- `is idempotent — calling twice does not throw` — verifies safe repeated calls

## Implementation Summary

### Files Created

- `packages/ui/src/pixi-react-setup.ts` — `initPixiReact()` function that calls `extend({ Container, Graphics, Text, Sprite })` from `@pixi/react`
- `packages/ui/__tests__/pixi-react-setup.test.ts` — 3 unit tests

### Files Modified

- `packages/ui/package.json` — added react 19.2.4, react-dom 19.2.4, @pixi/react 8.0.5, @types/react 19.2.14, @types/react-dom 19.2.3
- `tsconfig.base.json` — added `jsx: "react-jsx"`
- `packages/ui/tsconfig.json` — added `src/**/*.tsx` and `__tests__/**/*.tsx` to include
- `packages/ui/tsconfig.build.json` — added `src/**/*.tsx` to include, `src/**/*.stories.tsx` to exclude
- `packages/ui/vitest.config.ts` — added `__tests__/**/*.test.tsx` to include, `@pixi/react` to server.deps.inline
- `eslint.config.mjs` — added `.tsx` patterns to story and test file overrides
- `packages/ui/src/index.ts` — added `initPixiReact` export
- `docs/UI_MANIFESTO.md` — updated technology table, moved React from rejected to adopted

### Key Functions

- `initPixiReact(): void` — registers PixiJS display objects with @pixi/react's internal catalogue; must be called before any React PixiJS rendering; idempotent

## Technical Decisions

| Decision                  | Choice                                     | Rationale                                                                                                                        |
| ------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| JSX config location       | `tsconfig.base.json`                       | All packages benefit; even non-UI packages won't break with JSX enabled                                                          |
| Vitest inline dep         | `@pixi/react` via `server.deps.inline`     | `react-reconciler` uses CJS-style imports without `.js` extensions, causing ESM resolution failures in Vitest's node environment |
| Manifesto update approach | "Previously Rejected, Now Adopted" section | Preserves decision history and documents the rationale for reversal                                                              |
| extend() wrapper          | Named export `initPixiReact()`             | Encapsulates the extend() call, makes the intent clear, allows future additions (layout, UI elements)                            |

## Refactoring Performed

None — this is a greenfield addition.

## Risks Identified

- `@pixi/react` v8 requires React 19 — locks the project to React 19+
- `react-reconciler` ESM compatibility required Vitest workaround — may need similar workaround in other tooling (Playwright, Storybook)

## Validation Results

- `pnpm test`: **814/814 passing** (3 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 28 (Install @pixi/layout v3 + @pixi/ui v2)

**Scope**: Add `@pixi/layout` and `@pixi/ui` as dependencies, verify imports resolve, register layout elements with `extend()`, verify Yoga WASM bundling works with Vite.

**Acceptance criteria**:

1. `@pixi/layout` and `@pixi/ui` installed in `@belote/ui`
2. Import resolution test passes (LayoutContainer, FancyButton constructible)
3. `extend()` updated with layout elements
4. All 4 checks pass

## Iteration 29 Preview (React Bridge + useTheme Hook)

Create the coexistence bridge (`renderReactIntoContainer`) and a `useTheme` hook. First `.tsx` files in the project. Proof-of-concept React component rendering into a PixiJS Container.
