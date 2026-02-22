# Iteration 17 Report: TrumpIndicator — Suit Badge

**Date**: 2026-02-21
**Status**: Complete

## Goal

Display the current trump suit as a visual badge in the center zone, visible throughout the playing phase.

## Scope

1. `trump-indicator.ts` — PixiJS Container showing trump suit symbol with colored background
2. Storybook stories for all 4 suits
3. Dynamic suit switching via `setSuit()` method

## Implementation Summary

### Files Created

- `packages/ui/src/components/hud/trump-indicator.ts` — PixiJS Container
- `packages/ui/src/components/hud/trump-indicator.stories.ts` — Storybook stories

### Key API

```typescript
class TrumpIndicator extends Container {
  constructor(suit: Suit);
  setSuit(suit: Suit): void;
}
```

## Validation Results

- Part of commit `d8a8696` (iterations 12-20 combined)
- Visual verification via Storybook
