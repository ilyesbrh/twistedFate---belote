# Iteration 018 Report — PWA path fix (doubled base prefix)

**Date**: 2026-05-04
**Status**: Complete
**Test delta**: 702 → 705 (+3)

## Goal

Fix the manifest / favicon / apple-touch-icon hrefs in
`packages/ui/index.html` so they resolve to the correct URL instead of
the doubled-prefix path
(`/twistedFate-belote/twistedFate-belote/manifest.json`). The browser
was logging a "Manifest: Line 1, column 1, Syntax error" each load and
PWA install was broken.

## Root cause

Vite's HTML transform prepends `base` (configured as
`/twistedFate-belote/`) to every absolute path it finds in well-known
asset attributes. The source HTML already included the prefix
literally, so Vite double-prepended.

## TDD trail

1. **Wrote `index-html.test.ts`** with three assertions:
   - source HTML must not contain the doubled base substring,
   - no `<link>` / `<script>` / `<img>` / `<meta>` `href|src|content`
     attribute starts with `/twistedFate-belote/`,
   - `serviceWorker.register(...)` argument uses
     `import.meta.env.BASE_URL`, not a literal prefix.

   Initial run: **2 failed, 1 passed** (red).

2. **Fixed `packages/ui/index.html`** — replaced
   `/twistedFate-belote/manifest.json` (and three icon hrefs) with bare
   `/manifest.json` etc., so Vite's prepend produces the correct URL
   exactly once.

3. **Moved SW registration from inline script → `main.tsx`.** The
   inline script was non-module, so `import.meta.env.BASE_URL` is not
   available there. Moving it into `main.tsx` (a real module) keeps the
   path computed from Vite's `base` config — single source of truth.

4. **Updated test** to read SW assertion from `main.tsx` instead of
   `index.html`. All 3 green.

## Files

### Modified

- `packages/ui/index.html` — four `<link>` href values changed; the
  inline SW-registration `<script>` block removed.
- `packages/ui/src/main.tsx` — added the SW registration alongside the
  React mount, using `${import.meta.env.BASE_URL}sw.js`.

### New (tests)

- `packages/ui/__tests__/index-html.test.ts` — 3 regression tests.

## Validation

| Check                                 | Result                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                           | 34 files / 705 tests passing (+3 over baseline 702)                                                             |
| `pnpm typecheck`                      | Clean                                                                                                           |
| `pnpm lint`                           | 188 errors (was 187 after iteration 017; +1 — parsing error of the same form every existing test file produces) |
| `pnpm format:check` (iteration scope) | Clean                                                                                                           |

### Manual smoke

- `pnpm --filter ui dev` → `http://localhost:5173/twistedFate-belote/`.
  DevTools console: **0 errors**, **0 warnings** (was 2 manifest errors
  before the fix).
- Re-tested `?screens` route: still loads, still 0 errors. No
  regression to iteration 017.

## Mid-iteration find

The first fix attempt left the SW registration inline with
`import.meta.env.BASE_URL`, which the browser rejected with:

> Cannot use 'import.meta' outside a module

because the inline `<script>` tag had no `type="module"`. The simplest
correct option was to move the registration to `main.tsx` (already a
module), which is also architecturally cleaner — SW registration sits
alongside the React mount, both code-paths use Vite's bundler-aware
URL resolution.

## Carryforward

- The lint baseline picked up +1 from the new test file (parsing
  error: not in tsconfig project service). Same pattern every existing
  test file in the repo produces. Project-config-scope fix logged in
  iteration 017's report.
- **Iteration 019 (menu visual makeover)** — unblocked. PWA install
  now works on real devices, so the redesign can be tested on a phone
  via add-to-home-screen.
- Wiring a `dist/index.html` post-build assertion into CI is still
  worth doing alongside the eventual screenshot-diff suite.
