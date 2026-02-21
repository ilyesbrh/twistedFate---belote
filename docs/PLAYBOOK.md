# TwistedFate - Belote: Development Playbook

Operational guide for building this project. Follow this exactly — no shortcuts, no improvisation.

---

## Iteration Lifecycle

Every feature follows this strict sequence. No steps skipped. No steps reordered.

### Phase 1: Scope (PO Step)

1. Define the iteration goal in one sentence.
2. List acceptance criteria (concrete, testable).
3. Identify files to create and files to modify.
4. Identify reusable symbols from existing packages.
5. Write a plan and get PO approval before any code.

### Phase 2: TDD Red-Green-Refactor

6. **Write failing tests first** — cover all pure logic.
7. Run tests, confirm they **fail** (red phase).
8. **Implement** the minimum code to pass.
9. Run tests, confirm they **pass** (green phase).
10. **Refactor** — extract, rename, simplify. Tests must stay green.

### Phase 3: Integration

11. Update barrel exports (`index.ts`).
12. Register dev harness scenes (if UI component).
13. Wire up any cross-package imports.

### Phase 4: Verification (All Four Must Pass)

```bash
pnpm test            # All tests pass, zero failures
pnpm typecheck       # Clean, zero errors
pnpm lint            # Clean, zero warnings
pnpm format:check    # Clean, zero issues
```

If any check fails, fix it before proceeding. Never skip verification.

### Phase 5: Report

14. Write `docs/iterations/iteration-NNN-report.md` following the template below.
15. Include N+1 and N+2 iteration previews.

---

## Iteration Report Template

```markdown
# Iteration N Report: [Title]

**Date**: YYYY-MM-DD
**Status**: Complete

## Goal

[One sentence]

## Scope

[Numbered list of deliverables]

## PO Decisions Locked

[Key decisions made and rationale]

## Tests Written (N test cases, written before implementation)

[Group by test file, list test descriptions]

## Implementation Summary

### Files Created

- `path/to/file.ts` — [purpose]

### Files Modified

- `path/to/file.ts` — [what changed]

### Key Types

[TypeScript interfaces/types introduced]

### Key Functions

[Public API surface]

## Technical Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| ...      | ...    | ...       |

## Refactoring Performed

[Or "None"]

## Risks Identified

[Or "None"]

## Validation Results

- `pnpm test`: **N/N passing**
- `pnpm typecheck`: Clean
- `pnpm lint`: Clean
- `pnpm format:check`: Clean

## Next Iteration: N+1 (Iteration N+1)

[Scope and acceptance criteria]

## Iteration N+2 Preview (Iteration N+2)

[High-level outline]
```

---

## Review Protocol

Triggered by requesting a review. Uses four sequential roles — never parallel, never merged.

1. **Product Owner** — Scope match, acceptance criteria, value delivered, scope creep
2. **Architect** — Layer separation, domain boundaries, scalability, technical debt
3. **Expert Code Reviewer** — TDD discipline, code quality, naming, hidden side effects
4. **Tester** — Coverage, determinism, edge cases, regression risks

Output per iteration: Status (Approved / Needs Revision), findings per role, critical issues, risk level.

Fixes must address **root causes**, not symptoms. See [REVIEW_PROTOCOL.md](REVIEW_PROTOCOL.md) for full details.

---

## TDD Rules

- Tests are written **before** implementation. Always.
- Confirm tests **fail** before implementing. The red phase is not optional.
- Pure logic is separated from canvas/DOM-dependent code.
- Pure logic gets unit tests. Canvas-dependent code gets dev harness scenes.
- No mocking of internal modules unless absolutely necessary.
- Test file location: `packages/<pkg>/__tests__/<module>.test.ts`

---

## Code Conventions

### TypeScript

- Strict mode, all packages.
- `tsconfig.json` for IDE/ESLint (includes tests). `tsconfig.build.json` for `tsc --build` (src only).
- ES2022 target. ESM (`"type": "module"`).
- Imports use `.js` extension: `import { foo } from "./bar.js"`

### Exports

