# Iteration 017 — Screen Viewer (dev mode)

## Goal

Add a dev-only mode that renders every UI screen × variant in isolation,
without booting a real `GameSession` or talking to the server. The viewer
gives us **ground truth** before any visual redesign work: every state of
every screen is reachable in two clicks instead of replaying a whole game
to see (e.g.) "what does `RoundSummary` look like when defenders capodast
and the contract was a coinche?".

This is a **permanent dev tool**, not a throwaway. It must:

- Be reachable in dev only (excluded from production bundle, no risk of
  end-users wandering into it).
- Have zero impact on the game path. App.tsx behaviour for menu / AI /
  online / random must be byte-identical when the viewer is not active.
- Cover every interactive screen and every meaningful variant of each.

This plan does **not** touch existing component visuals. Iteration 019
(menu makeover) is the consumer of this iteration's output.

## Out of scope

- Visual redesign of any component (iteration 019).
- The PWA double-prefix bug (iteration 018).
- Pixel-diff regression testing — adding fixtures is a prerequisite for
  that, but wiring the diff into CI is its own iteration.
- Persisting the selected fixture across reloads (could come later via
  `?screens=<id>` query param; not needed for v1).
- Testing actual user flow inside the viewer (form interactions, etc.) —
  fixtures are presentational only. Where a screen needs callbacks, we
  pass `vi.fn()` equivalents (no-op functions) so it renders.

## Surfaces in scope

The viewer registers a fixture per (screen, variant) pair. Coverage at v1:

1. **`StartScreen`** — single fixture (it has no real variants).
2. **`ModeSelectScreen`** —
   - default
   - with online disabled (server unreachable simulation)
3. **`OnlineLobby`** — drive `LobbyState` directly via fixtures:
   - host, code generated, 1 / 2 / 3 / 4 players seated
   - joiner, waiting for host
   - error state (disconnected / room full)
4. **`OnlineRandomScreen`** —
   - idle (nickname empty, nickname filled)
   - queued (position 1 / position 5)
   - error (server unreachable)
5. **`GameTableView`** — fed via crafted `GameSessionState` literals:
   - bidding phase, each seat's turn (4 fixtures)
   - bidding phase mid-auction with one bid stack
   - playing phase, mid-trick (2 cards down)
   - playing phase, end-of-trick (4 cards down, winner highlighted)
   - playing phase with belote announced
   - playing phase with rebelote announced
6. **`BidPanel`** —
   - empty bidding (no current bid; suit pickers active)
   - with current bid (raise required)
   - with coinche available (opponent contract)
   - with surcoinche available (own team coinched)
7. **`ScorePanel`** —
   - early round (low scores)
   - late round near target
   - contract level: simple / contre / surcontre
8. **`RoundSummary`** —
   - takers won simple contract
   - takers lost (capot to defenders)
   - coinche made / failed
   - surcoinche made / failed
9. **`GameOver`** —
   - team A wins
   - team B wins (so each side mirror tested)
10. **`ChatPanel`** —
    - closed (no fixture; covered by other shots)
    - open empty
    - open with messages (mix of self / partner / opponent / system)
11. **`ChatButton`** —
    - no badge
    - badge with unread count (1, 9, 99)
12. **`InstallPrompt`** — single fixture (visible state).
13. **`PlayerAvatar`** —
    - idle / thinking / has-belote / has-rebelote
    - small / medium / large screens via wrapper sizes
14. **`TrumpIndicator`** — one fixture per suit.

Not all of these will be perfectly rich at v1; the design accepts a
"render-without-crash + correct prop wiring" baseline and lets later
iterations add edge-case fixtures cheaply.

## Pain points / motivation

- Reaching some screens today requires playing an entire round (e.g.
  `RoundSummary` for a coinche-failed outcome). That makes redesign
  iteration on visual states slow and lossy.
- We have no place to drop reproduction props for a visual bug. A fixture
  registry doubles as a permanent "this is what state X looks like"
  artefact.
