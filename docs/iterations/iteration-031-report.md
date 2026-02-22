# Iteration 31 Report: TurnIndicator → React

**Date**: 2026-02-22
**Status**: Complete

## Goal

Rewrite TurnIndicator as a React functional component. Second component migration, establishing the pattern for components with dynamic drawing logic.

## Scope

1. Create `src/components/hud/turn-indicator-react.tsx` as a React functional component
2. Extract testable helpers: `arrowForSeat`, `drawTurnPill`, `turnTextConfigs`
3. Write 7 tests (TDD: RED → GREEN)
4. Update barrel exports
5. Old `turn-indicator.ts` unchanged (file-level coexistence)

## PO Decisions Locked

- **Fixed pill width for now**: The imperative version measures `nameText.width` dynamically. The React version uses a fixed minimum width (60 + padding). Dynamic sizing via `useRef` + measurement deferred to iteration 38 when `<Application>` root provides a proper rendering context for text measurement.
- **No hooks**: All logic extracted as pure functions. Component is a pure render function.

## Tests Written (7 test cases, written before implementation)

### `__tests__/turn-indicator-react.test.tsx`

- `exports the component function` — verifies module exports
- `exports arrowForSeat function` — verifies arrow helper export
- `exports drawTurnPill function` — verifies pill draw export
- `returns a valid React element for each seat` — validates JSX for all 4 seats
- `arrowForSeat returns correct arrow for each seat` — ↓↑←→ mapping
- `drawTurnPill calls correct Graphics methods with dimensions` — mock Graphics, verifies clear/roundRect/fill/stroke
- `turnTextConfigs returns correct arrow and name styles from THEME` — verifies font sizes, fill colors, text content

## Implementation Summary

### Files Created

- `packages/ui/src/components/hud/turn-indicator-react.tsx` — React functional component + extracted helpers
- `packages/ui/__tests__/turn-indicator-react.test.tsx` — 7 tests

### Files Modified

- `packages/ui/src/index.ts` — added `TurnIndicatorReact`, `arrowForSeat`, `drawTurnPill`, `turnTextConfigs` exports + `TurnIndicatorProps` type

### Key Functions

- `TurnIndicatorReact({ seat, playerName }: TurnIndicatorProps): React.JSX.Element` — renders arrow + name with pill background
- `arrowForSeat(seat: Seat): string` — maps seat to directional arrow character (↓↑←→)
- `drawTurnPill(g: Graphics, pillWidth: number, totalHeight: number): void` — draws pill-shaped background with semi-transparent fill and gold border
- `turnTextConfigs(seat, playerName): { arrow, name }` — computes text content, font size, and fill color from THEME

## Technical Decisions

| Decision                   | Choice                                    | Rationale                                                                            |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Fixed pill width           | MIN_TEXT_WIDTH (60) + padding             | Text measurement requires rendering context; dynamic sizing deferred to iteration 38 |
| Parameterized drawTurnPill | Takes `pillWidth` + `totalHeight` as args | Makes the draw function testable with any dimensions; parent can control sizing      |
| No hooks                   | Pure functions only                       | All logic is deterministic from props and THEME; no state, refs, or effects needed   |

## Refactoring Performed

None.

## Risks Identified

- Pill width is fixed at minimum — may not perfectly wrap longer player names. Mitigated: will be enhanced with `useRef` + text measurement in iteration 38.

## Validation Results

- `pnpm test`: **839/839 passing** (7 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 32 (ScorePanel → React)

**Scope**: Rewrite ScorePanel as a React functional component with team scores and labels. Two-column layout with THEME typography tokens.

**Acceptance criteria**:

1. `src/components/hud/score-panel-react.tsx` renders both team scores with labels
2. Props interface: `{ team1Score: number; team2Score: number; team1Label?: string; team2Label?: string }`
3. Tests: renders, correct text for each team, updates on prop change
4. Old `score-panel.ts` unchanged (coexistence)
5. All 4 checks pass

## Iteration 33 Preview (PlayerInfo → React)

Rewrite PlayerInfo as a React functional component with name, seat label, active/inactive state, and card count badge.
