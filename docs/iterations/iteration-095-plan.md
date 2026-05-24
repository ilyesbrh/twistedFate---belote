# Iteration 095 — UX remediation for iters 091-092 + layout audit

## Goal

Address user feedback on what shipped in iter 091 (BidLog hidden behind BidPanel) and iter 092 (LastTrickPeek button visibility window too narrow, modal layout poor). Convert the last-trick affordance into a proper trick-history drawer reachable at all times during play. Audit the in-game layout for collisions and overflow at 390×844.

## User feedback (verbatim, translated)

> "I didn't like bid history, it's hidden by bid layout."
> "Last round play is not well designed and the button is disappearing when a new round starts and it's fast."
> "The button should open a history panel and each line should open the played cards."
> "I really don't like the spacing and layout, it contains a lot of collisions and out of layout, like it was developed by a junior."

## Confirmed visually (Playwright, 390×844)

- BidLog at `top: calc(50% - 220px)` collides with BidPanel at `top: 50% transform translate(-50%, -50%)`. The BidPanel's ~300px height puts its top edge at ~50%-150px, well inside the BidLog's vertical zone. Result: only 1 character of bidder name is reachable.
- LastTrickPeek visibility gate `lastCompletedTrick !== null && trickCards.length === 0` only opens for sub-second between sweep-out and next-trick-fill on AI mode at 1500ms step delay. Effectively invisible during normal play.
- Side avatars (West/East) anchored to `left: 6px` / `right: 6px` at mobile spill past the safe area edge on 390×844; the name label hangs off the viewport.

## Out of scope

- Server-side rematch protocol (iter 093 carryforward).
- `@belote/*` → `@tunisian/*` rename (iter 088 carryforward, parked).
- `@cards/ui-shell` Phase 4 extraction.
- Menu fixture visual-diff flake (different problem, separate iteration if it becomes load-bearing).

## Acceptance criteria

### BidLog repositioning

- [ ] BidLog no longer overlaps the BidPanel at any breakpoint.
- [ ] BidLog is visible at all times during the auction phase (whether or not it's the human's turn).
- [ ] Visual screenshot at 390×844 confirms unobstructed read.

### TrickHistoryPanel (replaces LastTrickPeek)

- [ ] New `TrickHistoryPanel` component at `packages/ui/src/components/TrickHistoryPanel/`.
- [ ] Always-visible "Tricks" button anchored bottom-right of the table whenever `round.tricks.length > 0`, regardless of whether a trick is currently in progress.
- [ ] Clicking the button opens a right-edge drawer listing every completed trick of the current round, one row per trick (most recent at top).
- [ ] Each row shows `Trick N · {winner} took {points} pts` and an expand caret.
- [ ] Clicking a row reveals the 4 played cards inline (accordion).
- [ ] Drawer dismisses via close button OR tap-on-backdrop.
- [ ] `role="dialog"`, `aria-label="Trick history"`, drawer is keyboard-dismissable via Escape.
- [ ] `GameSessionState` exposes `tricksHistory: TrickHistoryRecord[]` (replaces `lastCompletedTrick` + `lastTrickWinnerPosition`).
- [ ] `peekingLastTrick` renamed to `tricksPanelOpen`; `setPeekingLastTrick` renamed to `setTricksPanelOpen`.

### Layout audit pass

- [ ] Side avatars `.westAvatar` / `.eastAvatar` use `var(--safe-left)` / `var(--safe-right)` at mobile, not raw `6px`.
- [ ] Score panel top-left uses both `var(--safe-top)` and `var(--safe-left)`.
- [ ] At 390×844 the west and east avatar+name labels fit fully inside the viewport with no clipping.
- [ ] `pnpm audit:clip --url=...` at 390×844 reports no new entries beyond the pre-existing baseline.

### Quality gates

