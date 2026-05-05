# Iteration 021 — Visible auth UI

> Third iteration of the "real backend" track. The first one with
> user-facing change. After 019 + 020 the user is silently a guest;
> after 021 they can register an account, log in, log out, and see
> who they are. Match history (originally 021) moves to 022.

## Goal

1. **Auth API client** in the UI: typed wrappers around
   `/api/auth/{signup,login,logout,me,guest}`.
2. **`useAuth` hook** at App level — owns identity state, exposes
   `login` / `signup` / `logout` actions, runs `ensureSession()` on
   mount. Single source of truth for identity in the React tree.
3. **`<IdentityChip>`** — small pill in the top-right of the menu.
   Shows current identity ("Alice" or "Guest-abcd"). Click opens a
   menu: Sign in / Create account when guest; Sign out when user.
4. **`<LoginScreen>`** — email + password form, "Don't have an
   account?" link to signup. Inline error states (wrong password,
   server unreachable). Submit on Enter. Loading state on the button.
5. **`<SignupScreen>`** — email + password + nickname form, "Already
   have an account?" link to login. Same validation parity with the
   server (email format, password ≥ 8, nickname ≥ 1 ≤ 32). Inline
   `email_taken` error on the email field.
6. **App routing** — new screens `"login"` and `"signup"` alongside
   the existing `menu` / `ai` / `online` / `random`. Successful
   login/signup → menu. Logout → menu (cookie cleared, ensureSession
   re-mints a guest cookie automatically).
7. **`useOnlineLobby` refactor** — drops its own `ensureSession`
   preflight; receives the resolved identity as a parameter from the
   App-level hook. Avoids two `/me` calls per page-load.

What this iteration does **not** ship: profile page, match history
recording, friends, password reset, OAuth, email verification.

## Decisions

