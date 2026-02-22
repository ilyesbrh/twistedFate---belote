# Iteration 33 Report: PlayerInfo → React

**Date**: 2026-02-22
**Status**: Complete

## Goal

Rewrite PlayerInfo as a React functional component with avatar, initial letter, player name, and card count.

## Scope

1. Create `src/components/player-info/player-info-react.tsx` as a React functional component
2. Extract testable helpers: `drawPlayerAvatar`, `playerInitial`
3. Write 8 tests (TDD: RED → GREEN)
4. Update barrel exports
5. Old `player-info.ts` unchanged (file-level coexistence)

## PO Decisions Locked

- **No GlowFilter/DropShadowFilter**: `isActive` prop is accepted but filters deferred to React root integration (same pattern as iterations 30-32). The `_isActive` prefix signals intentional deferral.
- **teamColor as explicit prop**: Unlike the imperative version which receives `teamColor` in options, the React version also takes it as a prop. The `teamForSeat` helper (already tested in player-info.ts) remains available for callers to compute the color.

## Tests Written (8 test cases, written before implementation)

### `__tests__/player-info-react.test.tsx`

- `exports the component function` — verifies module exports
- `exports drawPlayerAvatar function` — verifies draw callback export
- `exports playerInitial function` — verifies initial extraction export
- `returns a valid React element for each seat` — validates JSX for all 4 seats
- `drawPlayerAvatar applies correct THEME avatar geometry` — mock Graphics, verifies roundRect + fill + stroke with THEME.avatar tokens
- `playerInitial returns uppercased first character` — verifies "alice"→"A", "Bob"→"B"
- `playerInitial returns empty string for empty name` — edge case
- `returns valid element for both active and inactive states` — validates both states produce valid elements

## Implementation Summary

### Files Created

- `packages/ui/src/components/player-info/player-info-react.tsx` — React functional component + 2 helpers
- `packages/ui/__tests__/player-info-react.test.tsx` — 8 tests

### Files Modified

- `packages/ui/src/index.ts` — added `PlayerInfoReact`, `drawPlayerAvatar`, `playerInitial` exports + `PlayerInfoReactProps` type

### Key Functions

- `PlayerInfoReact({ name, seat, isActive, cardCount, teamColor }): React.JSX.Element` — renders avatar + initial + name + card count
- `drawPlayerAvatar(g: Graphics, teamColor: number): void` — draws rounded-rect avatar with team color
- `playerInitial(name: string): string` — extracts uppercased first character

## Technical Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| isActive deferred | `_isActive` prefix, no filter logic | GlowFilter requires WebGL context; will be activated in iteration 38 |
| playerInitial extracted | Pure function | Testable edge case (empty string); avoids inline logic in JSX |
| teamColor as prop | Explicit rather than computed | Keeps component pure; caller decides how to determine team color |

## Refactoring Performed

None.

## Risks Identified

- GlowFilter (active state visual) missing in React version. Mitigated: will be added in iteration 38.

## Validation Results

- `pnpm test`: **856/856 passing** (8 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 34 (BiddingPanel → React)

**Scope**: Rewrite BiddingPanel as a React functional component. Uses `computeBiddingLayout` (unchanged). Consider `FancyButton` from `@pixi/ui` for suit/pass buttons. Callback props: `onSuitBid(suit)`, `onPass()`.

**Acceptance criteria**:

1. `src/components/bidding/bidding-panel-react.tsx` renders 5 buttons (4 suits + pass)
2. Props interface with callback props for suit bid and pass
3. Tests: renders 5 buttons, callbacks fire correctly
4. Old `bidding-panel.ts` unchanged (coexistence)
5. All 4 checks pass