- [ ] All 4 checks pass (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`).
- [ ] Lint delta-clean vs iter 094 baseline (246).
- [ ] Playwright screenshots at 390×844 captured for: (a) bidding phase showing BidLog above the panel, (b) mid-trick showing "Tricks" button present, (c) drawer open with expanded row.

## Files to touch

### New

- `packages/ui/src/components/TrickHistoryPanel/TrickHistoryPanel.tsx`
- `packages/ui/src/components/TrickHistoryPanel/TrickHistoryPanel.module.css`
- `packages/ui/__tests__/TrickHistoryPanel.test.tsx`
- `packages/ui/src/dev/fixtures/trickHistoryPanel.fixtures.tsx`
- `docs/iterations/iteration-095-plan.md`, `docs/iterations/iteration-095-report.md`

### Modified

- `packages/ui/src/components/BidLog/BidLog.module.css` — reposition to top of table, not above BidPanel.
- `packages/ui/src/components/GameTable/GameTable.tsx` — replace `<LastTrickPeek>` with `<TrickHistoryPanel>`; render button using `tricksHistory.length > 0` instead of `lastCompletedTrick !== null && trickCards.length === 0`.
- `packages/ui/src/components/GameTable/GameTable.module.css` — `.bidLog` slot relocates to top; `.peekBtn` renamed `.tricksBtn`, position adjusted; side-avatar safe-area fixes.
- `packages/ui/src/hooks/useGameSession.ts` — derive `tricksHistory: TrickHistoryRecord[]` from `round.tricks`; expose `tricksPanelOpen` + `setTricksPanelOpen` (rename from `peekingLastTrick`).
- `packages/ui/src/hooks/useCoinchGameSession.ts` — same.
- `packages/ui/src/online/useOnlineGameSession.ts` — same (also threaded through `AdaptInput`).
- `packages/ui/src/dev/fixtures/index.ts` — register new fixture, remove `lastTrickPeek` re-export.

### Deleted

- `packages/ui/src/components/LastTrickPeek/LastTrickPeek.tsx`
- `packages/ui/src/components/LastTrickPeek/LastTrickPeek.module.css`
- `packages/ui/__tests__/LastTrickPeek.test.tsx`
- `packages/ui/src/dev/fixtures/lastTrickPeek.fixtures.tsx`

## Type design

```ts
export interface TrickHistoryRecord {
  /** 1-based trick number within the round. */
  readonly trickNumber: number;
  readonly cards: readonly TrickCardData[]; // 4 entries
  readonly winnerPosition: Position;
  readonly winnerName: string;
  /** Points won by the winning team for this trick. */
  readonly points: number;
}
```

Derive `tricksHistory` from `round.tricks` (Tunisian) / `pub.round.tricks` (online) by mapping each completed trick + computing points via `calculateTrickPoints` (already imported in the hooks).

## Component API

```ts
export interface TrickHistoryPanelProps {
  readonly tricks: readonly TrickHistoryRecord[];
  readonly open: boolean;
  readonly onClose: () => void;
}
```

Drawer slides in from the right (`transform: translateX(100%) → translateX(0)`). Backdrop click and Escape dismiss. Internal accordion state — each row clickable, only one expanded at a time (recommended UX) OR multiple (more permissive). Choose: **multiple expanded** so the user can compare two tricks side-by-side without losing context.

## Test plan (TDD red → green)

In `TrickHistoryPanel.test.tsx`:

1. Renders nothing when `open=false`.
2. When `open=true`, renders the drawer + each trick as a row.
3. Row shows trick number + winner name + points.
4. Clicking a row toggles its expanded state.
5. Expanded row reveals 4 `CardFace` elements.
6. Close button calls `onClose`.
7. Backdrop click calls `onClose`.
8. Escape key calls `onClose`.
9. Container has `role="dialog"`, `aria-label="Trick history"`.

## Validation

- `pnpm test` — expect baseline + 9 new tests − 6 deleted (LastTrickPeek) = 1605 + 3 = 1608.
- `pnpm typecheck` — clean.
- `pnpm lint` — delta-clean (246).
- `pnpm format:check` — clean.
- **Manual Playwright at 390×844**: bidding shows BidLog above panel; mid-trick shows Tricks button; drawer opens with rows; row expands to show cards.
- `pnpm audit:clip --url=...` no new entries.

## Risks

- **Renaming `peekingLastTrick` → `tricksPanelOpen` is a breaking change.** All call sites in the 3 hooks + GameTable need to update. Backward-compat shim not needed since the iter 092 commit hasn't been released to users.
- **Computing `points` per trick** requires re-running `calculateTrickPoints(trick, trumpSuit)` on each render for every completed trick. ~8 tricks max per round, negligible compute.
- **Side avatar safe-area fix may shift west/east hand positions.** Re-bless visual baselines.

## Carryforward

- **N+1 (iter 096) — Server `tricks_summary` in `round_completed` event.** For online play, the server should emit per-trick points so the client doesn't have to re-calculate from `tricks[]` (which it already does, but a server-emitted value would be authoritative).
- **N+2 — Menu fixture flake investigation.** The 4 menu-\* baselines drift by 0.2-0.7% each commit. Worth investigating root cause separately.
