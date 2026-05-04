# Iteration 017 Report — Screen Viewer (dev mode)

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 687 → 702 (+15)

## Goal

Add a dev-only mode that renders every UI screen × variant in isolation,
without booting a real `GameSession` or talking to the server. Acts as
ground-truth surface for redesign work (iteration 019) and a permanent
manual-QA tool.

## TDD trail

Three red→green cycles, in order:

1. **`ScreenViewer` skeleton** — wrote `ScreenViewer.test.tsx` with 7
   tests: empty registry, single fixture, grouped fixtures, sidebar
   click switches active fixture, viewport picker presence, viewport
   click applies dimensions, header reflects active fixture title.
   Initial run: red (module missing). Implemented `types.ts` (Fixture
   interface, VIEWPORT_PRESETS), `ScreenViewer.tsx`, module CSS. After
   one iteration on a `getByText` ambiguity (group header vs active
   group span), all 7 green.

2. **App.tsx dev-mode gate** — wrote `App.dev-mode.test.tsx` with 3
   tests: without `?screens` shows menu, with `?screens` + DEV true
   mounts ScreenViewer (lazy), with `?screens` + DEV stubbed false
   shows menu. Implemented `lazy(() => import("./dev/ScreenViewerHost.js"))`
   plus `shouldRenderDevScreens()` guard in App.tsx. All 3 green.

3. **Fixture registry sweep** — wrote `fixtures.test.tsx` with 5
   property tests over the registry: at least one fixture, non-empty
   id/title/group, unique ids, kebab-case ids, and a render-without-crash
   sweep that mounts every fixture inside a Radix `<Theme>` wrapper.
   Built the fixtures incrementally (simple → medium → complex) and
   re-ran the sweep after each batch to catch issues fast.

## Architecture

- **Lazy gate.** `App.tsx` mounts the screen viewer only when
  `import.meta.env.DEV` is true and `?screens` is present in the URL.
  The viewer is loaded via `React.lazy(() => import(...))`, so the
  production bundle never even references the dev module's runtime.
- **Fixture registry.** Each component has its own
  `<name>.fixtures.tsx` file; the barrel `dev/fixtures/index.ts`
  concatenates them into a flat `readonly Fixture[]`. Adding a new
  fixture is one append in the relevant file plus the barrel import.
- **State builders.** The hardest part — credible `GameSessionState`
  literals for `<GameTableView>` — lives in
  `dev/fixtures/state-builders.ts`. Builders compose a baseline
  state from realistic players + hands + bidding round + contract,
  then accept overrides. Six builders cover bidding (any seat),
  bidding mid-auction, playing mid-trick, playing end-of-trick,
  playing on human turn, playing with belote bubble.

## Files

### New (TS / TSX)

- `packages/ui/src/dev/ScreenViewer/types.ts` — `Fixture` interface, `VIEWPORT_PRESETS`.
- `packages/ui/src/dev/ScreenViewer/ScreenViewer.tsx` — sidebar + main pane + viewport picker.
- `packages/ui/src/dev/ScreenViewer/ScreenViewer.module.css`.
- `packages/ui/src/dev/ScreenViewerHost.tsx` — default export pairing viewer + live registry.
- `packages/ui/src/dev/fixtures/index.ts` — barrel.
- `packages/ui/src/dev/fixtures/startScreen.fixtures.tsx` (2 fixtures).
- `packages/ui/src/dev/fixtures/modeSelectScreen.fixtures.tsx` (1).
- `packages/ui/src/dev/fixtures/onlineLobby.fixtures.tsx` (7).
- `packages/ui/src/dev/fixtures/onlineRandomScreen.fixtures.tsx` (4).
- `packages/ui/src/dev/fixtures/gameTableView.fixtures.tsx` (9).
- `packages/ui/src/dev/fixtures/bidPanel.fixtures.tsx` (4).
- `packages/ui/src/dev/fixtures/scorePanel.fixtures.tsx` (5).
- `packages/ui/src/dev/fixtures/roundSummary.fixtures.tsx` (6).
- `packages/ui/src/dev/fixtures/chatPanel.fixtures.tsx` (2).
- `packages/ui/src/dev/fixtures/gameOver.fixtures.tsx` (3).
- `packages/ui/src/dev/fixtures/chatButton.fixtures.tsx` (4).
- `packages/ui/src/dev/fixtures/trumpIndicator.fixtures.tsx` (4).
- `packages/ui/src/dev/fixtures/playerAvatar.fixtures.tsx` (6).
- `packages/ui/src/dev/fixtures/state-builders.ts` — `GameSessionState` builders.

### Modified

- `packages/ui/src/App.tsx` — added `lazy` import, `ScreenViewerHost`
  lazy import, `shouldRenderDevScreens()` guard, and the early-return
  `Suspense` block. **18 net lines added**, no behavioural change to
  the menu / AI / online / random paths.

