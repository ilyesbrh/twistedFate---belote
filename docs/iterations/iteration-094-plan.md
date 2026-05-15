# Iteration 094 — Score breakdown panel

## Goal

Give players full transparency into how the final score was reached: a "Score Breakdown" toggle inside `GameOver` that reveals a per-round line-item table (Round #, Contract, Result, NS pts, EW pts, Bonus, running totals).

## Out of scope

- New core types — `RoundScore` already carries every line item needed.
- Animations on the breakdown rows.
- Persistence to match history DB.

## Acceptance criteria

- [ ] `RoundHistoryEntry` interface exported from `useGameSession.ts`.
- [ ] `GameSessionState.roundHistory: readonly RoundHistoryEntry[]` (initialized to `[]`, appended on `round_completed`).
- [ ] All 3 hooks accumulate `roundHistory`.
- [ ] `GameOver` accepts optional `roundHistory` prop.
- [ ] `GameOver` renders a "See breakdown" / "Hide breakdown" toggle button (only when `roundHistory` is non-empty).
- [ ] Toggle opens a `<ScoreBreakdown>` table with semantic `<table>`, `<th scope="col">`, mobile-scrollable wrapper.
- [ ] All 4 checks pass.

## Files to touch

### New

- `docs/iterations/iteration-094-plan.md`, `docs/iterations/iteration-094-report.md`.

### Modified

- `packages/ui/src/hooks/useGameSession.ts` — `RoundHistoryEntry` type + state + setter + accumulation logic on `round_completed`.
- `packages/ui/src/hooks/useCoinchGameSession.ts` — mirror.
- `packages/ui/src/online/useOnlineGameSession.ts` — mirror (read totals from `pub.scores`).
- `packages/ui/src/components/GameOver/GameOver.tsx` — new `ScoreBreakdown` sub-component + toggle state.
- `packages/ui/src/components/GameOver/GameOver.module.css` — `.breakdownToggle`, `.breakdown`, `.breakdownTable` rules.
- `packages/ui/src/components/GameTable/GameTable.tsx` — pass `roundHistory={state.roundHistory}` to `<GameOver>`.
- `packages/ui/__tests__/GameOver.test.tsx` — 4 new tests.
- `packages/ui/src/dev/fixtures/gameOver.fixtures.tsx` — 1 new fixture with sample history.

## Type design

```ts
export interface RoundHistoryEntry {
  readonly roundNumber: number;
  readonly contract: Contract | null;
  readonly bidderName: string;
  readonly roundScore: RoundScore | null;
  readonly nsCumulative: number;
  readonly ewCumulative: number;
}
```

## Test plan

In `GameOver.test.tsx`, add a `describe("score breakdown")` block:

1. Does NOT render "See breakdown" button when `roundHistory` is empty or undefined.
2. Renders "See breakdown" button when `roundHistory.length > 0`.
3. Clicking the button toggles the breakdown table open.
4. The table renders one row per entry with the contract suit symbol + value + result.

## Validation

- `pnpm test` — expected 1605 (+4 new tests).
- 4 checks delta-clean.
- Visual baselines refreshed if GameOver dimensions change.

## Carryforward

- **N+1 (iter 095) — `@tunisian/*` package rename** (carryforward from iter 088). Pure rename, ~40 import sites.
- **Server roundHistory in DB** — persistence of round-by-round breakdown for the match history feature. Out of scope here.
