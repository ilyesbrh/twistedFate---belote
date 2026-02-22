# Iteration 32 Report: ScorePanel → React

**Date**: 2026-02-22
**Status**: Complete

## Goal

Rewrite ScorePanel as a React functional component with team scores, color markers, labels, and a divider line.

## Scope

1. Create `src/components/hud/score-panel-react.tsx` as a React functional component
2. Extract testable helpers: `drawScorePanelBg`, `drawScoreDivider`, `drawTeamMarker`
3. Write 9 tests (TDD: RED → GREEN)
4. Update barrel exports
5. Old `score-panel.ts` unchanged (file-level coexistence)

## PO Decisions Locked

- **No DropShadowFilter**: Same as iteration 30 — deferred to React root integration.
- **Separate Graphics elements**: Each visual part (bg, divider, team1 marker, team2 marker) gets its own `<pixiGraphics>` with a dedicated draw callback, matching the imperative structure.

## Tests Written (9 test cases, written before implementation)

### `__tests__/score-panel-react.test.tsx`

- `exports the component function` — verifies module exports
- `exports drawScorePanelBg function` — verifies draw callback export
- `exports drawScoreDivider function` — verifies divider draw export
- `exports drawTeamMarker function` — verifies marker draw export
- `returns a valid React element` — validates JSX output
- `drawScorePanelBg applies correct panel geometry` — mock Graphics, verifies roundRect(0,0,120,60,10) + fill + stroke
- `drawScoreDivider draws horizontal line at correct position` — verifies moveTo/lineTo with padding and row height
- `drawTeamMarker draws circle with team color` — verifies team 1 dot at row 0
- `drawTeamMarker offsets y for second team row` — verifies team 2 dot at row 1

## Implementation Summary

### Files Created

- `packages/ui/src/components/hud/score-panel-react.tsx` — React functional component + 3 draw helpers
- `packages/ui/__tests__/score-panel-react.test.tsx` — 9 tests

### Files Modified

- `packages/ui/src/index.ts` — added `ScorePanelReact`, `drawScorePanelBg`, `drawScoreDivider`, `drawTeamMarker` exports + `ScorePanelReactProps` type

### Key Functions

- `ScorePanelReact({ team1Score, team2Score, team1Label, team2Label }): React.JSX.Element` — renders two-row score panel
- `drawScorePanelBg(g: Graphics): void` — rounded-rect background with gold border
- `drawScoreDivider(g: Graphics): void` — horizontal divider between team rows
- `drawTeamMarker(g: Graphics, rowIndex: number, color: number): void` — team color dot at the given row

## Technical Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Separate draw helpers | 3 functions (bg, divider, marker) | Each maps to a distinct `<pixiGraphics>` element; independently testable |
| drawTeamMarker parameterized | Takes `rowIndex` + `color` | Reusable for both team rows; tested independently for each row position |
| Score as string in component | `String(team1Score)` inline | Simple, no helper needed — Text elements receive string props |

## Refactoring Performed

None.

## Risks Identified

- DropShadowFilter missing (same as iteration 30).

## Validation Results

- `pnpm test`: **848/848 passing** (9 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 33 (PlayerInfo → React)

**Scope**: Rewrite PlayerInfo as a React functional component with name, seat label, active/inactive state, and card count badge.

**Acceptance criteria**:

1. `src/components/player-info/player-info-react.tsx` renders avatar + name + card count
2. Props interface: `{ name: string; seat: PlayerSeat; isActive: boolean; cardCount: number }`
3. Tests: renders, active/inactive state, correct team color
4. Old `player-info.ts` unchanged (coexistence)
5. All 4 checks pass
