# Iteration 42 Report: GameRoot React Component

**Date**: 2026-02-23
**Status**: Complete

## Goal

Create a `GameRoot` React component that composes all child React components into the `TableLayoutReact` flexbox zones, receiving `GameView` as props. This is the React equivalent of the imperative `GameRenderer`.

## Scope

1. `game-root.tsx` — React component composing all child components into TableLayoutReact zones
2. Receives `GameView` + viewport dimensions + callback props
3. Zone composition:
   - **Top**: OpponentHandReact (north) + PlayerInfoReact (north) + ScorePanelReact
   - **Left**: OpponentHandReact (west) + PlayerInfoReact (west)
   - **Center**: TrickDisplayReact + TrumpIndicatorReact + TurnIndicatorReact
   - **Right**: OpponentHandReact (east) + PlayerInfoReact (east)
   - **Bottom**: HandDisplayReact + PlayerInfoReact (south) + BiddingPanelReact (bidding phase)
4. Extracted testable helpers: `teamColor`, `playerInfoPosition`
5. Tests for component + helpers (10 tests)
6. Storybook story with 4 variants (Idle, Playing, Bidding, Portrait)
7. Barrel exports in `index.ts`
8. Old `game-renderer.ts` unchanged

## PO Decisions Locked

- **GameRoot is a pure component tree, not an `<Application>` wrapper**: Keeps the component testable and composable. A future bootstrap entry point mounts GameRoot into `<Application>`.
- **`computeLayout` for zone rects**: Child components need pixel `Rect` props. `computeLayout` from `layout.ts` computes the pixel rects matching the imperative GameRenderer's zone math.
- **BiddingPanelReact (zone-based) in bottom zone**: Uses `BiddingPanelReact` rather than `BiddingDialogReact` (viewport overlay). Phase-conditional rendering — only visible during `"bidding"` phase.
- **Callback props for input**: `onCardTap`, `onSuitBid`, `onPass` props passed through to child components. Decoupled from GameController.
- **No resize logic inside component**: Width/height are props — the parent is responsible for providing updated dimensions on resize.

## Tests Written (10 test cases, written before implementation)

### `__tests__/game-root.test.tsx` — 10 tests

- exports the GameRoot component function
- exports the teamColor helper function
- exports the playerInfoPosition helper function
- returns a valid React element with idle view
- returns a valid React element with playing view
- teamColor returns team1 color for south
- teamColor returns team2 color for west
- teamColor returns team1 color for north
- playerInfoPosition returns correct position for south seat
- playerInfoPosition returns correct position for west seat

## Implementation Summary

### Files Created (3)

- `packages/ui/src/game-root.tsx` — React GameRoot composing all child components
- `packages/ui/__tests__/game-root.test.tsx` — 10 tests
- `packages/ui/src/game-root.stories.tsx` — 4 story variants

### Files Modified (1)

- `packages/ui/src/index.ts` — barrel exports for GameRoot, teamColor, playerInfoPosition, GameRootProps

### Key Types

- `GameRootProps` — `{ width, height, view: GameView, onCardTap?, onSuitBid?, onPass? }`

### Key Functions

- `GameRoot(props)` — React functional component
- `teamColor(seat)` — returns team color number from THEME
- `playerInfoPosition(seat, zone)` — returns `{x, y}` for player info badge within a zone

## Technical Decisions

| Decision                         | Choice                           | Rationale                                                      |
| -------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| Pure component (no Application)  | GameRoot returns JSX tree only   | Keeps component testable, composable in Storybook              |
| computeLayout for zone rects     | Pixel rects from layout.ts       | Child components need Rect props, matches imperative approach  |
| BiddingPanelReact in bottom zone | Phase-conditional rendering      | Zone-based bidding in bottom zone, cleaner than Dialog overlay |
| Callback props for input         | onCardTap, onSuitBid, onPass     | Decoupled from GameController, React-idiomatic                 |
| Local zone rects (origin 0,0)    | Computed from zones.width/height | Zone containers are positioned by TableLayoutReact flex        |
| teamColor extracted              | Shared helper                    | Same logic as imperative GameRenderer.teamColor                |

## Errors Encountered and Fixed

1. **Unused variable `opponentCardHeight`**: TypeScript flagged `TS6133`. The imperative GameRenderer passed this to `OpponentHand.update()`, but `OpponentHandReact` computes card height internally via `computeOpponentLayout`. Removed the unused variable.
2. **Prettier formatting**: 2 files (game-root.tsx + iteration-041-report.md) — fixed with `prettier --write`.

## Refactoring Performed

None

## Risks Identified

- **Zone pixel rects vs flexbox positioning**: `computeLayout` and `zoneRatios` use the same ratios (18%, 28%, 15%), but `computeLayout` uses `Math.round()` which may produce slightly different pixel values than Yoga's flex engine. During visual integration, confirm child components align correctly within flex zones.
- **Player info positioning**: Positions are computed from zone pixel dimensions via `playerInfoPosition`, but the actual zone sizes come from Yoga flexbox. If Yoga produces different zone sizes than `computeLayout`, player info badges may be slightly misaligned.

## Validation Results

- `pnpm test`: **927/927 passing** (10 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 43 (GameController → React hook)

**Scope**: Convert GameController to a React hook for state management. Wraps session subscription in `useState`/`useEffect`. Encapsulates event handling, active turn tracking, phase gating. Input dispatch functions returned from the hook.

**Acceptance criteria**:

1. `use-game-controller.ts` wraps session subscription in `useState`/`useEffect`
2. Returns `GameView` + input dispatch functions
3. Encapsulates active turn tracking and event handling
4. Cleanup on unmount (unsubscribe from session)
5. Tests for initial view, updates on events, phase-gated dispatch, cleanup
6. Old `game-controller.ts` unchanged
7. All 4 checks pass
