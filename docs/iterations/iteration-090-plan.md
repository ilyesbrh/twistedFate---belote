# Iteration 090 — Active player highlight

## Goal

Replace the near-invisible terracotta-aura signal on the active `PlayerAvatar` with a high-contrast indicator that is visible without animation, complemented by an animated outer glow when motion is allowed.

## Out of scope

- Wiring `TimerRing` into `PlayerAvatar`. Per-turn timer is a separate concern.
- New design tokens — reuse the existing `--accent-terracotta` (#a83232).
- Changes to other indicators (dealer stamp, contract stamp). Their position and z-index stay as-is.

## Acceptance criteria

- [ ] An avatar with `isActive={true}` renders a permanently-visible terracotta frame around the token (3px solid `var(--accent-terracotta)`, `border-radius: 18px`, `inset: -5px`, no fill).
- [ ] When `prefers-reduced-motion: no-preference`, the frame breathes via a `box-shadow` glow on a 1.4s ease-in-out cycle. When `reduce` is set, no animation runs.
- [ ] The active player's `.name` label has terracotta border (`var(--accent-terracotta)`) and `font-weight: 900`.
- [ ] Inactive avatars: no terracotta frame, no glow, normal name label.
- [ ] `TimerRing` z-index hierarchy preserved — the new `.activeRing` rule uses `z-index: 5`, leaving room above for any future `TimerRing` at 6.
- [ ] Obsolete `tokenAura` keyframes deleted; the `.wrapperActive .token` animation rule removed.
- [ ] 4 new tests in `PlayerAvatarBubble.test.tsx` covering: ring presence when active, absence when inactive, wrapper class, name-label class.
- [ ] All 4 checks pass (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`).

## Files to touch

### Modified

- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.module.css` — un-hide `.activeRing`, give it a real frame; delete `tokenAura` keyframes; remove the `.wrapperActive .token` animation rule (keep the `border-color` override); add `turnGlow` keyframes guarded by `prefers-reduced-motion`; add `.wrapperActive .nameLabel` and `.wrapperActive .name` rules.
- `packages/ui/src/components/PlayerAvatar/PlayerAvatar.tsx` — delete the stale comment block (lines 156-158) about the ring being hidden; the comment will be untrue after this change.
- `packages/ui/__tests__/PlayerAvatarBubble.test.tsx` — add a new `describe("PlayerAvatar — active state")` block with 4 tests.

### New

- `docs/iterations/iteration-090-plan.md`, `docs/iterations/iteration-090-report.md`.

## CSS design

```css
/* Replace the existing .wrapperActive .token rule + tokenAura keyframes + .activeRing display:none */

.wrapperActive .token {
  border-color: var(--accent-terracotta);
}

/* Static terracotta frame — always visible when active */
.activeRing {
  position: absolute;
  inset: -5px;
  border: 3px solid var(--accent-terracotta);
  border-radius: 18px;
  z-index: 5;
  pointer-events: none;
}

/* Pulsing glow — motion only */
@media (prefers-reduced-motion: no-preference) {
  .activeRing {
    animation: turnGlow 1.4s ease-in-out infinite;
  }
}

@keyframes turnGlow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(168, 50, 50, 0);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(168, 50, 50, 0.55);
  }
}

/* Name label highlight when active */
.wrapperActive .nameLabel {
  border-color: var(--accent-terracotta);
}
.wrapperActive .name {
  font-weight: 900;
}
```

The mobile (`max-width: 600px`) and landscape (`max-height: 500px and orientation: landscape`) breakpoints get a slightly tighter ring (inset: -4px, border-radius: 14px) to scale with the smaller tokens.

## Test plan (TDD red → green)

In `packages/ui/__tests__/PlayerAvatarBubble.test.tsx`, add:

```ts
describe("PlayerAvatar — active state", () => {
  it("renders the activeRing span when isActive=true", () => { ... });
  it("does not render the activeRing span when isActive=false", () => { ... });
  it("applies wrapperActive class to the wrapper when isActive=true", () => { ... });
  it("does not apply wrapperActive class when isActive=false", () => { ... });
});
```

Each test renders `<PlayerAvatar player={MOCK_PLAYER} isActive={...} />` and asserts:

- `getByTestId("player-avatar-south").className` contains `wrapperActive` substring (CSS-modules-friendly).
- The wrapper's first child (`.token`) contains a `<span aria-hidden="true">` with `activeRing` substring in its className.

Test 2 (`does not render`) confirms the `{isActive && <span ...>}` gating works — currently passes (no regression risk), included for completeness.

Tests 1, 3, 4 currently FAIL — the existing `PlayerAvatarBubble.test.tsx` covers only contract stamps and thought bubbles. Confirmed: `grep isActive` on the test file returns no hits. Hence the new tests provide a genuine red phase.

Order:

1. Write all 4 tests. Run `pnpm --filter ui test` — expect 2 failing (1, 3) and 2 passing (2, 4 vacuously).
2. Update `PlayerAvatar.module.css` — un-hide `activeRing`, add `wrapperActive .nameLabel` rule. Run tests — all 4 green.
3. Remove `tokenAura` keyframes + the `.wrapperActive .token` animation rule. Run tests — still green.
4. Add `turnGlow` keyframes + `prefers-reduced-motion` guard. Run tests — still green (CSS not asserted in jsdom).
5. Delete the stale comment in `PlayerAvatar.module.css`.

## Validation

- `pnpm test` — expected: 1573 + 4 new = 1577 passing.
- `pnpm typecheck` — clean.
- `pnpm lint` — delta-clean.
- `pnpm format:check` — clean.
- `pnpm visual` — affected fixtures (`fixture-bidding-south`, `fixture-mid-trick`, `fixture-bidding-844x390`, etc.) will diff because the active avatar now has a visible terracotta frame. Re-bless via `pnpm visual:update`. The static frame is visible; verify by inspecting one new baseline.

## Risks

- **Mobile size regression.** The static 3px ring at `inset: -5px` means the avatar's effective footprint grows by 10px. The avatar is laid out via flexbox so this won't push neighbours. Visual diff catches if it overlaps anything (`pnpm audit:clip`).
- **Animation perceived as too aggressive.** The 1.4s cycle and 8px max glow may need tuning after seeing it live. Defer to a follow-up if the user requests softer.

## Carryforward

- **N+1 (iter 091) — Bid history log.** Per agent blueprint: new `BidLog` component renders `biddingRound.bids[]`. Read-only, no state plumbing. Sized for both Belote and Coinche bid types.
- **N+2 (iter 092) — Last trick peek.** Per agent blueprint: button + modal that shows the n-1 trick. Adds `lastCompletedTrick` derivation to three hooks (no protocol/server change — server already broadcasts `tricks[]`).
