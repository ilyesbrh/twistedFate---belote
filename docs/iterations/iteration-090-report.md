# Iteration 090 — Report

## Goal

Replace the near-invisible terracotta-aura signal on the active `PlayerAvatar` with a high-contrast indicator visible without animation, complemented by an animated outer glow when motion is allowed.

## Scope (delivered)

1. Un-hid the dormant `.activeRing` span; gave it a real 3px terracotta frame at `inset: -5px` with `border-radius: 18px`, `z-index: 5`.
2. Added `turnGlow` keyframes wrapped in `@media (prefers-reduced-motion: no-preference)` — the static frame is the baseline signal, the glow is the motion enhancement.
3. Bold name label (`font-weight: 900` + terracotta border) when active.
4. Removed obsolete `tokenAura` keyframes and the `.wrapperActive .token` animation rule.
5. Added responsive ring sizing for mobile (`max-width: 600px` → inset -4px, radius 14px, 2.5px border) and landscape (`max-height: 500px + orientation: landscape` → inset -3px, radius 12px, 2px border).
6. 4 new tests in `PlayerAvatarBubble.test.tsx` covering the `isActive` DOM contract.

## Tests written

4 new tests in `packages/ui/__tests__/PlayerAvatarBubble.test.tsx`, under a new `describe("PlayerAvatar — active state")` block:

1. `renders the activeRing span when isActive=true` — asserts a `[aria-hidden="true"]` child of the wrapper carries the `activeRing` class.
2. `does not render the activeRing span when isActive=false` — asserts no `[class*="activeRing"]` element exists.
3. `applies wrapperActive class to the wrapper when isActive=true` — asserts wrapper className contains `wrapperActive`.
4. `does not apply wrapperActive class when isActive=false` — symmetric negative.

**Note on TDD red phase.** All 4 tests passed against the pre-existing DOM contract (`{isActive && <span className={styles.activeRing} ... />}`) — the span and class were already conditionally rendered. The iteration's actual change is CSS-only (un-hiding the span, swapping keyframes). jsdom doesn't load CSS modules so a visual-property assertion isn't viable; the 4 tests serve as **structural regression coverage** ensuring the DOM contract survives future refactors, not as red-phase TDD. Same shape as iter 088/089 (pure visual refactors with green-from-start tests).

## Implementation summary

### Files modified

- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.module.css` — replaced `.activeRing { display: none }` with a real frame rule; deleted the comment block claiming the ring is hidden for backwards-compat; deleted `tokenAura` keyframes; removed the `.wrapperActive .token { animation: tokenAura ... }` rule (kept the `border-color` override); added `turnGlow` keyframes inside a `prefers-reduced-motion: no-preference` guard; added `.wrapperActive .nameLabel` and `.wrapperActive .name` rules; added mobile and landscape ring-sizing overrides.
- `packages/ui/__tests__/PlayerAvatarBubble.test.tsx` — appended new `describe` block with 4 tests.

### Files unchanged from plan

- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.tsx` — the plan called for deleting a stale comment, but on re-reading the actual source file the comment lives in the CSS module (not the `.tsx`), so the `.tsx` was untouched.

### Visual baselines updated

3 fixtures refreshed:

- `fixture-mid-trick` — small diff (840 px / 0.115%) — the active avatar now shows the new frame.
- `fixture-bidding-390x844` and `fixture-mid-trick-844x390` — tiny additional refreshes after the first update pass.

Other 12 fixtures unchanged (their mock data doesn't show an active player).

## Technical decisions

| Decision                                               | Why                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Static frame as baseline + glow as enhancement         | Reduced-motion accessibility — the signal must not vanish when animation is disabled. Static frame alone is sufficient signal.  |
| Responsive ring shrink on mobile / landscape           | The token shrinks at those breakpoints; the ring scales with it to preserve the visual ratio.                                   |
| Kept `border-color: var(--accent-terracotta)` on token | Provides a second concentric layer (token border + outer ring) that reinforces the active state if the ring is clipped somehow. |
| Tests assert DOM structure, not computed style         | jsdom doesn't load CSS modules. Asserting `display: none` would be a false-positive trap. Structural assertions are honest.     |

## Risks identified

- **Active fixture coverage is sparse.** Only one fixture (mid-trick) showed an active avatar; the bidding fixtures didn't trigger the new indicator visually. Risk: regressions in the active indicator could slip past visual diff for non-mid-trick scenes. Future fixture additions (e.g. for the `BidLog` in iter 091) should set `isActive={true}` on the relevant seat to widen coverage.
- **Glow timing not user-tested live.** 1.4s ease-in-out cycle is the agent's recommendation. May need tuning to feel right against the actual board pace (e.g. it could be too "demanding" during long bidding pauses or too "slow" during fast card play).

## Validation results

- `pnpm test` — **1577/1577 passed** (+4 new tests).
- `pnpm typecheck` — clean.
- `pnpm lint` — **246 errors total**, delta 0 vs iter 089.
- `pnpm format:check` — clean.
- `pnpm visual --url=http://localhost:5174/twistedFate-belote/` — 14 pass / 1 fail (mid-trick, 840 px diff, 0.115%). Re-blessed via `pnpm visual:update`. Re-ran — 15/15 pass.

## Acceptance criteria check

- [x] Permanently-visible terracotta frame around the active avatar token (3px solid, inset -5px, radius 18px).
- [x] Glow animation only inside `prefers-reduced-motion: no-preference`.
- [x] Active player's name label gains terracotta border + bold weight.
- [x] Inactive avatars: no ring, no glow, normal label.
- [x] `TimerRing` z-index hierarchy preserved (activeRing at 5, TimerRing slot at 6).
- [x] `tokenAura` keyframes removed; `.wrapperActive .token` animation rule removed.
- [x] 4 new tests pass.
- [x] All 4 checks pass.

## Next iteration: 091 — Bid history log

**Goal.** Render `biddingRound.bids[]` as a real-time scrolling log alongside the bid panel during the auction phase. One unified component handles both Belote and Coinche bid types.

**Acceptance criteria.**

- [ ] New `BidLog` component at `packages/ui/src/components/BidLog/BidLog.tsx`.
- [ ] Renders nothing for empty `bids[]`; one entry per bid otherwise.
- [ ] Handles all bid types: `pass`, `suit`, `coinche`, `surcoinche`, `sans-atout`, `tout-atout`, `capot`.
- [ ] `role="log"`, `aria-live="polite"`, `aria-atomic="false"` for screen-reader announcement of new entries only.
- [ ] Auto-scrolls to the newest entry.
- [ ] Pass entries fade to 50% opacity; coinche/surcoinche entries get terracotta accent.
- [ ] Integrated in `GameTableView`, visible only when `phase === "bidding"` and `biddingRound !== null`.
- [ ] 12 new tests in `packages/ui/__tests__/BidLog.test.tsx` + 1 fixture file.
- [ ] All 4 checks pass.

## Iteration 092 preview — Last trick peek

Add a button + modal that shows the n-1 trick. Adds derived `lastCompletedTrick` to `useGameSession`, `useCoinchGameSession`, `useOnlineGameSession`. No protocol/server change — server already broadcasts `tricks[]` in `public_state`.
