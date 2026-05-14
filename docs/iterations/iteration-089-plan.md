# Iteration 089 — Card size uplift

## Goal

Make hand cards and trick cards feel more prominent during gameplay without breaking horizontal fit, visual hierarchy, or accessibility hit targets.

## Out of scope

- Card face typography (rank/suit label sizes) — defer to a follow-up if it looks sparse.
- Landscape phone sizing changes — too tight vertically, leave alone.
- New components or game logic — pure CSS.

## Acceptance criteria

- [ ] `--card-w-hand` ≥ 56px at the mobile breakpoint (was 46px); +44% the WCAG 2.5.5 minimum hit target with margin.
- [ ] Player-hand cards visibly larger than opponent cards at every breakpoint (preserved visual hierarchy).
- [ ] `pnpm audit:clip` against the in-game route reports no new `truncated` or `offscreen` entries at 390×844 portrait and 844×390 landscape.
- [ ] All 4 checks pass (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`).
- [ ] Visual baselines re-blessed via `pnpm visual:update` and the diff visually inspected.

## Files to touch

### Modified

- `packages/ui/src/styles/tokens.css` — 12 card-size tokens across 4 breakpoint blocks.
- `packages/ui/src/components/HandDisplay/HandDisplay.module.css` — `transform-origin` Y values bumped on mobile (260→310) and tablet (380→430) to keep arc visually proportional to taller cards.
- `packages/ui/src/components/TrickArea/TrickArea.module.css` — widen `clamp()` floors on the trick area (200→220 width, 160→180 height) so larger trick cards aren't cramped.

### New

- `docs/iterations/iteration-089-plan.md`, `docs/iterations/iteration-089-report.md`.

## Token deltas

### Mobile (`max-width: 600px`) — primary target 390×844

| Token            | Old  | New  |
| ---------------- | ---- | ---- |
| `--card-w-hand`  | 46px | 56px |
| `--card-h-hand`  | 64px | 78px |
| `--card-w-trick` | 54px | 64px |
| `--card-h-trick` | 76px | 90px |
| `--card-w-opp`   | 32px | 34px |
| `--card-h-opp`   | 45px | 48px |

### Tablet (`max-width: 900px`)

| Token            | Old  | New   |
| ---------------- | ---- | ----- |
| `--card-w-hand`  | 62px | 72px  |
| `--card-h-hand`  | 87px | 100px |
| `--card-w-trick` | 70px | 82px  |
| `--card-h-trick` | 98px | 114px |
| `--card-w-opp`   | 42px | 44px  |
| `--card-h-opp`   | 59px | 62px  |

### Landscape phone (`max-height: 500px`)

No change. Vertical space is the bottleneck in landscape; keep current 52×72 hand / 62×87 trick.

### Root (desktop fallback)

| Token            | Old   | New   |
| ---------------- | ----- | ----- |
| `--card-w-hand`  | 80px  | 88px  |
| `--card-h-hand`  | 112px | 122px |
| `--card-w-trick` | 90px  | 100px |
| `--card-h-trick` | 126px | 138px |
| `--card-w-opp`   | 54px  | 56px  |
| `--card-h-opp`   | 75px  | 78px  |

## Fan-fit analysis

Hand fan is radial with fixed-degree spread: `maxAngle = min(22°, (n-1) × 3.5°)` from `HandDisplay.tsx`. At mobile, 22° spread × `transform-origin: 50% 310px` (after the bump) gives the leftmost and rightmost slots center-to-center ≈ `2 × sin(22°) × 310 ≈ 232px`, comfortably within 390px viewport with even larger 56px cards. `pnpm audit:clip` is the final arbiter.

`OpponentHand` top fan has hardcoded `width: 200px` at mobile; opponent card width stays small (34px), so no container resize needed there.

## Validation

- `pnpm test` — expected: 1573/1573, no delta (CSS-only change, no test sources touched).
- `pnpm typecheck` — clean.
- `pnpm lint` — delta-clean over baseline.
- `pnpm format:check` — clean.
- `pnpm audit:clip --url=http://localhost:PORT/twistedFate-belote/` — no new entries at 390×844 or 844×390.
- `pnpm visual:update` — re-bless baselines (all 10 in-game fixtures × multiple viewports will diff; inspect each).

## TDD plan

This is a CSS-only refactor with no new behavior; TDD red is not applicable. The 1573-test safety net + clip audit + manual visual diff catch regressions.

## Carryforward

- **N+1 (iter 090) — Active player highlight.** Per agent blueprint: repurpose dormant `activeRing` span on `PlayerAvatar`, add static terracotta frame + pulsing glow, bold name label when active. Reduced-motion respected. CSS-only.
- **N+2 (iter 091) — Bid history log.** Per agent blueprint: new `BidLog` component reading `biddingRound.bids[]`, integrated in `GameTableView`. `role="log"`, `aria-live="polite"`. One unified component handles both Belote and Coinche bid types.
