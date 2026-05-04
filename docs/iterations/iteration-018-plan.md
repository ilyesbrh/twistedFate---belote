# Iteration 018 — PWA path fix (doubled base prefix)

## Goal

Fix the manifest / favicon / apple-touch-icon hrefs in
`packages/ui/index.html` so the production page loads them at the
correct URL. Today they resolve to a doubled-prefix path
(`/twistedFate-belote/twistedFate-belote/manifest.json`) and the
browser logs a manifest-syntax-error to the console. PWA install is
broken until that's fixed.

This is a small, surgical iteration — one HTML file edited, one
regression test, no behaviour change beyond restoring expected URLs.

## Root cause

`packages/ui/vite.config.ts` sets `base: "/twistedFate-belote/"`. At
build / dev time, Vite's HTML transform prepends `base` to every
absolute path it finds in `<link href="…">`, `<script src="…">`,
`<img src="…">`, etc. The current source already includes the prefix
literally:

```html
<link rel="manifest" href="/twistedFate-belote/manifest.json" />
```

so Vite's prepend produces:

```html
<link rel="manifest" href="/twistedFate-belote/twistedFate-belote/manifest.json" />
```

Confirmed live in the dev server console (during iteration 017's
browser smoke):

> Manifest: Line: 1, column: 1, Syntax error. @
> http://localhost:5173/twistedFate-belote/twistedFate-belote/manifest.json:0

## Fix

Switch to bare project-root paths in the HTML; let Vite's `base`
prepend the prefix once. This is the idiomatic Vite pattern.

```html
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
```

The inline service-worker registration is a different case: it's a
plain JS string literal (`navigator.serviceWorker.register("/twistedFate-belote/sw.js")`)
that Vite does **not** transform. So the SW registration is currently
correct and works at runtime — but the literal `"/twistedFate-belote/"`
pin is fragile (any future base change has to be remembered in two
places). Replace it with `import.meta.env.BASE_URL + "sw.js"` so the
SW URL is computed from Vite's base config.

## Out of scope

- Changing the deploy `base` or adopting hash routing.
- Adding a real PWA install-prompt redesign — InstallPrompt UX is
  unchanged here.
- Wiring the production-build-output check into CI (could come later
  with the pixel-diff suite).

## TDD plan

The bug is a build-time HTML transform side-effect, so a vitest unit
test against the source string isn't enough — we need to assert what
Vite actually emits.

Approach: a unit test in `packages/ui/__tests__/index-html.test.ts`
that:

1. Reads `packages/ui/index.html` source.
2. Reads `packages/ui/vite.config.ts` and extracts the `base` value
   (or hard-codes it after asserting it's still `"/twistedFate-belote/"`).
3. Simulates Vite's HTML asset-URL prepending: every absolute `href`
   / `src` in `<link>` / `<script>` / `<img>` should already start
   with `/` and **NOT** start with `${base}` (because that would
   double after Vite prepends).
4. Asserts the inline `serviceWorker.register(...)` URL uses
   `import.meta.env.BASE_URL` rather than a literal prefix.

Specifically the test asserts:

- No occurrence of `/twistedFate-belote/twistedFate-belote/` in the
  source HTML (defensive — guards against re-introducing the bug
  literally).
- No `<link>` / `<script>` / `<img>` `href`/`src` attribute starts
  with `/twistedFate-belote/`.
- The SW registration line contains `import.meta.env.BASE_URL` and
  does **not** contain the literal `/twistedFate-belote/sw.js`.

Tests run before the fix → red. After the fix → green.

## Files to touch

- `packages/ui/index.html` — fix four `<link>` href values + the inline
  SW registration.
- `packages/ui/__tests__/index-html.test.ts` (new) — regression test.

## Validation

- `pnpm test` — green; expected delta ≈ +3 tests (one assertion each
  for source-prefix, attribute-prefix, SW BASE_URL).
- `pnpm typecheck` — clean.
- `pnpm lint` / `pnpm format:check` — delta clean.
- Manual: `pnpm --filter ui dev`, visit
  `http://localhost:5173/twistedFate-belote/`. Open DevTools console.
  Expected: no manifest syntax error. Expected: `Application` panel >
  `Manifest` shows `Belote — TwistedFate` with the correct icon.
- Manual production: `pnpm --filter ui build && pnpm --filter ui preview`
  and confirm the same — no doubled prefix in any network request.

## Carryforward

- Wire the production-build-output assertion (parse `dist/index.html`
  after `vite build`, fail if `/twistedFate-belote/twistedFate-belote/`
  appears) into CI when the screenshot-diff suite lands.
- Iteration 019 (menu visual makeover) consumes the screen viewer from
  iteration 017; PWA install is now actually testable on a phone.