- Manual rotation testing on real device sizes is harder when you have
  to navigate to the screen first. The viewer lets you flip through every
  screen at every viewport in seconds.

## Design approach

### Architecture

A separate **dev module**, lazy-loaded only when `import.meta.env.DEV` is
true and a `?screens` query parameter is set. The dynamic import means
production builds tree-shake the entire dev module out — verified by a
test that scans the production bundle for the dev module's marker
string.

```ts
// App.tsx (delta)
const DEV_SCREENS = import.meta.env.DEV && new URLSearchParams(location.search).has("screens");

if (DEV_SCREENS) {
  return <ScreenViewerLazy />;
}
// existing App body unchanged
```

Where `<ScreenViewerLazy>` is a small wrapper around `React.lazy(() =>
import("./dev/ScreenViewer/ScreenViewer.js"))`.

### Fixture registry

A fixture is a typed record:

```ts
interface Fixture<P> {
  readonly id: string; // stable, kebab-case, unique
  readonly title: string; // displayed in the picker
  readonly group: string; // top-level grouping in sidebar
  readonly render: () => ReactElement;
}
```

One fixture file per screen lives under
`packages/ui/src/dev/fixtures/<screen>.fixtures.ts` and exports a
`fixtures: Fixture<unknown>[]`. A barrel `dev/fixtures/index.ts`
concatenates them.

The viewer renders:

- A left sidebar (sticky) with fixtures grouped by `group`, the active
  fixture highlighted; clicking switches the right pane.
- A right pane that mounts the active fixture's component inside a
  resizable wrapper (the wrapper exposes preset viewport sizes: 320×568
  iPhone SE, 390×844 iPhone 12+, 768×1024 iPad portrait, 1280×800
  desktop, plus "fit").
- A header bar with the active fixture title, group, and the viewport
  picker.

The active fixture is held in component state. URL sync is not in scope
for v1.

### Why not a separate Vite entry / Storybook?

- A separate entry (`screens.html`) ships a parallel page, but Vite's
  dev server still serves it; we'd need build-config carve-outs to keep
  it out of `dist/`. The dynamic-import approach achieves the same
  exclusion with one line of code and no extra build config.
- Storybook is heavyweight for our needs (one new top-level dependency,
  separate config tree, separate test runner). The fixture registry we
  need is < 200 LOC.

### Generating credible `GameSessionState` literals

The hardest part of the viewer is fixtures for `GameTableView`. They
need plausible `GameSessionState` shapes. Approach:

- Add `packages/ui/src/dev/fixtures/state-builders.ts` — pure helpers
  that build a `GameSessionState` from a small spec, using
  `@belote/core`'s `Card`, `Deck`, `Trick`, etc. constructors.
- Each `GameTableView` fixture calls a builder with the variant's
  parameters; the builder returns a frozen state.
- Builders live in the dev module, so they don't bloat the prod bundle.

## TDD plan

1. **`ScreenViewer.test.tsx`** — new file.
   - Mounts the viewer with an empty registry → renders an empty-state
     placeholder, no crash.
   - With one fixture → renders sidebar entry, mounts fixture by default,
     fixture's `render()` is called.
   - With two fixtures across two groups → both group headers render,
     clicking the second switches the active fixture.
   - Viewport picker buttons exist with correct accessible names; clicking
     applies the matching `width`/`height` to the preview wrapper.
2. **`fixtures.test.ts`** — new file.
   - Imports the real fixture registry; asserts every fixture has a
     unique `id`, a non-empty `title`, a non-empty `group`, and that
     calling `render()` does not throw.
   - This test alone gives every variant a render-without-crash baseline.
3. **`App.dev-mode.test.tsx`** — new file.
   - With `?screens` and `import.meta.env.DEV === true` (we set
     `window.history.replaceState` in the test), App renders only the
     viewer (no `<InstallPrompt />`, no `ModeSelectScreen`).
   - Without `?screens`, App renders the menu (regression check).
   - With `?screens` but `import.meta.env.DEV === false` (we mock the
     env), App still renders the menu (production safety).
