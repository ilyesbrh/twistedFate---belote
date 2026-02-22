# Iteration 35 Report: Retroactive React Stories

**Date**: 2026-02-22
**Status**: Complete

## Goal

Add Storybook stories for the 4 React components created in iterations 30-33, satisfying UI_MANIFESTO PO Rule 1: "No component without a Storybook story. Period."

## Scope

1. Create `trump-indicator-react.stories.tsx` — story for all 4 suits
2. Create `turn-indicator-react.stories.tsx` — story for all 4 seats
3. Create `score-panel-react.stories.tsx` — story with sample score states
4. Create `player-info-react.stories.tsx` — story with active/inactive states and all players

## PO Decisions Locked

- **No new unit tests**: Stories are Tier 2 visual verification per UI_MANIFESTO. Component logic already fully covered by 31 existing tests across iterations 30-33 (7+7+9+8). PLAYBOOK Phase 2 applies to pure logic — stories contain none.
- **`<Application>` wrapper pattern**: React component stories use `<Application>` from `@pixi/react` (native rendering), not `<StoryCanvas>` (imperative bridge). This validates the actual React rendering path.
- **Story namespace**: React stories use `React/` prefix (e.g., `React/HUD/TrumpIndicator`) to distinguish from imperative stories (`Components/HUD/TrumpIndicator`). Both will coexist until iteration 43 cleanup.
- **`initPixiReact()` at module level**: Called once per story file at import time. Idempotent per design.
- **No barrel export changes**: Stories are consumed by Storybook, not application code.

## Tests Written (0 test cases)

None. Stories are Tier 2 visual verification (UI_MANIFESTO Testing Strategy). All component logic already tested:

| Component | Tests | Source |
| --- | --- | --- |
| TrumpIndicatorReact | 7 | Iteration 30 |
| TurnIndicatorReact | 7 | Iteration 31 |
| ScorePanelReact | 9 | Iteration 32 |
| PlayerInfoReact | 8 | Iteration 33 |

## Implementation Summary

### Files Created

- `packages/ui/src/components/hud/trump-indicator-react.stories.tsx` — 3 variants (AllSuits, Hearts, Spades)
- `packages/ui/src/components/hud/turn-indicator-react.stories.tsx` — 2 variants (YourTurn, AllDirections)
- `packages/ui/src/components/hud/score-panel-react.stories.tsx` — 3 variants (ZeroZero, MidGame, CloseGame)
- `packages/ui/src/components/player-info/player-info-react.stories.tsx` — 3 variants (ActiveSouth, InactiveNorth, AllPlayers)

### Files Modified

None.

### Key Pattern

```tsx
import { Application } from "@pixi/react";
import { initPixiReact } from "../../pixi-react-setup.js";
import { ComponentReact } from "./component-react.js";

initPixiReact();

export const Story: StoryFn = () => (
  <Application width={W} height={H} background={THEME.colors.table.bgDark} antialias>
    <pixiContainer x={X} y={Y}>
      <ComponentReact {...props} />
    </pixiContainer>
  </Application>
);
```

### Stories Created (4 files, 11 variants)

| Story File | Title | Variants |
| --- | --- | --- |
| `hud/trump-indicator-react.stories.tsx` | React/HUD/TrumpIndicator | AllSuits, Hearts, Spades |
| `hud/turn-indicator-react.stories.tsx` | React/HUD/TurnIndicator | YourTurn, AllDirections |
| `hud/score-panel-react.stories.tsx` | React/HUD/ScorePanel | ZeroZero, MidGame, CloseGame |
| `player-info/player-info-react.stories.tsx` | React/PlayerInfo | ActiveSouth, InactiveNorth, AllPlayers |

## Technical Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| `<Application>` over `<StoryCanvas>` | Native @pixi/react rendering | React components use pixi* JSX — wrapping in StoryCanvas would require imperative mounting, defeating the purpose |
| `React/` story namespace | Separate from `Components/` | Allows side-by-side visual comparison of imperative vs React versions during migration |
| No unit tests | Stories = Tier 2 visual verification | Component logic (drawTrumpBadge, trumpTextConfig, etc.) already tested via iterations 30-33 |
| `pixiContainer` for positioning | Offset via x/y props | Components render at origin — wrapping container provides canvas-relative positioning |

## Refactoring Performed

None.

## Risks Identified

- **Visual rendering not verified**: Stories were built to TypeScript/lint compliance but not visually verified in `pnpm storybook`. The `<Application>` component requires a browser canvas context. Run `pnpm storybook` to confirm all 11 variants render correctly.
- **Coexistence clutter**: 17 imperative stories + 11 React stories = 28 total stories in Storybook sidebar. The `React/` namespace prefix keeps them organized. Imperative stories will be removed in iteration 43.

## Validation Results

- `pnpm test`: **859/859 passing** (0 new)
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: 36 (BiddingPanel → React)

**Scope**: Rewrite BiddingPanel as a React functional component with 5 buttons (4 suits + pass). Uses `computeBiddingLayout` (unchanged). Consider `FancyButton` from `@pixi/ui` for interactive buttons. Callback props: `onSuitBid(suit)`, `onPass()`. Includes Storybook story.

**Acceptance criteria**:

1. `bidding-panel-react.tsx` renders 5 buttons, callbacks fire correctly
2. `bidding-panel-react.stories.tsx` renders in Storybook
3. Tests for component logic + valid React element
4. Old `bidding-panel.ts` unchanged
5. All 4 checks pass

## Iteration 37 Preview (HandDisplay → React)

**Scope**: Rewrite HandDisplay as a React component with card fan and tap interaction. Uses `computeHandLayout` (unchanged). CardSprite mounted via ref (imperative class stays). Playable/non-playable alpha via props. `onCardTap(index, card)` callback. Includes Storybook story.
