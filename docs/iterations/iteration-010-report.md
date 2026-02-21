# Iteration 10 Report: UI Infrastructure & Theme System

**Date**: 2026-02-21
**Status**: Complete

## Goal

Set up the UI rendering foundation, centralized theme system, layout manager, and visual development tooling. Zero game logic — just the ability to render things on screen, compute responsive layouts, and develop visually in isolation.

This iteration also established a **PO roadmap** decomposing the original iteration 9 N+1/N+2 previews into 10 focused iterations (10–19). The full UI/UX decisions, technology stack, and design tokens are documented in the **[UI Manifesto](../UI_MANIFESTO.md)**.

## Scope

1. `@belote/ui` package setup: pixi.js dependency, Vite dev server, Vitest config, DOM lib
2. Theme module: centralized design tokens (colors, spacing, typography, card dimensions, animation timing)
3. Layout manager: viewport detection, safe area calculation, responsive breakpoints, 5-zone computation
4. PixiJS Application bootstrap (`createApp` async function)
5. Dev harness (lightweight Storybook replacement): scene registry + table background scene
6. Barrel exports for public API

## PO Decisions Locked

- **Dev harness over Storybook**: `@pixi/storybook-vite` is v1.0.0 and not installed. A lightweight scene-selector page is simpler, more stable, and standard in game dev.
- **Portrait-first layout**: 4-player zones — top (30%), middle with left/right/center (30%), bottom (40%)
- **Theme as frozen constant**: deeply frozen `THEME` object, no hardcoded values in components
- **DOM lib for UI package only**: `tsconfig.json` and `tsconfig.build.json` add `"DOM"` to lib, other packages remain pure ES2022

## Tests Written (96 test cases, written before implementation)

### theme.test.ts (47 tests)

- Immutability (6 tests): THEME frozen, colors deeply frozen, typography deeply frozen, spacing frozen, cardDimensions deeply frozen, animationTiming deeply frozen
- Structure (1 test): exactly 5 top-level keys
- colors.table (3 tests): bgDark, bgLight, surface exact hex values
- colors.card (2 tests): face, back exact hex values
- colors.suit (2 tests): red, black exact hex values
- colors.accent (2 tests): gold, danger exact hex values
- colors.ui (2 tests): overlay, overlayLight exact rgba values
- colors.text (3 tests): light, dark, muted exact hex values
- typography (6 tests): fontFamily non-empty, cardIndex/score/playerName/label/heading weights and sizes
- spacing (5 tests): xs=4, sm=8, md=16, lg=24, xl=32
- cardDimensions (6 tests): aspectRatio, handHeight/trickHeight/opponentHeight percentages, minTapWidth, fanOverlap
- animationTiming (9 tests): cardDeal/cardPlay/trickCollect/cardSelect ranges, cardReject/panelSlide/scoreUpdate fixed, roundTransition/aiDelay ranges

### layout.test.ts (49 tests)

- getOrientation (3 tests): portrait, landscape, square defaults to portrait
- getBreakpoint (5 tests): 5 breakpoints with boundary values
- computeSafeArea (3 tests): zero insets, notch/home insets, all insets
- computeLayout at 375x667 (7 tests): viewport, orientation, breakpoint, top/bottom/center zones, all 5 zones present
- computeLayout at 390x844 (6 tests): orientation, breakpoint, top/bottom width, left/right sides, center between
- computeLayout at 768x1024 (2 tests): portrait, tablet-portrait breakpoint
- computeLayout at 1024x768 (2 tests): landscape, tablet-landscape breakpoint
- computeLayout with safe area insets (3 tests): safe area excludes insets, top starts at safe top, bottom ends at safe bottom
- Zone invariants across 4 viewports (16 tests): top/bottom non-overlap, left/right non-overlap, center within bounds, all values finite non-negative
- Immutability (2 tests): layout frozen, all zones frozen

## Implementation Summary

### Files Created

