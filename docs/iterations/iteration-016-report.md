# Iteration 16 Report: ScorePanel — Team Score HUD

**Date**: 2026-02-21
**Status**: Complete

## Goal

Display team scores in a persistent HUD panel positioned in the top zone.

## Scope

1. `score-panel.ts` — PixiJS Container showing team1/team2 scores with labels
2. Storybook stories for various score states
3. `SCORE_PANEL_WIDTH` constant for layout positioning

## Implementation Summary

### Files Created

- `packages/ui/src/components/hud/score-panel.ts` — PixiJS Container
- `packages/ui/src/components/hud/score-panel.stories.ts` — Storybook stories

### Key API

```typescript
const SCORE_PANEL_WIDTH = 100;

class ScorePanel extends Container {
  constructor(config: ScorePanelConfig);
  setScores(team1: number, team2: number): void;
}
```

## Technical Decisions

| Decision    | Choice                    | Rationale                                                         |
| ----------- | ------------------------- | ----------------------------------------------------------------- |
| Fixed width | `SCORE_PANEL_WIDTH = 100` | Consistent sizing; exported for external positioning calculations |
| Team labels | "Us" / "Them"             | Human-friendly default; configurable via constructor              |

## Validation Results

- Part of commit `d8a8696` (iterations 12-20 combined)
- Visual verification via Storybook