4. **`production-bundle.test.ts`** — optional, deferred to iteration 018+
   if we don't have a production build step in CI yet. Skip for v1; the
   `import.meta.env.DEV` guard plus dynamic import is well-trodden.

CSS-only tweaks aren't unit-testable; verified by render tests staying
green plus manual run at `?screens` on dev.

## Files to touch

New files (TS / TSX):

- `packages/ui/src/dev/ScreenViewer/ScreenViewer.tsx`
- `packages/ui/src/dev/ScreenViewer/ScreenViewer.module.css`
- `packages/ui/src/dev/ScreenViewer/ViewportPicker.tsx`
- `packages/ui/src/dev/ScreenViewer/types.ts` — `Fixture` interface
- `packages/ui/src/dev/fixtures/index.ts` — barrel
- `packages/ui/src/dev/fixtures/startScreen.fixtures.tsx`
- `packages/ui/src/dev/fixtures/modeSelectScreen.fixtures.tsx`
- `packages/ui/src/dev/fixtures/onlineLobby.fixtures.tsx`
- `packages/ui/src/dev/fixtures/onlineRandomScreen.fixtures.tsx`
- `packages/ui/src/dev/fixtures/gameTableView.fixtures.tsx`
- `packages/ui/src/dev/fixtures/bidPanel.fixtures.tsx`
- `packages/ui/src/dev/fixtures/scorePanel.fixtures.tsx`
- `packages/ui/src/dev/fixtures/roundSummary.fixtures.tsx`
- `packages/ui/src/dev/fixtures/gameOver.fixtures.tsx`
- `packages/ui/src/dev/fixtures/chatPanel.fixtures.tsx`
- `packages/ui/src/dev/fixtures/chatButton.fixtures.tsx`
- `packages/ui/src/dev/fixtures/installPrompt.fixtures.tsx`
- `packages/ui/src/dev/fixtures/playerAvatar.fixtures.tsx`
- `packages/ui/src/dev/fixtures/trumpIndicator.fixtures.tsx`
- `packages/ui/src/dev/fixtures/state-builders.ts` — `GameSessionState`
  builders for the table fixtures.

Edited:

- `packages/ui/src/App.tsx` — query-param gate + lazy import.

Tests (new):

- `packages/ui/__tests__/ScreenViewer.test.tsx`
- `packages/ui/__tests__/fixtures.test.ts`
- `packages/ui/__tests__/App.dev-mode.test.tsx`

## Validation

- `pnpm test` — green; expected delta ≈ +30–50 tests (most from the
  fixtures-render-without-crash sweep).
- `pnpm typecheck` — clean.
- `pnpm lint` / `pnpm format:check` — delta clean.
- Manual: `pnpm --filter ui dev`, visit
  `http://localhost:5173/twistedFate-belote/?screens`, walk through
  every fixture at every viewport preset. Confirm no console errors and
  every fixture renders something.
- Manual: visit the same URL **without** `?screens` and confirm the
  menu still loads exactly as before.
- Manual (production safety): `pnpm --filter ui build && pnpm --filter
ui preview`, visit `?screens` against the preview server and confirm
  the menu shows (no viewer in prod).

## Carryforward — what iteration 018 / 019 inherit

- 018 (PWA path fix): trivially small. Touches `packages/ui/index.html`
  and the inline service-worker registration in the same file.
- 019 (menu visual makeover): consumes the screen viewer for ground
  truth. We'll iterate on `StartScreen` + `ModeSelectScreen` fixtures
  first, then redesign in place. The viewer's existence means we can
  also drop _new_ fixtures for transitional / WIP states without
  derailing the production menu.

## Notes on numbering

The repo carries old `iteration-017-report.md` … `iteration-045-report.md`
from the deleted PixiJS UI track (memory note dated 2026-05-04). The new
track has already overwritten 014 / 015 / 016 reports cleanly; this
iteration will overwrite `iteration-017-report.md` the same way when its
report lands.