- `packages/ui/src/theme.ts` — Design tokens module (colors, typography, spacing, card dimensions, animation timing)
- `packages/ui/src/layout.ts` — Layout manager (4 pure functions: `getOrientation`, `getBreakpoint`, `computeSafeArea`, `computeLayout`)
- `packages/ui/src/bootstrap.ts` — `createApp()` async function wrapping PixiJS Application init
- `packages/ui/src/main.ts` — Dev entry point (not exported)
- `packages/ui/src/harness/scenes.ts` — Scene interface + registry
- `packages/ui/src/harness/table-background.scene.ts` — First scene: radial green felt gradient
- `packages/ui/src/harness/index.ts` — Harness controller (DOM scene selector + auto-load)
- `packages/ui/vite.config.ts` — Vite dev server config (port 5173)
- `packages/ui/vitest.config.ts` — Vitest config for UI package
- `packages/ui/index.html` — HTML entry point with viewport meta
- `packages/ui/__tests__/theme.test.ts` — 47 TDD test cases
- `packages/ui/__tests__/layout.test.ts` — 49 TDD test cases

### Files Modified

- `packages/ui/package.json` — Added pixi.js dep, vite devDep, dev/test scripts
- `packages/ui/tsconfig.json` — Added DOM lib, test includes
- `packages/ui/tsconfig.build.json` — Added DOM lib, excluded main.ts and harness from build
- `packages/ui/src/index.ts` — Barrel exports (THEME, layout functions, createApp, all types)
- `eslint.config.mjs` — Added `packages/*/vite.config.ts` to disableTypeChecked + allowDefaultProject
- `package.json` (root) — Added `"dev"` script

### Stale Artifacts Deleted

- `packages/ui/dist/*` — Removed stale build output from a previous attempt

### Key Types

```typescript
// Theme
interface Theme {
  readonly colors: ThemeColors;
  readonly typography: Typography;
  readonly spacing: Spacing;
  readonly cardDimensions: CardDimensions;
  readonly animationTiming: AnimationTiming;
}

// Layout
type Orientation = "portrait" | "landscape";
type Breakpoint =
  | "small-phone"
  | "standard-phone"
  | "large-phone"
  | "tablet-portrait"
  | "tablet-landscape";
interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
interface Layout {
  readonly viewport: Viewport;
  readonly safeArea: Rect;
  readonly orientation: Orientation;
  readonly breakpoint: Breakpoint;
  readonly zones: LayoutZones; // top, bottom, left, right, center
}
```

### Key Functions

- `computeLayout(viewport, insets?)` — Returns frozen Layout with 5 zones from viewport dimensions
- `getOrientation(width, height)` — Portrait when height >= width
- `getBreakpoint(width)` — 5 responsive breakpoints
- `computeSafeArea(width, height, insets)` — Adjusts for notch/home indicator
- `createApp(config?)` — Creates configured PixiJS Application

## Technical Decisions

| Decision                    | Choice                                                          | Rationale                                                                                   |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Dev harness over Storybook  | Scene-selector DOM overlay                                      | `@pixi/storybook-vite` v1.0.0 too immature; custom harness is simpler and grows organically |
| DOM lib scoped to UI only   | `lib: ["ES2022", "DOM"]` in UI tsconfigs                        | Core and app remain pure — no DOM contamination                                             |
| `deepFreeze` utility        | Local to theme.ts and layout.ts                                 | Avoids shared utility across packages for now; can extract if needed later                  |
| Harness excluded from build | `tsconfig.build.json` excludes `src/main.ts` and `src/harness/` | Dev-only files, not part of the package's public API                                        |
| Zone proportions            | top=30%, middle=30%, bottom=40%, sides=15%                      | Matches UI Manifesto interaction zones (bottom 40% for thumb reach)                         |
| `createApp` as function     | Not a class                                                     | Keeps it functional; PixiJS Application is already a class, no need to wrap                 |

## Refactoring Performed

- Deleted stale `packages/ui/dist/` from a previous implementation attempt
- Updated ESLint config to handle vite.config.ts files (disableTypeChecked + allowDefaultProject)
- Added root `pnpm dev` script delegating to `@belote/ui`

## Risks Identified

- None blocking

## Validation Results