### Tests (new)

- `packages/ui/__tests__/ScreenViewer.test.tsx` — 7 tests.
- `packages/ui/__tests__/App.dev-mode.test.tsx` — 3 tests.
- `packages/ui/__tests__/fixtures.test.tsx` — 5 tests.

### Coverage

**57 fixtures** across 13 groups, all rendering without crash in jsdom +
manually verified in the browser.

## Validation

| Check                                 | Result                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                           | 33 files / 702 tests passing (+15 over baseline 687)                                                                                               |
| `pnpm typecheck`                      | Clean                                                                                                                                              |
| `pnpm lint`                           | 187 errors (baseline 184, delta +3 — all parsing errors of the same form every existing test file produces; no fixable per-line errors introduced) |
| `pnpm format:check` (iteration scope) | Clean on every file authored or edited by this iteration                                                                                           |

### Manual smoke (browser)

- `pnpm --filter ui dev` → `http://localhost:5173/twistedFate-belote/?screens`.
- Sidebar lists all 13 groups with all 57 fixtures; clicking switches
  the active fixture; viewport picker switches presets.
- `GameTableView "Playing — mid-trick"` renders the felt, two trick
  cards (♥10 over ♥K), the south hand, north avatar with VIP badge,
  and the score panel — visually identical to the AI mode.
- Verified `?` (no `?screens`) still loads the menu unchanged.
- Two pre-existing console errors observed (PWA manifest doubled
  prefix `…/twistedFate-belote/twistedFate-belote/manifest.json`) —
  these are the bug iteration 018 will fix; not introduced here.

### Bug found and fixed mid-iteration

- **Position-fixed leak** — fixtures with `position: fixed` (e.g.
  `StartScreen.overlay`, `GameOver.overlay`) escaped the preview pane
  and covered the sidebar, breaking interaction. Fixed by adding
  `transform: translateZ(0)` to `.stage`, which makes the stage box a
  containing block for fixed-position descendants. Caught by the
  in-browser smoke check, not by unit tests (jsdom has no layout
  engine).

## Lint delta-clean note

The +3 lint errors are `Parsing error: was not found by the project
service` for the three new test files. Every existing test file in the
repo (BidPanel, ChatButton, ChatPanel, GameOver, InstallPrompt,
ModeSelectScreen, OnlineLobby, OnlineRandomScreen, PlayerAvatarBubble,
RoundSummary, ScorePanel, StartScreen, gameMessages, setup) produces
the identical parsing error today — the project's eslint setup doesn't
include test files in any tsconfig the project service can find. Fixing
this is a project-config-scope task: add a
`packages/ui/tsconfig.test.json` that includes `__tests__/**/*` and add
it to the eslint `parserOptions.projectService.allowDefaultProject`
list (or to `references`). Logged in carryforward.

## Out-of-scope items I noticed

1. **PWA double-prefix bug** — confirmed in the dev console
   (`/twistedFate-belote/twistedFate-belote/manifest.json`). Iteration 018.
2. **InstallPrompt fixture** — listed in the original plan but
   skipped; the component is internally stateful (waits for a real
   `beforeinstallprompt` event before rendering anything visible) and
   would need either a prop refactor or a fixture that fires the event
   on mount. Not worth doing without changing the component. Carry to
   a future iteration if/when InstallPrompt's UI gets touched.
3. **Project-wide test tsconfig** — see lint delta-clean note above.

## Carryforward

### Next iteration (018) — PWA path fix

**Scope**: small, focused, ~1 file. Update
`packages/ui/index.html` to remove the `/twistedFate-belote/` prefix
from `manifest.json`, `apple-touch-icon`, `icon.svg`, `icon-192.png`
references — let Vite's `base: "/twistedFate-belote/"` config prepend
the path at build time. Same for the inline service-worker registration
(`navigator.serviceWorker.register("/twistedFate-belote/sw.js")` →
`import.meta.env.BASE_URL + "sw.js"`). Add a build-output regression
test that asserts the dist `index.html` has no doubled prefix.

### Iteration 019 — menu visual makeover

**Scope**: redesign `StartScreen` + `ModeSelectScreen`. The screen
viewer landed in this iteration is the working surface — every visual
state of every screen is reachable via `?screens` while iterating, so
the redesign loop is "edit CSS, refresh screen viewer". Drop new
in-progress fixtures into `dev/fixtures/` for any transitional states
without disturbing production.

### Iteration 020+ — pixel-diff regression suite (deferred)

The fixture registry is now a working catalogue. Wiring Playwright
screenshot diffs into CI becomes feasible: render every fixture at
two viewport sizes, compare against committed PNGs, fail on
significant delta. Not part of 018/019 path.
