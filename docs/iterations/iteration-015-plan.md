# Iteration 015 — Menu UI: device polish

## Goal

Make every "menu" surface look right and feel right on every realistic device:
small phone portrait (~360×640), small phone landscape (~640×360), tablet
portrait/landscape, and desktop. Stay mobile-first. No new menu features.

## Surfaces in scope

1. `ModeSelectScreen` — mode picker (AI / Friends / Random / Ranked)
2. `StartScreen` — pre-game hero + target score + Play
3. `OnlineLobby` — Friends-mode lobby (create / join / seat list / start)
4. `OnlineRandomScreen` — random matchmaking (just shipped in 014)
5. `InstallPrompt` — PWA install banner

Out of scope: in-game board / `GameTable` / `BidPanel` / etc. That's iteration 016.

## Pain points found in current code

- **No safe-area handling.** Back buttons positioned `top: 16px; left: 16px;`
  collide with the iPhone notch and Android camera holes; install banner sits
  on top of the iOS status bar; bottom CTAs collide with iOS home indicator.
- **Hardcoded pixel typography.** 52px title on `ModeSelectScreen`, 36px room
  code, 28px headers — none scale fluidly. On a 320px-wide phone in
  landscape (height 390), the Mode Select title + 4 stacked buttons overflow.
- **Inconsistent breakpoint coverage.** `ModeSelectScreen` has 1 media query
  (520px), `StartScreen` has 2, `OnlineLobby`/`OnlineRandomScreen` have 0.
  `InstallPrompt` only handles ≤360px.
- **No touch-feedback `:active` states** on most buttons (only `StartScreen`
  has `transform: scale(0.95)`); hover-only feedback is invisible to touch.
- **Touch targets below 44×44.** The lobby's "Cancel" link, install prompt's
  "Not now" button, and the random-screen back arrow are all closer to 32px.
- **`100vh` vs `100dvh`.** Already addressed in `index.css`; menu surfaces use
  `position: fixed; inset: 0;` so they inherit, but the StartScreen card uses
  `max-height: calc(100dvh - 32px)` while others use raw `100vh` implicitly.
- **No `prefers-reduced-motion` opt-out.** Slide/fade-in animations run for
  all users.

## Design approach

**Single source of truth for menu tokens.** Add menu-specific CSS variables to
`packages/ui/src/styles/tokens.css` and consume them across the 5 surfaces.

New tokens (in `tokens.css`, top-level + breakpoint overrides):

```css
/* Menu surfaces */
--menu-pad-block: clamp(20px, 5vh, 48px);
--menu-pad-inline: clamp(16px, 4vw, 40px);
--menu-gap: clamp(12px, 3vh, 24px);
--menu-radius: 14px;
--menu-radius-lg: 22px;

--menu-title-size: clamp(32px, 8vw, 56px); /* Mode-select / lobby / random */
--menu-subtitle-size: clamp(11px, 1.6vw, 16px);
--menu-body-size: clamp(13px, 1.6vw, 16px);
--menu-cta-size: clamp(13px, 1.4vw, 15px);

--touch-min: 44px; /* WCAG 2.5.5 minimum */

--safe-top: max(16px, env(safe-area-inset-top));
--safe-bottom: max(16px, env(safe-area-inset-bottom));
--safe-left: max(16px, env(safe-area-inset-left));
--safe-right: max(16px, env(safe-area-inset-right));
```

Each menu surface then:

- Uses `padding: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left)` on its outer container.
- Replaces hardcoded font sizes with `var(--menu-*-size)`.
- Sets `min-height: 44px; min-width: 44px;` on every interactive control.
- Adds an `:active { transform: scale(.97); }` rule (or equivalent) for touch.
- Wraps fade/slide animations in `@media (prefers-reduced-motion: no-preference)`.

**Landscape-phone treatment.** When height ≤ 500px and orientation: landscape,
collapse vertical rhythm: shrink title, cap menu gap, and on `ModeSelectScreen`
keep the 2-column grid (don't collapse to 1 column at narrow widths if we're
also short — the user can't scroll a fixed-overlay).

**ModeSelectScreen-specific**: rework the breakpoint logic so:

- ≤ 480px **and** portrait → single column
- short landscape (height ≤ 500) → 2 columns with shrunk gaps regardless of width

## TDD plan

CSS-only changes are not directly TDD-able — jsdom doesn't compute layout.
The behavioural pieces I CAN TDD:

1. **A11y contracts** — back buttons get explicit `aria-label`, status text
   gets `role="status"`, queued progress gets `aria-live="polite"`. These
   land as new tests against the existing menu components.
2. **Reduced-motion**: components don't directly read this preference (it's
   handled in CSS), so no behavioural test there.
3. **Render-without-crash at narrow viewport**: I'll add render-only tests
   confirming each menu component mounts cleanly when the JSDOM window is
   resized to 320×568 (smallest common iPhone SE) and 640×360 (landscape
   phone). This catches React errors but not visual issues.
4. **Touch-target attribute**: I'll surface a stable `data-touch="primary"`
   attribute on primary CTAs and assert it via test (the CSS file enforces
   the size, the attribute lets tests assert existence).

Strict TDD where applicable; CSS-only changes verified by the existing test
suite continuing to pass + manual / smoke validation.

### Tests to add

- `__tests__/ModeSelectScreen.test.tsx` — extend with: `mode-btn-*` carries `aria-label`, primary CTAs have `data-touch="primary"`, all 4 buttons render at narrow viewport.
- `__tests__/OnlineRandomScreen.test.tsx` — extend with: queued progress has `role="status"` + `aria-live="polite"`, back/cancel/find have `aria-label`.
- `__tests__/OnlineLobby.test.tsx` — **new** — same a11y + render-at-narrow checks.
- `__tests__/InstallPrompt.test.tsx` — **new** — render with the matchMedia / beforeinstallprompt stubs; assert it doesn't render when standalone.

## Files to touch

- `packages/ui/src/styles/tokens.css` — add menu tokens + breakpoint overrides
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css`
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx` (a11y attrs)
- `packages/ui/src/components/StartScreen/StartScreen.module.css`
- `packages/ui/src/components/OnlineLobby/OnlineLobby.module.css`
- `packages/ui/src/components/OnlineLobby/OnlineLobby.tsx` (a11y attrs)
- `packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.module.css`
- `packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.tsx` (a11y attrs)
- `packages/ui/src/components/InstallPrompt/InstallPrompt.module.css`

## Validation

- `pnpm test` — green; expected delta ≈ +15–25 tests.
- `pnpm typecheck` — clean.
- `pnpm lint` / `pnpm format:check` — delta clean (no new errors).
- Manual: open the dev server, exercise the four menu screens at 360×640,
  640×360, 768×1024, and 1280×800; confirm no overflow, all CTAs ≥ 44px, no
  notch collision in iOS Safari simulator.