- Barrel exports in each package's `src/index.ts`.
- Separate value exports and type exports:
  ```typescript
  export { foo, bar } from "./module.js";
  export type { Foo, Bar } from "./module.js";
  ```

### Naming

- Files: `kebab-case.ts`
- Types/interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for frozen objects
- PixiJS labels: `"component-name"` or `"card-{suit}-{rank}"`

### Style

- Prettier: double quotes, semicolons, 100 print width
- ESLint: typescript-eslint strict + stylistic
- No hardcoded visual values — everything from THEME tokens
- No magic numbers — extract named constants
- No `any` — use proper types
- No `as` casts unless proven necessary and documented

---

## Project Structure

```
twistedFate---belote/
├── docs/
│   ├── MANIFESTO.md          # Foundational principles
│   ├── UI_MANIFESTO.md       # UI/UX decisions and tokens
│   ├── GAME_RULES.md         # Tunisian Belote rules
│   ├── REVIEW_PROTOCOL.md    # 4-role review framework
│   ├── PLAYBOOK.md           # This file
│   └── iterations/           # One report per iteration
├── packages/
│   ├── core/                 # Pure domain engine (zero deps)
│   ├── app/                  # Command/event orchestration
│   ├── animation/            # Pure animation descriptions (zero rendering deps)
│   └── ui/                   # PixiJS mobile-first rendering
├── package.json              # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json        # Shared compiler options
├── tsconfig.json             # Project references
├── vitest.config.ts          # Root test config
└── eslint.config.mjs         # Flat ESLint config
```

### Package Dependency Direction

```
@belote/ui → @belote/app → @belote/core
                ↑
@belote/animation (consumed by @belote/ui, no direct core dependency)
```

No circular dependencies. No upward dependencies. Core depends on nothing.

---

## Layer Rules

| Layer       | Package             | Can Import                   | Cannot Import      |
| ----------- | ------------------- | ---------------------------- | ------------------ |
| Core Domain | `@belote/core`      | Nothing                      | app, animation, ui |
| Application | `@belote/app`       | core                         | animation, ui      |
| Animation   | `@belote/animation` | Nothing (pure data)          | core, app, ui      |
| UI          | `@belote/ui`        | core (types), app, animation | —                  |

---

## Design Token Rules

All visual constants live in `THEME` (`packages/ui/src/theme.ts`). No exceptions.

- Colors → `THEME.colors.*`
- Typography → `THEME.typography.*`
- Spacing → `THEME.spacing.*`
- Card dimensions → `THEME.cardDimensions.*`
- Animation timing → `THEME.animationTiming.*`

If a value doesn't exist in THEME, **add it to THEME first**, then use it.

THEME is deeply frozen via `deepFreeze()`. Immutable at runtime.

---

## Dev Harness

The UI package uses a lightweight dev harness (Vite entry point with scene selector) instead of Storybook.

- Scenes registered in `packages/ui/src/harness/scenes.ts`
- Each scene is a separate file: `packages/ui/src/harness/<name>.scene.ts`
- Imported in `packages/ui/src/harness/index.ts`
- Run with `pnpm dev`

Every UI component must have a dev harness scene before integration.

---

## Commands

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm typecheck         # TypeScript compilation check
pnpm lint              # ESLint
pnpm lint:fix          # ESLint with auto-fix
pnpm format            # Prettier write
pnpm format:check      # Prettier check
pnpm dev               # UI dev server with harness
pnpm build             # Production build
```

---

## Key Principles (Non-Negotiable)

1. **One iteration at a time.** No parallel features.
2. **Tests before code.** Always.
3. **All four checks pass.** Tests, types, lint, format.
4. **No hardcoded visual values.** Theme tokens only.
5. **No integration before isolation.** Component works alone first.
6. **Root-cause fixes.** Never patch symptoms.
7. **Every iteration gets a report.** With N+1 and N+2 previews.
8. **Every display object has a label.** No anonymous containers.
9. **Pure logic separated from rendering.** Testable vs dev-harness-verified.
10. **Forward planning is mandatory.** Every report defines what comes next.