| Decision                                          | Choice                                                                                              | Why                                                                                                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity state lives at App level, not in lobby   | A `useAuth()` hook is called once in `App` and the result threaded to `useOnlineLobby`              | Single source of truth, avoids two parallel preflight `/me` calls (one from useAuth, one from useOnlineLobby), matches what every later iteration will read from.                                                          |
| Login/signup as full screens, not modals          | `setScreen("login")` / `setScreen("signup")`                                                        | Mobile-first; full-bleed forms beat cramped modals on phones. Easier to nail focus/validation states without overlay z-index fights. Matches existing screen-pattern (StartScreen, OnlineLobby, etc.).                     |
| `<IdentityChip>` lives in `ModeSelectScreen` only | Mounts in the menu's header slot                                                                    | Other screens are tightly designed; threading a chip through every game-screen is invasive and not the user's primary need. Iteration 023 (or later) can add a header chrome to other screens once we know what they need. |
| Logout re-mints a guest                           | `useAuth.logout()` calls `/logout`, then `ensureSession()` again to mint a fresh guest cookie       | Keeps anonymous play available immediately after sign-out without a refresh.                                                                                                                                               |
| No client-side route paths                        | We stay with `screen` state (string discriminator), not `react-router`                              | The app already uses this pattern. URL paths for /login etc. would need a router and shareable-link semantics we don't currently have. Adding a router is a separate iteration.                                            |
| Validation parity with server                     | Same email regex, same password length, same nickname length. Errors come pre-formatted from server | Server errors win as ground truth (`{ error: "weak_password" }`, etc.); client-side validation is just an early-exit UX nicety. The form maps `error` codes to user-friendly strings.                                      |
| `IdentityChip` dropdown is a `<details>` element  | Use semantic disclosure, not custom popper                                                          | One-line element with built-in accessibility (`aria-expanded`, keyboard, click-outside-to-close via `details`'s native semantics with a tiny synthetic outside-click handler). No popper lib.                              |
| Tests are wired through `vi.stubGlobal("fetch")`  | Same pattern as `ensureSession.test.ts`                                                             | Already proven, no MSW dep, fast.                                                                                                                                                                                          |

## Files to add / touch

### New: `packages/ui/src/auth/`

| File         | Purpose                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.ts`     | Typed wrappers: `apiSignup`, `apiLogin`, `apiLogout`, `apiMe`, `apiGuest`. Each parses body shape and throws a typed `AuthApiError` with the server code. |
| `useAuth.ts` | Hook: returns `{ identity, status, error, login, signup, logout, refresh }`. Owns the React state.                                                        |

### New: `packages/ui/src/components/IdentityChip/`

| File                      | Purpose                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `IdentityChip.tsx`        | The chip + dropdown. Props: `identity`, `onSignIn`, `onSignUp`, `onSignOut`.            |
| `IdentityChip.module.css` | Cream-paper pill, ink border, terracotta accent on hover, mobile-friendly touch target. |

### New: `packages/ui/src/components/LoginScreen/`

| File                     | Purpose                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `LoginScreen.tsx`        | Form with email + password, error display, "Sign up instead" link. |
| `LoginScreen.module.css` | MenuFelt background, form sized for mobile + desktop.              |

### New: `packages/ui/src/components/SignupScreen/`

| File                      | Purpose                                |
| ------------------------- | -------------------------------------- |
| `SignupScreen.tsx`        | Form with email + password + nickname. |
| `SignupScreen.module.css` | Same skin as LoginScreen.              |

### Modified

| File                                                                               | Change                                                                                                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/App.tsx`                                                          | Calls `useAuth()` once. Passes `identity` + handlers to `ModeSelectScreen` and `OnlineFlow`/`OnlineRandomFlow`. New screen states `"login"` and `"signup"`.         |
| `packages/ui/src/components/ModeSelectScreen/ModeSelectScreen.tsx` + `.module.css` | Adds optional `identity` + auth-action props. Renders `<IdentityChip>` in the top-right; absolute-positioned, escapes the centered content column.                  |
| `packages/ui/src/online/useOnlineLobby.ts`                                         | Drops its own `ensureSession` preflight. Receives `identity` as an argument. The preflight from useAuth is the one that mints the guest cookie before any WS opens. |

### Tests

| File                                          | Cases                                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/__tests__/auth-api.test.ts`      | Each route: 200/error/network. Body parsing. AuthApiError carries server `code`.                                                          |
| `packages/ui/__tests__/useAuth.test.tsx`      | Initial preflight resolves identity. login() updates identity. logout() clears + re-mints guest. error states. Concurrent calls coalesce. |
| `packages/ui/__tests__/IdentityChip.test.tsx` | Renders user nickname; renders Guest-…; user dropdown shows "Sign out"; guest dropdown shows "Sign in" + "Sign up"; click handlers fire.  |
| `packages/ui/__tests__/LoginScreen.test.tsx`  | Renders form; submit empty → disabled; valid → calls onLogin; error displayed; "Sign up" link calls onGotoSignup.                         |
| `packages/ui/__tests__/SignupScreen.test.tsx` | Same shape; weak password / invalid email shows inline error; calls onSignup with trimmed inputs.                                         |
| `packages/ui/__tests__/OnlineLobby.test.tsx`  | Stub `OnlineLobbyState` no longer holds `identity` directly (move to outer scope) — adjust per refactor.                                  |

## TDD plan

Order:

1. **`auth-api.test.ts`** → impl `auth/api.ts`. Smallest seam.
2. **`useAuth.test.tsx`** → impl `auth/useAuth.ts`. Stubs `fetch`; uses `renderHook` from `@testing-library/react`.
3. **`IdentityChip.test.tsx`** → impl `IdentityChip.tsx` + CSS. Pure presentational, easy.
4. **`LoginScreen.test.tsx`** → impl `LoginScreen.tsx` + CSS.
5. **`SignupScreen.test.tsx`** → impl `SignupScreen.tsx` + CSS.
6. **App refactor** — wire useAuth, screen states, lobby refactor. Adjust existing `OnlineLobby.test.tsx` stub.
7. **Manual browser smoke**: dev server, click through guest → sign up → log out → sign in → log out. Check `IdentityChip` reflects every step. Watch DevTools Network tab to confirm cookies update.

## Out of scope

- Profile page (`/api/users/:id`) — moves to 023.
- Match history — moves to 022.
- Friends — moves to 024.
- Password reset, magic links, OAuth — much later.
- URL-based routing (`/login`, `/signup`) — would need react-router; not now.
- Header chrome on `OnlineLobby` / `GameTable` — only the menu shows the chip in this iteration.

## Validation

- `pnpm test` — green. Expected delta ≈ +35.
- `pnpm typecheck` — clean.
- `pnpm format:check` — clean.
- `pnpm lint` — delta-clean over baseline (188).
- **Manual browser smoke** (this iteration is the first with real visual change, so this is mandatory):
  1. Open the app, see `IdentityChip` show "Guest-abcd" in the menu top-right.
  2. Click chip → menu pops → click "Create account" → SignupScreen.
  3. Fill in email / password / nickname → submit → routed back to menu, chip now shows "Alice".
  4. Click chip → click "Sign out" → chip shows a fresh "Guest-…" again, no flicker.
  5. Click chip → click "Sign in" → fill credentials → submit → "Alice" again.
  6. Refresh the page → chip still shows "Alice" (cookie persists).
  7. Open DevTools → Network → confirm `Set-Cookie: belote.sid=…` on signup, login, guest mint; cleared on logout.
  8. Watch console for errors — should be silent.

## Carryforward to iteration 022

- Match history reads identity from `useAuth.identity` for the "my games" page.
- Once iteration 023 lands the profile page, `IdentityChip` should also link to it.
- The cream-paper / terracotta tokens used by `IdentityChip` carry over to the friends panel and history rows in 022/023/024.
