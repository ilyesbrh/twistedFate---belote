# Iteration 13 Report: OpponentHand — Face-Down Card Stacks

**Date**: 2026-02-21
**Status**: Complete

## Goal

Display opponent hands as face-down card stacks. North opponent uses horizontal layout (top zone), west/east opponents use vertical layout (side zones).

## Scope

1. `opponent-layout.ts` — Pure layout math for horizontal/vertical card stacks
2. `opponent-hand.ts` — PixiJS Container rendering face-down CardSprites
3. Storybook stories for both orientations
4. Orientation type system (`"horizontal" | "vertical"`)

## Tests Written (25 → 32 test cases after review fixes)

### opponent-layout.test.ts (32 tests)

- Horizontal layout: cards spread along x-axis with overlap
- Vertical layout: cards spread along y-axis with overlap
- Card dimensions constrained by zone
- Edge cases: 0 cards, 1 card, 8 cards
- Centering within zone
- Target card height parameter (added in card-size normalization fix)

## Implementation Summary

### Files Created

- `packages/ui/src/components/opponent-hand/opponent-layout.ts` — Pure layout computation
- `packages/ui/src/components/opponent-hand/opponent-hand.ts` — PixiJS Container
- `packages/ui/src/components/opponent-hand/opponent-hand.stories.ts` — Storybook stories
- `packages/ui/__tests__/opponent-layout.test.ts` — 32 TDD test cases

### Key Types

```typescript
type OpponentOrientation = "horizontal" | "vertical";

function computeOpponentLayout(
  zone: Rect,
  cardCount: number,
  orientation: OpponentOrientation,
  targetCardHeight?: number,
): OpponentLayoutResult;
```

## Review Fixes Applied

- Card size normalization (commit `814f9d7`): Added optional `targetCardHeight` parameter to `computeOpponentLayout` to ensure all opponent cards appear the same size regardless of orientation. Root cause: horizontal opponents used zone.height (70px) and vertical used zone.width (127px) as constraints, producing visually different card sizes (43x60 vs 108x77).

## Validation Results

- Part of commit `d8a8696` (iterations 12-20 combined)
- Card size fix in commit `814f9d7` (+7 tests)
- 32 opponent-layout tests passing
