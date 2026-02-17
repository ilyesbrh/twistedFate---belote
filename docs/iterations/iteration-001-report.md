# Iteration 1 Report: Project Foundation

**Date**: 2026-02-17
**Status**: Complete

## Goal

Set up a clean monorepo from zero with strict tooling, test infrastructure, and the first TDD-driven utility (ID generation).

## Scope

1. Clean slate - delete all legacy files
2. pnpm workspace monorepo with 4 packages
3. TypeScript strict mode configuration
4. Vitest 4 testing infrastructure
5. ESLint 9 + typescript-eslint strict type-checked + Prettier
6. ID generation utility with full TDD coverage

## Packages Created

| Package             | Description                    | Status                          |
| ------------------- | ------------------------------ | ------------------------------- |
| `@belote/core`      | Pure domain engine (zero deps) | Active - ID utility implemented |
| `@belote/app`       | Command/event orchestration    | Shell                           |
| `@belote/animation` | Isolated animation engine      | Shell                           |
| `@belote/ui`        | PixiJS mobile-first rendering  | Shell                           |

## Tests Written (TDD - written before implementation)

41 test cases covering:

- ID format validation (9 entity types, prefix, alphanumeric unique part)
- Deterministic mode (same seed = same sequence, reproducibility)
- Reset functionality (sequence replay after reset)
- Random mode (uniqueness across 1000 IDs, correct format)
- Convenience function (module-level `generateId`)
- Edge cases (seed 0, negative seed, large seed, 10K collision test, generator isolation)
- Type safety (all EntityType values accepted)

## Implementation Summary

### ID Generation Utility (`@belote/core/src/utils/id.ts`)

- `EntityType` union type covering 9 entity types
- `createIdGenerator(config?)` factory pattern
  - Seeded mode: mulberry32 PRNG, 8-char base-36 unique part
  - Random mode: `crypto.randomUUID()`, 12-char hex unique part
- `generateId(entityType)` convenience function (module-level, random mode)
- ID format: `"{entityType}_{uniquePart}"` (e.g., `"card_a1b2c3d4"`)

## Technical Decisions

| Decision           | Choice                                                                  | Rationale                                               |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| PRNG algorithm     | mulberry32                                                              | Zero deps, excellent 32-bit distribution, deterministic |
| ID format (seeded) | 8-char base-36                                                          | Readable in test output, sufficient entropy             |
| ID format (random) | 12-char hex from UUID                                                   | Collision-resistant for production                      |
| TypeScript config  | Separate tsconfig.json (IDE/ESLint) + tsconfig.build.json (compilation) | Clean separation of concerns                            |
| ESLint config      | Flat config, disableTypeChecked for config files                        | Avoids projectService issues with non-tsconfig files    |

## Refactoring Performed

- Restructured tsconfig pattern: `tsconfig.json` for IDE/ESLint (includes tests), `tsconfig.build.json` for `tsc --build` (src only)
- Used `String.charAt()` instead of bracket indexing to satisfy `noUncheckedIndexedAccess`
- Added `global.d.ts` for `crypto.randomUUID()` type (avoids importing full DOM lib)

## Risks Identified

- None blocking

## Validation Results

- `pnpm test`: 41/41 passing (263ms)
- `pnpm run typecheck`: Clean
- `pnpm run lint`: Clean
- `pnpm run format:check`: Clean

## Next Iteration Candidate

**Iteration 2: Card Entity (TDD)**

- Card type definitions (suits, ranks)
- Card value system for Belote scoring
- Card comparison logic
- Card creation with deterministic IDs
