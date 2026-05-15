# Iteration 093 — GameOver mode-aware CTAs

## Goal

Replace the single `PLAY AGAIN` button on the end-of-game screen with a context-aware CTA set that gives the user clear paths forward depending on whether they're playing AI, friends-online, or random-online — and adds a "Back to Menu" path that doesn't disconnect the room prematurely.

## Out of scope

- True server-side rematch signal for online-friends mode (today's `onPlayAgain` for online flows is "leave + return to menu", we'll just label it honestly as "LEAVE ROOM" rather than misnaming).
- View score breakdown CTA — that's iter 094's payload.
- Share result / screenshot button.

## Acceptance criteria

- [ ] `GameOverProps` adds `mode: GameOverMode`, `onBackToMenu: () => void`, optional `onFindNewOpponents?: () => void`.
- [ ] `GameOverMode` = `{ kind: "ai", gameVariant: "belote" | "coinche" }` | `{ kind: "online-friends" }` | `{ kind: "online-random" }`.
- [ ] AI mode renders 2 CTAs: PLAY AGAIN (primary) + Back to Menu (secondary).
- [ ] Online-friends renders 2 CTAs: LEAVE ROOM (primary) + Back to Menu (secondary).
- [ ] Online-random renders 3 CTAs: FIND NEW OPPONENTS (primary) + LEAVE (secondary) + Back to Menu (tertiary).
- [ ] All buttons have `min-height: 48px` touch target.
- [ ] `App.tsx` wires the mode + callbacks per route (`/belote/ai`, `/coinche/ai`, `/belote/online`, `/belote/random`).
- [ ] Existing 18 `GameOver.test.tsx` tests still pass (renderGameOver helper updated to provide defaults).
- [ ] 6 new mode-specific tests added.
- [ ] All 4 checks pass.

## Files to touch

### Modified

- `packages/ui/src/components/GameOver/GameOver.tsx` — add `mode`, `onBackToMenu`, `onFindNewOpponents` props; render CTA group based on mode.
- `packages/ui/src/components/GameOver/GameOver.module.css` — `.secondaryBtn` + `.tertiaryBtn` rules.
- `packages/ui/src/components/GameTable/GameTable.tsx` — `GameTableViewProps` adds `mode`, `onBackToMenu`, `onFindNewOpponents`; thread to `<GameOver>`.
- `packages/ui/src/App.tsx` — wire each route's `GameTableView` / `GameTable` with the right `mode` + callbacks. Online-random's `FindNewOpponents` re-queues via `lobby.cancelRandom() → lobby.findRandom()`.
- `packages/ui/__tests__/GameOver.test.tsx` — extend `renderGameOver` to provide default `mode` and `onBackToMenu`; add new `describe("mode-aware CTAs")` block with 6 tests.

### New

- `docs/iterations/iteration-093-plan.md`, `docs/iterations/iteration-093-report.md`.

## Test plan (TDD red → green)

In `GameOver.test.tsx`, add:

```ts
describe("mode-aware CTAs", () => {
  it("AI mode renders PLAY AGAIN + Back to Menu, no Find Opponents", () => { ... });
  it("AI mode: Back to Menu fires onBackToMenu", () => { ... });
  it("online-friends renders LEAVE ROOM + Back to Menu", () => { ... });
  it("online-friends does NOT render Find Opponents", () => { ... });
  it("online-random renders FIND NEW OPPONENTS + LEAVE + Back to Menu", () => { ... });
  it("online-random: FIND NEW OPPONENTS fires onFindNewOpponents", () => { ... });
});
```

The 18 existing tests will currently FAIL because they don't provide `mode` or `onBackToMenu` (now required). Fix: update `renderGameOver` helper to supply defaults (`mode = { kind: "ai", gameVariant: "belote" }`, `onBackToMenu = vi.fn()`). Existing tests then continue to pass against the AI variant.

Order:

1. Update `renderGameOver` helper. Add 6 new tests. Run → 6 red.
2. Extend `GameOverProps` + render switch. Run → 24 green.
3. Update `GameTable.tsx` to accept + thread the props.
4. Update `App.tsx` to pass the right mode per route.

## Validation

- `pnpm test` — expected: 1595 existing + 6 new = 1601.
- `pnpm typecheck` — clean.
- `pnpm lint` — delta-clean.
- `pnpm format:check` — clean.
- `pnpm visual` — fixture-game-over-ns-wins will diff (now shows 2 buttons instead of 1). Re-bless.

## Risks

- **Online-friends "rematch" labeled as "LEAVE ROOM".** Today the primary callback just leaves the room — there's no server rematch protocol. Calling it "PLAY AGAIN" would be misleading. Labeling it "LEAVE ROOM" is honest but worse UX. Acceptable for this iteration; true rematch is a separate backend feature.
- **`renderGameOver` helper refactor.** Touching 18 existing tests' shared helper risks breaking them. Mitigated by providing safe defaults so they still test the AI variant.

## Carryforward

- **N+1 (iter 094) — Score breakdown.** Add `roundHistory[]` to all 3 hooks; new `<ScoreBreakdown>` subcomponent inside `GameOver` with a toggle button.
- **N+2 — Server-side rematch protocol.** When the backend gains a true rematch signal, online-friends mode's primary CTA flips from LEAVE ROOM to PLAY AGAIN. Out of scope for this UI iteration.
