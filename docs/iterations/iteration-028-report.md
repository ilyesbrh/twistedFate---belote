# Iteration 28 Report: Install @pixi/layout v3 + @pixi/ui v2

**Date**: 2026-02-22
**Status**: Complete

## Goal

Install @pixi/layout and @pixi/ui as dependencies, verify they resolve and construct correctly, and register their key elements with `extend()`.

## Scope

1. Add `@pixi/layout` and `@pixi/ui` as production dependencies
2. Verify `LayoutContainer` (from @pixi/layout) is importable and constructible
3. Verify `FancyButton` and `ButtonContainer` (from @pixi/ui) are importable and constructible
4. Verify the layout mixin augments `Container` with a `layout` property
5. Register `LayoutContainer`, `FancyButton`, `ButtonContainer` with `extend()` in `initPixiReact()`

## PO Decisions Locked

- `@pixi/layout` v3.2.0 uses Yoga WASM for flexbox — Vite handles bundling without config
- `@pixi/layout` works via mixin (augments `Container.layout` property) AND provides `LayoutContainer` (div-like wrapper with background, border, overflow)
- `@pixi/ui` v2.3.2 provides `FancyButton` (stateful views for default/hover/pressed/disabled) — will replace hand-rolled bidding buttons

## Tests Written (5 test cases, written before implementation)

### `__tests__/pixi-layout-ui-integration.test.ts`

- `LayoutContainer is importable and constructible` — verifies import from @pixi/layout/components and `new LayoutContainer()`
- `Layout mixin augments Container with layout property` — verifies importing @pixi/layout adds `layout` to Container
- `FancyButton is importable and constructible` — verifies import and construction
- `ButtonContainer is importable and constructible` — verifies import and construction
- `initPixiReact registers LayoutContainer and FancyButton without throwing` — verifies updated extend() call

## Implementation Summary

### Files Created

- `packages/ui/__tests__/pixi-layout-ui-integration.test.ts` — 5 integration tests

### Files Modified

- `packages/ui/package.json` — added @pixi/layout ^3.2.0, @pixi/ui ^2.3.2
- `packages/ui/src/pixi-react-setup.ts` — extended `initPixiReact()` to register LayoutContainer, FancyButton, ButtonContainer

### Key Types

- `LayoutContainer` — div-like container with flexbox, background, border, overflow
- `FancyButton` — multi-state button with default/hover/pressed/disabled views
- `ButtonContainer` — basic interactive button container

## Technical Decisions

| Decision                        | Choice                                                        | Rationale                                                                                                     |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Ticker polyfill in tests        | `vi.stubGlobal("requestAnimationFrame/cancelAnimationFrame")` | LayoutContainer constructor starts a Ticker which needs rAF/cAF — unavailable in Node test environment        |
| Import path for LayoutContainer | `@pixi/layout/components` (subpath export)                    | Main `@pixi/layout` import is for the mixin; `LayoutContainer` lives in the components subpath                |
| Registered elements             | LayoutContainer + FancyButton + ButtonContainer               | These are the elements we'll use as JSX components (`<layoutContainer>`, `<fancyButton>`) in React migrations |

## Refactoring Performed

None.

## Risks Identified

- Yoga WASM loading: works fine with Vite dev/build, but Storybook bundling should be verified when we migrate stories
- `LayoutContainer` requires Ticker → tests need rAF/cAF polyfill (documented pattern for future test files)

## Validation Results

- `pnpm test`: **819/819 passing** (5 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 29 (React Bridge + useTheme Hook)

**Scope**: Create the coexistence bridge (`renderReactIntoContainer`) and a `useTheme()` hook. First `.tsx` files in the project. Proof-of-concept React component rendering into a PixiJS Container.

**Acceptance criteria**:

1. `useTheme()` hook returns the frozen THEME object
2. `renderReactIntoContainer(container, jsx)` mounts a React tree into an existing Container
3. Proof-of-concept `<TestRect>` component renders via the bridge
4. All 4 checks pass

## Iteration 30 Preview (TrumpIndicator → React)

Rewrite TrumpIndicator as a React functional component. First real component migration establishing the pattern for all subsequent components.
