# Iteration 19 Report: BiddingPanel — Suit Buttons & Pass

**Date**: 2026-02-21
**Status**: Complete

## Goal

Provide a bidding UI allowing the human player to select a trump suit or pass during the bidding phase.

## Scope

1. `bidding-layout.ts` — Pure layout math for button positioning
2. `bidding-panel.ts` — PixiJS Container with 4 suit buttons + pass button
3. Event callbacks for suit bids and pass actions
4. Storybook stories

## Tests Written (14 test cases)

### bidding-layout.test.ts (14 tests)

- Button positions computed from zone dimensions
- Buttons centered horizontally
- Pass button positioned below suit buttons
- Button sizing responsive to zone
- Edge cases for small zones

## Implementation Summary

### Files Created

- `packages/ui/src/components/bidding/bidding-layout.ts` — Pure layout computation
- `packages/ui/src/components/bidding/bidding-panel.ts` — PixiJS Container with interaction
- `packages/ui/src/components/bidding/bidding-panel.stories.ts` — Storybook stories
- `packages/ui/__tests__/bidding-layout.test.ts` — 14 TDD test cases

### Key API

```typescript
class BiddingPanel extends Container {
  update(zone: Rect): void;
  onSuitBid(callback: (suit: Suit) => void): void;
  onPass(callback: () => void): void;
}
```

## Review Fixes Applied

- Memory leak fix: destroy children before removing them in `update()` to prevent PixiJS resource leaks
- Null/undefined return convention normalized

## Validation Results

- Part of commit `d8a8696` (iterations 12-20 combined)
- 14 bidding-layout tests passing