- `pnpm test`: **544/544 passing** (448 prior + 47 theme + 49 layout)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean
- `pnpm dev`: Visual verification — green felt gradient fills viewport, resize works

## Next Iteration: N+1 (Iteration 11)

**Card Sprite & Asset Pipeline (TDD)**

- Card asset acquisition (SVG card set, 32 Belote cards + card back)
- Sprite sheet build script (SVG → PNG/WebP atlas + JSON manifest)
- Asset loader module (loads sprite sheet, provides texture lookup by suit+rank)
- `CardSprite` display object (PixiJS Container with face/back sprites, flip state)
- Dev harness scene: card gallery showing all 32 faces + back

## Iteration N+2 Preview (Iteration 12)

**Card Interaction States (TDD)**

- Card visual states: idle, hover, selected (elevated), disabled (dimmed)
- State transition logic (pure functions)
- Touch/pointer event handling on CardSprite
- Selection callback system

---

## UI Roadmap Reference (Iterations 11–19)

The full iteration roadmap for the UI layer is maintained below. See **[UI Manifesto](../UI_MANIFESTO.md)** for all design decisions.

### Iteration 11: Card Sprite & Asset Pipeline

**Goal**: Render individual cards on screen. Establish the asset pipeline from SVG sources to PixiJS textures via sprite sheet.

**Scope**:

1. Card asset acquisition (SVG card set, 32 Belote cards + card back)
2. Sprite sheet build script (SVG → PNG/WebP atlas + JSON manifest)
3. Asset loader module (loads sprite sheet, provides texture lookup by suit+rank)
4. `CardSprite` display object (PixiJS Container with face/back sprites, flip state)
5. Dev harness scene: card gallery showing all 32 faces + back

**Acceptance Criteria**:

- [ ] Build script generates a single sprite sheet from 32 card SVGs + 1 back
- [ ] `AssetLoader.getCardTexture(suit, rank)` returns the correct texture
- [ ] `CardSprite` renders face-up or face-down based on state
- [ ] `CardSprite` has a deterministic test ID (`data-card-id` equivalent via PixiJS label)
- [ ] Dev harness scene shows all 32 cards in a grid
- [ ] Asset loader tested (texture lookup, missing card error)

---

### Iteration 12: Card Interaction States

**Goal**: Make cards interactive — hover, select, disabled, and tap handling. No game logic, purely visual and input.

**Scope**:

1. Card visual states: `idle`, `hover`, `selected` (elevated), `disabled` (dimmed)
2. State transition logic (pure functions mapping input to visual state)
3. Touch/pointer event handling on CardSprite (tap, hover)
4. Selection callback system (card tapped → notify parent)
5. Dev harness scene: interactive card with all state transitions

---

### Iteration 13: Hand Layout (Card Fan)

**Goal**: Display a player's hand as a fan of overlapping cards at the bottom of the screen.

---

### Iteration 14: Table Layout (4-Player Zones)

**Goal**: Position all 4 players around the table with their card areas, avatars, and name labels.

---

### Iteration 15: Trick Area & Card Play Display

**Goal**: Show played cards in the center trick area.

---

### Iteration 16: Score Panel & Trump Indicator

**Goal**: Display game state information — team scores, trump suit, round number, turn indicator.

---

### Iteration 17: Bidding UI

**Goal**: Implement the bidding interface — a bottom sheet with suit buttons, value selection, and pass button.

---

### Iteration 18: App Layer Integration (Event-Driven Rendering)

**Goal**: Connect all UI components to the `GameSession` event system.

---

### Iteration 19: Animation Engine Foundation

**Goal**: Implement `@belote/animation` with pure, testable animation sequence descriptions. Bind to GSAP + PixiJS.

---

### Iterations 20+ (Preview)

| Iteration | Topic                       |
| --------- | --------------------------- |
| 20        | Polish & Transitions        |
| 21        | AI Timing & Personality     |
| 22        | Responsive Refinement       |
| 23        | Accessibility               |
| 24        | E2E Testing with Playwright |
| 25        | Performance Optimization    |
