# Contributing to Belote — TwistedFate

Thanks for taking the time to read this. The project moves quickly through
small, well-tested iterations; the rules below exist to keep that pace
sustainable. They are non-negotiable, but they're also short — read them once
and you have everything you need.

This doc has three parts:

1. [**Contribution guidelines**](#1-contribution-guidelines) — how to propose, build, and land a change.
2. [**Code guidelines**](#2-code-guidelines) — TS / React / CSS / tests style.
3. [**Architecture guidelines**](#3-architecture-guidelines) — package layers, dependency direction, naming.

Authoritative companions:

- [`docs/VISION.md`](docs/VISION.md) — long-term platform vision (multi-game).
- [`docs/MANIFESTO.md`](docs/MANIFESTO.md) — foundational principles
  (mobile-first, TDD, frontend-agnostic core). Ignore parts that mention
  PixiJS / `THEME`; those reference the pre-rebuild UI track and are kept
  for historical context only.
- [`docs/REVIEW_PROTOCOL.md`](docs/REVIEW_PROTOCOL.md) — the four-role review
  framework (PO → Architect → Reviewer → Tester) used when a review is
  explicitly requested.
- [`docs/GAME_RULES.md`](docs/GAME_RULES.md) — Tunisian Belote rules; the
  PO source of truth for gameplay decisions.
- [`docs/iterations/`](docs/iterations/) — one plan + one report per
  iteration. Browse to see how every feature was built.

---

## 1. Contribution guidelines

### Before you start

- **Pick the smallest scope you can defend.** "Random matchmaking" is a good
  iteration; "online play" isn't — too big.
- **Write a plan first.** `docs/iterations/iteration-NNN-plan.md` — goal,
  out-of-scope, architecture sketch, TDD order, files to touch, validation
  criteria. The plan exists so reviewers can disagree with the _plan_ before
  you've written the code.
- **Strict TDD.** Tests are written before implementation, in a red-then-green
  cycle. Confirm the red phase by running the tests; don't commit a green
  step that was never red.
- **Forward planning.** Every iteration report defines the next iteration
  (N+1) and sketches N+2. This keeps the roadmap live and prevents drift.

### Local setup

```bash
# Prerequisites: Node ≥ 20, pnpm ≥ 10
pnpm install
pnpm test          # baseline must be green before you start
pnpm typecheck
```

Solo mode: `pnpm --filter ui dev` then visit
`http://localhost:5173/twistedFate-belote/`. Online modes also need
`pnpm --filter @belote/server dev` (default port 4100).

### Iteration lifecycle

Every change follows the same five-phase loop. Don't reorder.

1. **Plan** — write the iteration plan in `docs/iterations/`.
2. **TDD red** — write failing tests for the behaviour you want.
3. **Implement** — minimum code to turn tests green.
4. **Refactor** — keep tests green; remove duplication, name things.
5. **Document + commit** — write the iteration report; one feat commit per
   iteration that references the iteration number.

### The four checks

A change is not done until **all four** pass locally:

```bash
pnpm test
pnpm typecheck
pnpm lint            # delta-clean: don't add new errors over baseline
pnpm format:check    # delta-clean
```

The current `lint` baseline is partly broken (pre-existing typed-rule
violations in some legacy components). That's tracked as its own iteration.
Your contribution must be **delta-clean** — no new lint errors over baseline,
ideally fewer.

### Branch + commit + PR

- Branch off `main`. One branch per iteration.
- One feat commit per iteration. Subject line carries the iteration number:

  ```text
  feat: iteration NNN — short description

  Body: what changed, why, test delta, lint/format delta.
  Co-Authored-By: ... (when AI-assisted)
  ```

- Don't squash unrelated changes. If you find a pre-existing bug while
  doing iteration N, fix it in a separate commit (preferably its own
  iteration) so the diff for N stays focused.
- Don't `--amend` published commits. Create a new commit on top.
- Don't skip git hooks (`--no-verify`) or signing.
- Open a PR against `main`. The PR description should link the iteration
  plan + report and summarise the test delta.

### Out-of-scope situations

- **Found a bug while doing something else?** Note it, finish your iteration,
  open a separate iteration for the fix.
- **Want to refactor a related file?** Don't fold it into a feature commit.
  Pure refactors get their own iteration.
- **Tempted to skip a test for "obvious" code?** Don't. The test exists so a
  future reader can understand the contract without re-deriving it.

### Asking for review

Reviews use the four-role framework documented in
[`docs/REVIEW_PROTOCOL.md`](docs/REVIEW_PROTOCOL.md). Run the roles in
strict order: Product Owner → Architect → Expert Code Reviewer → Tester.
Each role produces concrete findings. Fixes must address **root causes**,
not symptoms.

---

## 2. Code guidelines

### TypeScript

- Strict mode, every package. ES2022 target. ESM (`"type": "module"`).
- Imports use the `.js` extension even when the source is `.ts`:

  ```ts
  import { GameSession } from "./session.js";
  ```

- Prefer `interface` for object shapes you'll extend or implement, `type`
  for unions, intersections, and aliases.
- No `any`. No unjustified `as` casts. If you must cast, leave a one-line
  comment explaining the invariant the cast relies on.
- Discriminated unions over enums for protocol-shaped types — see
  [`packages/protocol/src/index.ts`](packages/protocol/src/index.ts).
- `readonly` on every object property unless mutation is part of the
  contract.

### Naming

| Thing                 | Convention                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Files (TS)            | `kebab-case.ts` for utility modules; `PascalCase.tsx` for React components in their own dir (e.g. `BidPanel/BidPanel.tsx`) |
| Types / interfaces    | `PascalCase`                                                                                                               |
| Functions / variables | `camelCase`                                                                                                                |
| Constants             | `UPPER_SNAKE_CASE` for primitives; `camelCase` for frozen objects                                                          |
| Test files            | Sibling to the package's `__tests__/` dir, `<module>.test.ts(x)`                                                           |
| `data-testid`         | `kebab-case`, descriptive. `data-testid="random-find-btn"`                                                                 |
| ARIA labels           | Plain English imperatives. `aria-label="Find a random game"`                                                               |

### Exports

- Each package has a barrel `src/index.ts`. **Separate** value exports from
  type exports:

  ```ts
  export { GameSession, createPlaceBidCommand } from "./session.js";
  export type { GameEvent, GameState } from "./session.js";
  ```

- Don't deep-import across package boundaries. If consumers need it, add it
  to the barrel.

### React

- Function components with explicit return type:
  `function Foo(props: FooProps): ReactElement { … }`.
- Props interface on every component. Callbacks use property syntax, not
  method shorthand:

  ```ts
  // Yes
  readonly onFind: (nickname: string) => void;
  // No (triggers @typescript-eslint/unbound-method on consumers)
  onFind(nickname: string): void;
  ```

- Hooks live in `packages/ui/src/online/` (cross-cutting state) or
  alongside the component that owns them. One hook per file.
- No `useEffect` for derived state — compute it inline or via `useMemo`.
- A11y is mandatory. Every interactive control gets:
  - An accessible name (`aria-label` if the visible text is an icon /
    glyph; otherwise the visible text is enough).
  - A stable `data-testid`.
  - `data-touch="primary"` on primary CTAs (the global rule in
    `index.css` enforces a 44 × 44 hit target + a press transform).

### CSS

- CSS Modules (`*.module.css`) per component, no global CSS unless it's a
  truly cross-cutting concern (see `packages/ui/src/index.css` and
  `packages/ui/src/styles/tokens.css`).
- Design tokens live in `packages/ui/src/styles/tokens.css`. Add new tokens
  there before consuming them. Don't hardcode pixel values you'll need
  twice.
- Mobile-first. Default styles target the smallest screen; media queries
  layer on tablet / landscape-phone / desktop overrides.
- Use `clamp(min, preferred, max)` for fluid typography and spacing where
  the value should scale with the viewport. Avoid breakpoint-driven
  size jumps.
- Respect `env(safe-area-inset-*)` via the `--safe-*` shortcut tokens on
  every fixed-position container that touches a screen edge.
- Wrap fade / slide entrance animations in
  `@media (prefers-reduced-motion: no-preference)`. The global rule in
  `index.css` already neutralises straggler `transition`s when
  `prefers-reduced-motion: reduce` is set; do not regress that.

### Tests

- Vitest. Test files live in each package's `__tests__/` directory and end
  with `.test.ts(x)`.
- Pure-logic tests (`@belote/core`, `@belote/app`, `@belote/protocol`,
  `@belote/server`'s queue + room) are unit tests in jsdom-free environments.
- UI component tests use `@testing-library/react` + `userEvent` and run in
  jsdom (configured in
  [`packages/ui/vite.config.ts`](packages/ui/vite.config.ts)).
- Server integration tests spin up real `ws` clients against a real
  `WebSocketServer` — see
  [`packages/server/__tests__/gateway.integration.test.ts`](packages/server/__tests__/gateway.integration.test.ts).
- No mocking of internal modules unless you have a strong reason. Mocking
  the database / network / time is fine; mocking your own code is usually
  a smell.
- One assertion per behaviour, but feel free to chain multiple `expect()`s
  in one `it()` if they're testing facets of the same behaviour.
- `data-testid` for selecting; `aria-label` / role queries when testing
  accessibility contracts.

### CSS-only changes and tests

CSS isn't directly testable in jsdom (no layout engine). For responsive
work, TDD what you can — accessible names, role / aria attributes,
`data-touch="primary"` markers, render-without-crash at narrow viewports —
and accept manual / Playwright verification for the rest.

### Comments

- Default to no comment. The code's name should carry intent.
- Comment **why**, not what. Hidden invariants, performance subtleties,
  workarounds for specific bugs. Not "increment counter".
- Don't reference the current PR / iteration / ticket in code comments —
  that context belongs in the commit / iteration report.

---

## 3. Architecture guidelines

### Package layers

The monorepo is six packages with a strict dependency direction:

```text
                 ┌──────┐
                 │  ui  │────────┐
                 └──────┘        │
                    │            │
                    ▼            ▼
            ┌──────────┐   ┌──────────┐
            │   app    │   │ protocol │
            └──────────┘   └──────────┘
                    │            │
                    ▼            ▼
                 ┌──────┐      ┌──────────┐
                 │ core │      │  server  │
                 └──────┘      └──────────┘
                                   │  │  │
                                   ▼  ▼  ▼
                                core, app, protocol

@belote/animation: stand-alone, framework-independent. Consumed by ui
when needed; depends on nothing.
```

### Layer rules

| Package             | Can import                             | Cannot import                   | Has DOM? |
| ------------------- | -------------------------------------- | ------------------------------- | -------- |
| `@belote/core`      | nothing                                | app, protocol, server, ui       | No       |
| `@belote/app`       | core                                   | protocol, server, ui            | No       |
| `@belote/animation` | nothing                                | core, app, protocol, server, ui | No       |
| `@belote/protocol`  | nothing                                | core, app, server, ui           | No       |
| `@belote/server`    | core, app, protocol                    | ui                              | No       |
| `ui`                | core (types), app, protocol, animation | server                          | Yes      |

Rules:

- **No upward dependencies.** Core never knows about `ui`. Ever.
- **No circular dependencies.** Run `tsc --build`; the project references
  enforce this.
- **Server side has no UI.** It must run headless on Node.
- **Core is deterministic and pure.** No `Date.now()`, no `Math.random()`
  outside controlled seams (deck shuffling takes a seed parameter).

### Where new code goes

| You're adding…                                                  | Goes in…                             |
| --------------------------------------------------------------- | ------------------------------------ |
| A new bid type / scoring rule / card law                        | `@belote/core`                       |
| A new command or cross-component event flow                     | `@belote/app`                        |
| A new client↔server message                                     | `@belote/protocol`                   |
| A new server-side feature (matchmaking, queues, room behaviour) | `@belote/server`                     |
| A React component for the in-game board                         | `packages/ui/src/components/<Name>/` |
| A new menu surface                                              | `packages/ui/src/components/<Name>/` |
| A custom hook glueing online state to the UI                    | `packages/ui/src/online/`            |
| A pre-render animation sequence description                     | `@belote/animation`                  |

### Sharing the rules engine across client and server

The single biggest architectural decision in this codebase: the **same
`@belote/core` runs server-side**. The server validates every action through
the same rules the client renders. `getValidPlays(trick, position, hand)` is
what both the UI and the server call; the server pre-computes it for each
seat and ships the result as `private_state.legalCardIds`. This removes a
whole class of "client says it's legal, server says it isn't" bugs.

If you change a rule in `@belote/core`, the change is automatically active
on both sides. You only need to update the wire protocol if the **shape**
of a message changes, not its rule semantics.

### Server authoritative model

- `Room` owns one `GameSession` per ws connection group of four.
- Every dispatch goes through the session, never the raw rules engine.
- Errors are classified (`INVALID_BID` / `INVALID_PLAY` / `WRONG_TURN` /
  `INVALID_ACTION`) and sent only to the offending seat, not broadcast.
- `Broadcaster` is a per-room interface; `Gateway` constructs one per
  room and binds it to the seat → ws map. The room never touches `ws`
  directly — that keeps it testable without a network.

### Visual parity (AI vs online)

- `<GameTableView>` is a **pure** presentational component taking a
  `GameSessionState`.
- AI mode: `useGameSession` projects `GameSession` events into that state.
- Online mode: `useOnlineGameSession` translates server `public_state` +
  `private_state` into the same shape (with a seat-rotation step so each
  client always sees themselves at the SOUTH visual position).
- New gameplay UI features go into `<GameTableView>`. If you find yourself
  adding mode-specific code paths into the view, you're probably leaking
  presentation into the hook layer; rethink.

### Protocol versioning (informal, for now)

`@belote/protocol` adds new message variants without breaking old clients
when possible. Tagged unions + structural validators tolerate unknown
extra fields, so adding a field to an existing message is a non-breaking
change. Removing or renaming a field is breaking — bump a version
discriminator if/when you do it.

### Reduced-motion / a11y as architecture

Accessibility isn't optional and isn't a "later" iteration:

- Global rule in [`packages/ui/src/index.css`](packages/ui/src/index.css)
  caps animation / transition durations to 0.01ms when
  `prefers-reduced-motion: reduce`.
- Global rule in the same file enforces 44 × 44 minimum on every
  `[data-touch="primary"]` element.
- `--safe-*` tokens in `tokens.css` give every fixed-position container
  iPhone-notch-safe padding for free.

If you're adding a new screen, opt into all three: tokens, `data-touch`,
safe-area padding.

---

## When in doubt

Open a draft PR with the iteration plan and a one-line "I'm not sure how
to model X — looking for guidance" note. It's faster than writing the wrong
code and discovering during review. Reviewers will respond with PO /
Architect / Reviewer / Tester findings per the
[review protocol](docs/REVIEW_PROTOCOL.md).
