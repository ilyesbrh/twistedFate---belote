# Iteration 019 — Menu visual makeover

## Goal

Give `ModeSelectScreen` (the main menu) and `StartScreen` (the
in-game splash) a distinctive visual identity. The user described the
current menu as "most basic UI ever" — iterations 015 / 016 made it
responsive and a11y-clean, but visual personality was untouched.

## Visual direction (the part most likely to be redirected)

**Theme: "Tunisian café card-table — dark felt + warm card glow + suit
accents."** Concretely:

1. **Background.** Replace the plain radial gradient with a layered
   look that evokes a card-table at night: dark blue → near-black
   radial, plus a low-opacity diagonal felt texture (CSS pattern, not
   an image), plus four large suit watermarks anchored to the corners
   at very low opacity (decoration only).
2. **Hero strip above the title.** A small horizontal fan of four
   cards, one per suit — `♠ ♥ ♦ ♣`. Inline SVG, not an asset. Cards
   rotate-into-place once on mount (`@media (prefers-reduced-motion:
no-preference)` only).
3. **Title.** Keep "Belote" gold, add a subtle one-shot entrance: fade
   up + slight letter-spacing settle. No looping animations (would
   compete with hover state on buttons).
4. **Mode tiles.** Drop the plain rectangles for icon-led tiles:
   - **AI** — CPU / chip glyph
   - **Friends** — two-figures glyph
   - **Random** — shuffle / dice glyph
   - **Ranked** — trophy glyph, opacity-dimmed, "Coming soon" pill
     overlay (instead of bare disabled state)

   Tiles get a tilt-on-hover (rotate 1°, lift Y −2px) — feels card-y
   without being noisy. Existing label + subtitle copy stays.

5. **`StartScreen` (in-game).** Apply the same tile-style hero treatment:
   keep the existing `belote-hero.svg`, but tighten typography to
   match the new menu, and warm up the CTA button colour to align with
   the gold title.

This direction can be redirected before any code lands. Two natural
alternatives if you'd rather:

- **Bright / playful** — light gradient, illustrated mascot, animated
  card flicks. More casual-game-app feel, less "card room."
- **Minimalist** — keep it dark and quiet, drop the hero strip and
  watermarks, just upgrade the tile chrome (icons + tilt) and stop
  there. Smaller scope, lower visual ambition, ships in half the time.

The plan below assumes the recommended direction.

## Out of scope

- Any flow changes (mode picker still leads to the same routes).
- Touching `<GameTableView>` or in-round visuals (those got their own
  pass in iteration 016).
- Adding any new dependencies. Icons are hand-written inline SVG.
- "Random matchmaking" / "Friends" sub-screens (`OnlineRandomScreen`,
  `OnlineLobby`) — covered by the screen viewer; redesigning them is
  iteration 020+.

## Files to touch

### Modified

- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — adds the hero strip + per-mode SVG icon + a "Coming soon" pill on
  ranked.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css`
  — new background composition, watermarks, title entrance, tile tilt
  - icon layout.
- `packages/ui/src/components/StartScreen/StartScreen.tsx`
  — minor markup tweak for the new title/CTA treatment.
- `packages/ui/src/components/StartScreen/StartScreen.module.css`
  — typography + CTA tint to match menu.
- `packages/ui/src/styles/tokens.css` — add a small set of menu-makeover
  tokens (`--menu-felt-overlay`, `--menu-suit-watermark-opacity`, gold
  ramp tokens) so the values are reusable and discoverable.

### Tests (extended)

- `packages/ui/__tests__/ModeSelectScreen.test.tsx` — add assertions
  for: hero present (`data-testid="menu-hero"`), each mode tile renders
  its icon (`data-testid="mode-icon-<mode>"`), ranked tile shows
  "Coming soon" pill, all existing a11y attributes still hold.
- `packages/ui/__tests__/StartScreen.test.tsx` — assertions stay the
  same; verify nothing regresses.

### Fixtures (additive)

- Extend `dev/fixtures/modeSelectScreen.fixtures.tsx` with one extra
  fixture toggling reduced-motion via a wrapper (so we can sanity-check
  the no-animation path in the screen viewer).

## TDD plan

1. Extend `ModeSelectScreen.test.tsx` first (red): hero present, four
   mode-icon testids, ranked has "Coming soon" pill. Run → red.
2. Implement TSX (icons + hero), keep CSS minimal. Run → green at
   the markup level.
3. Layer in the CSS direction (background, animations, tile tilt) —
   doesn't change tests.
4. Visual verification via the screen viewer
   (`?screens` → `ModeSelectScreen`). Walk all viewport presets.
5. Re-verify in the live menu (`/`) on dev.

## Validation

- `pnpm test` — green; expected delta ≈ +5 tests.
- `pnpm typecheck` — clean.
- `pnpm lint` / `pnpm format:check` — delta clean on iteration scope.
- Manual: dev tools rotate 320×568, 390×844, 768×1024, 1280×800.
  Confirm tiles don't wrap onto two lines per label, hero scales
  cleanly, watermarks stay decorative (not blocking content),
  reduced-motion suppresses entrance + tilt-hover animations.

## Carryforward

- Iteration 020 should give the **online sub-screens** (`OnlineLobby`,
  `OnlineRandomScreen`) the same icon-led tile + tilt-hover treatment
  for visual consistency. Smaller iteration; should be quick now that
  the design language is established.
- Iteration 021 (or a parallel batch): replace the `belote-hero.svg`
  asset with a more curated illustration if the inline-SVG hero strip
  pattern feels right.
- Pixel-diff regression suite (deferred since 017) is a good fit
  _after_ this iteration, so the diff baseline starts from the
  redesigned menu.
