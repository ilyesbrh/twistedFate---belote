# Iteration 021 Report — Visible auth UI

**Date**: 2026-05-05
**Status**: Complete
**Test delta**: 786 → 833 (+47)

> Overwrites the pre-reset 021 report (board-game aesthetic) per the
> numbering-reset convention noted in CLAUDE.md.

## Goal

After 019 + 020 the user was silently a guest with no way to register
or log in via the UI. Iteration 021 surfaces the auth flow:
identity chip in the menu, login + signup screens, logout button.

## TDD trail

1. **`auth-api.test.ts`** (14 cases) → impl `auth/api.ts`. Typed
   wrappers around `/api/auth/{signup,login,logout,me,guest}` with a
   custom `AuthApiError` carrying the server's `error` code.
2. **`useAuth.test.tsx`** (7 cases) → impl `auth/useAuth.ts`. Hook
   owns `identity` / `status` / `error` state. On mount runs
   `apiMe()`; on 401, `apiGuest()`. `login` / `signup` / `logout`
   actions update state. `logout` re-mints a guest cookie so
   anonymous play stays available.
3. **`IdentityChip.test.tsx`** (9 cases) → impl `IdentityChip.tsx` +
   CSS. Cream-paper pill with terracotta accent, dropdown of auth
   actions; renders nothing while identity is null.
4. **`LoginScreen.test.tsx`** (9 cases) → impl `LoginScreen.tsx` +
   CSS. Email + password, error mapping via `auth/messages.ts`,
   submit on Enter, "Create an account" link.
5. **`SignupScreen.test.tsx`** (8 cases) → impl `SignupScreen.tsx` +
   CSS. Email + password (≥8) + nickname (1–32, trimmed), inline
   `email_taken` error, "Sign in instead" link.
6. **`auth/messages.ts`** (no tests — pure mapping) — friendly UI
   strings for every server `error` code.
7. **App + ModeSelectScreen wiring** — App calls `useAuth()` once,
   gates child rendering on `auth.status !== "loading"`,
   threads `identity` + auth handlers into the menu screen. The
   menu mounts the chip in a fixed top-right slot.
8. **`useOnlineLobby` refactor** — drops its own preflight
   `ensureSession()` effect; the App-level useAuth handles preflight
   so the cookie is guaranteed before the WS opens.

## Files added

```
packages/ui/src/auth/
  api.ts                          (typed fetch wrappers, AuthApiError)
  messages.ts                     (server-code → human-readable strings)
  useAuth.ts                      (App-level auth hook)
packages/ui/src/components/
  IdentityChip/IdentityChip.tsx + .module.css
  LoginScreen/LoginScreen.tsx + .module.css
  SignupScreen/SignupScreen.tsx + .module.css
packages/ui/__tests__/
  auth-api.test.ts                (14 cases)
  useAuth.test.tsx                (7 cases)
  IdentityChip.test.tsx           (9 cases)
  LoginScreen.test.tsx            (9 cases)
  SignupScreen.test.tsx           (8 cases)
```

## Files modified

- `packages/ui/src/App.tsx` — calls `useAuth()`, gates render on
  `auth.status === "ready"`, adds `"login"` / `"signup"` screen
  states, threads identity + handlers into ModeSelectScreen.
- `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx`
  - `.module.css` — accepts optional `identity` + auth-action props,
    renders the IdentityChip in a fixed top-right slot.
- `packages/ui/src/online/useOnlineLobby.ts` — drops the duplicate
  `ensureSession()` preflight effect (App-level useAuth owns the
  preflight). Connect happens immediately on mount; cookie is
  guaranteed by the parent's gating.
- `packages/ui/__tests__/OnlineLobby.test.tsx` — stub state grows
  `identity: null` to match the type.
- `packages/ui/vite.config.ts` — bumped `testTimeout` from 5s → 15s
  to accommodate occasional jsdom starvation under 833-test parallel
  load (a couple of unrelated tests had been flaking at the boundary).

## Trade-offs

- **`fireEvent.change` instead of `userEvent.type` in form-state
  tests.** `userEvent.type` is character-by-character async and
  occasionally interleaves keystrokes between inputs under heavy
  parallel load (saw a literal "uanltiecre2@..." mash-up of two test
  inputs in one run). `fireEvent.change` sets the value directly —
  fast, deterministic, no interleaving. The submit-on-click and
  enter-on-submit tests still use `userEvent.click` / `userEvent.keyboard`.
- **Manual `e.preventDefault()` typing.** ESLint's
  `@typescript-eslint/no-deprecated` flags React's `FormEvent` as
  "deprecated"; replaced with the structurally-typed
  `(e: { preventDefault: () => void }) => void`. Less specific but
  ESLint-clean and equally safe at the call site.
- **App gates render on `auth.status === "ready"`.** The screen
  flashes black for ~1 fetch RTT on first load. Simpler than a
  spinner; if the perceived latency ever bothers a user, replace
  the bare `null` with a tiny splash.
- **`<details>`-style dropdown rejected.** Used a custom button +
  conditional menu so `data-testid` attributes are easier to
  attach. Outside-click closure is a synthetic `pointerdown` listener
  on `window`.

## Validation

- `pnpm test` — **833 / 833 green** (was 786; +47 = 14 + 7 + 9 + 9 + 8).
- `pnpm typecheck` — clean.
- `pnpm format:check` — clean.
- `pnpm lint` — **177 problems vs 188 baseline → delta-clean (−11)**.
- `pnpm --filter ui exec vite build` — clean production build, 375 modules.

## Browser smoke (deferred to live URL)

Will verify on `https://belote.3btechsolutions.com/` after deploy:

1. Open the menu, see "Guest-XXXX" pill in the top-right.
2. Click pill → menu opens → "Create account" → SignupScreen.
3. Fill email / password / nickname → submit → back at menu, pill says "Alice".
4. Click pill → "Sign out" → pill flips back to a fresh "Guest-XXXX".
5. Click pill → "Sign in" → fill credentials → "Alice" again.
6. Refresh → cookie persists, still "Alice".
7. Network tab: `Set-Cookie: belote.sid` present on signup/login/guest.

## Carryforward to iteration 022

- **Match history schema** — new `matches` + `match_seats` tables.
  Game-end transition in `@belote/core` emits a `match_completed`
  event the gateway records into the DB. Records the `userId` /
  `guestId` from `ClientContext` (already attached after 020).
- **History page UI** — new `HistoryScreen` listing past matches:
  date, partners, opponents, final score, win/loss badge.
- **IdentityChip menu gets a "View history" link** for users.
- **Friends backend (023)** — schema, request/accept routes, online
  presence via the gateway's existing connection registry.
- **Friends UI (023)** — friends panel in the menu, "invite friend
  to room" button, online indicator.
- **Profile page (024)** — readonly first; editable nickname + avatar
  later.
