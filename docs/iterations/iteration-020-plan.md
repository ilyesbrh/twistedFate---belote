# Iteration 020 — Online sub-screens visual alignment

## Goal

Bring `OnlineLobby` (Friends mode) and `OnlineRandomScreen` (Random
matchmaking) into the same dark-felt visual language landed by
iteration 019 — so navigating from the menu into the online flows
feels continuous, not like a different app.

This is a smaller iteration than 019 because the design language is
already established; we're applying tokens, not inventing them.

## Concrete changes per surface

### `OnlineLobby` — Friends mode

1. Replace the plain radial gradient with the same layered card-table
   background ModeSelectScreen uses (radial + diagonal felt overlay +
   corner suit watermarks). Lift the watermark/background CSS into a
   shared place so we don't copy-paste.
2. Title gets the gold-ramp gradient treatment (same one as the menu).
3. Room-code block (`ABCD`) styled like a flipped card: cream paper
   background, dark text, subtle drop shadow — visually distinct from
   chrome elements, immediately readable as "the thing to share."
4. Player rows in `in_room` get the same tile chrome the mode tiles use
   (linear gradient + tile shadow + 1° tilt-on-hover for unseated rows).
5. Primary buttons (Create / Join / Start) inherit the gold-ramp tile
   look used by the new menu — a single hover state across screens.

### `OnlineRandomScreen` — Random matchmaking

1. Same card-table background.
2. Title gold-ramp gradient.
3. Queue-progress display ("3/4") rendered as a card-faced badge —
   matches the room-code paper-card style for visual consistency.
4. Spinner upgraded: thicker ring, gold-ramp colour, gentle pulse.
5. Primary buttons share the tile look.

### Shared extraction

Lift the `.root` background composition + `.watermarks` block out of
`ModeSelectScreen.module.css` into a CSS Module that both online
screens can compose. Two reasonable approaches:

- **Option A:** A `MenuFelt` React component that renders a `<div>`
  with the felt classes + `<SuitWatermarks/>` and accepts `children`.
  Each screen wraps its content in `<MenuFelt>`.
- **Option B:** A new shared CSS file
  `packages/ui/src/styles/menu-surface.module.css` exporting class
  names. Each screen imports and composes those.

**Going with A** — wrapping in a component keeps the watermarks in
one place (DOM + accessibility), avoids `composes:` directive fussiness
across module boundaries, and gives us a single place to add a "menu
overlay" prop later if needed (e.g. blur on modal open).

## Out of scope

- Behavioural / protocol changes — same flows.
- Touching `<GameTableView>` or any in-round visuals.
- Adding new dependencies. Spinner / icons stay hand-rolled.
- The chat panel.

## Files to touch

### Modified

- `packages/ui/src/components/OnlineLobby/OnlineLobby.tsx` — wrap in
  `<MenuFelt>`, keep all behaviour. Apply tile chrome to player rows
  via class change.
- `packages/ui/src/components/OnlineLobby/OnlineLobby.module.css` —
  drop the inline radial; apply gold-ramp title + card-paper code
  block + tile chrome on rows + primary buttons.
- `packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.tsx`
  — wrap in `<MenuFelt>`. Mark up the progress display as a paper-card
  badge.
- `packages/ui/src/components/OnlineRandomScreen/OnlineRandomScreen.module.css`
  — drop inline radial; apply gold-ramp title + paper-card progress +
  thicker spinner + tile chrome buttons.

### New (shared)

- `packages/ui/src/components/MenuFelt/MenuFelt.tsx` — wrapper that
  emits the layered background root + corner watermarks. Accepts
  `children`.
- `packages/ui/src/components/MenuFelt/MenuFelt.module.css` — felt
  background composition + watermark anchors. Lifted from
  ModeSelectScreen verbatim.

### Modified (refactor)

- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  — switch to using `<MenuFelt>` for the felt + watermarks, removing
  the local `<SuitWatermarks>` helper.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.module.css`
  — drop the watermark + felt background classes (they live in
  MenuFelt now). Keep mode-tile chrome local.

### Tests

- `packages/ui/__tests__/MenuFelt.test.tsx` — new file. 2 tests:
  renders children, emits `aria-hidden="true"` decorative watermark
  layer.
- `packages/ui/__tests__/OnlineLobby.test.tsx` — extend with: title
  has gold-ramp class marker (hint via testid), room-code block has
  `data-testid="room-code-card"`. Existing assertions stay.
- `packages/ui/__tests__/OnlineRandomScreen.test.tsx` — extend with:
  progress display has `data-testid="random-progress-card"`. Existing
  assertions stay.
- `packages/ui/__tests__/ModeSelectScreen.test.tsx` — no test changes
  needed, behaviour unchanged after the MenuFelt refactor.

### Fixtures (no changes)

The screen viewer already has comprehensive coverage of these screens.
Existing fixtures will pick up the visual update automatically; the
fixture sweep test (`fixtures.test.tsx`) will verify they all still
render-without-crash after the refactor.

## TDD plan

1. Write `MenuFelt.test.tsx` (red — module doesn't exist).
2. Implement `MenuFelt` (component + CSS lifted from
   ModeSelectScreen). Tests green.
3. Refactor `ModeSelectScreen` to use `MenuFelt`. Run existing test
   suite — must stay green.
4. Extend `OnlineLobby.test.tsx` with the new testids → red. Wrap in
   `<MenuFelt>` and add the room-code-card testid → green. Re-run.
5. Same for `OnlineRandomScreen.test.tsx` + progress-card testid.
6. Layer in the CSS for room-code paper card, player-row tile chrome,
   spinner upgrade. Tests stay green.
7. Browser smoke at `?screens` (every fixture in OnlineLobby /
   OnlineRandomScreen groups) and live `/` flow.

## Validation

- `pnpm test` — green; expected delta ≈ +5 tests.
- `pnpm typecheck` — clean.
- `pnpm lint` — delta ≤ +1 (one new MenuFelt test file at most).
- `pnpm format:check` (iteration scope) — clean.
- Manual: dev tools rotate 320×568, 390×844, 768×1024, 1280×800; verify
  no overflow, no gold-on-cream contrast issues on the room-code card,
  watermarks don't crowd the seat list.

## Carryforward

- After 020 lands, the menu / lobby / random screens share a coherent
  language. **Iteration 021** is a natural fit for the
  pixel-diff regression suite (Playwright), since the menu surfaces
  are visually stable.
- The InstallPrompt overlay still covers part of the menu — touch up
  candidate for a small dedicated iteration.
- If MenuFelt grows more shared chrome (fixed back button, gold-title
  helper, card-paper badge), promote it from a single file to a
  `MenuFelt/` directory with sub-components.
