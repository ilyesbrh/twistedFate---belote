# Iteration 25 Report: Deep Fixes — Phase Gating & Resize Re-render

**Date**: 2026-02-22
**Status**: Complete
**Commits**: `6bb5d87` (feat), `d3b47fb` (review fixes)

## Goal

Fix two structural issues identified through code review:

1. No phase gating on input dispatch — card taps during bidding and bids during playing were silently forwarded to the session
2. Resize didn't re-render — `GameRenderer.resize()` repositioned zone containers but never re-rendered child components, leaving stale positions

## Scope

1. Phase-gated input dispatch in `GameController.wireInput()`
2. View caching + replay in `GameRenderer.resize()`
3. Score panel repositioning on every `update()` (handles resize correctly)
4. 8 new phase-gating tests + 1 cancelled-phase test

## Tests Written (9 new → 756 total, then 757 after review)

### game-controller.test.ts (9 new tests)

**Phase gating — card play (3 tests):**

- Card tap ignored during bidding phase
- Card tap ignored during completed phase
- Card tap dispatched during playing phase (existing, updated)

**Phase gating — suit bid (2 tests):**

- Suit bid ignored during playing phase
- Suit bid ignored during completed phase

**Phase gating — pass (2 tests):**

- Pass ignored during playing phase
- Pass ignored during completed phase

**Phase gating — cancelled (1 test, added in review):**

- All inputs ignored during cancelled phase

**Existing tests updated (3 tests):**

- Bid/pass tests now set bidding-phase rounds before dispatching

## Implementation Summary

### Files Modified

- `packages/ui/src/game-controller.ts` — Added `currentPhase()` helper, phase guards in `wireInput()`
- `packages/ui/src/game-renderer.ts` — Added `lastView` cache, `resize()` replays `update()`, score panel positioned in `update()`
- `packages/ui/__tests__/game-controller.test.ts` — 9 new tests, 3 updated tests

### Key Code

```typescript
// Phase gating
wireInput(input: InputSource): void {
  input.onCardTap((_index, card) => {
    if (this.currentPhase() !== "playing") return;  // ← gate
    // ...
  });
  input.onSuitBid((suit) => {
    if (this.currentPhase() !== "bidding") return;  // ← gate
    // ...
  });
}

// Resize re-render
resize(viewport: Viewport): void {
  this.tableLayout.resize(viewport);
  if (this.lastView) {
    this.update(this.lastView);  // ← replay cached view
  }
}
```

## Review Fixes Applied (commit `d3b47fb`)

| Finding                                       | Severity | Fix                                                  |
| --------------------------------------------- | -------- | ---------------------------------------------------- |
| `RoundSnapshot.phase` typed as `string`       | Medium   | Tightened to `RoundPhase` from `@belote/core`        |
| Magic number 108 for score panel position     | Medium   | Replaced with `SCORE_PANEL_WIDTH + THEME.spacing.sm` |
| Redundant constructor score panel positioning | Low      | Removed; `update()` handles all positioning          |
| No cancelled-phase test                       | Low      | Added test for all inputs ignored during cancelled   |
| Phase mapping ternary chain lint error        | —        | Converted to exhaustive switch statement             |

## Technical Decisions

| Decision                   | Choice                       | Rationale                                                                 |
| -------------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| Phase gating in controller | Not in components            | Controller is the single decision point; components remain phase-agnostic |
| View caching               | `lastView: GameView \| null` | Minimal overhead; enables resize re-render without re-querying session    |
| `SCORE_PANEL_WIDTH` export | From `score-panel.ts`        | Single source of truth for layout calculations                            |

## Validation Results

- `pnpm test`: **757/757 passing**
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean
