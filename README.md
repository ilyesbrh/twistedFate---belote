# TwistedFate - Belote

Mobile-first Belote card game built with TypeScript and PixiJS.

## Architecture

pnpm monorepo with strict layer separation:

| Package             | Description                                                 | Status      |
| ------------------- | ----------------------------------------------------------- | ----------- |
| `@belote/core`      | Pure domain engine (zero deps, deterministic, testable)     | In Progress |
| `@belote/app`       | Application layer (command/event orchestration)             | Shell       |
| `@belote/animation` | Isolated animation engine (testable, framework-independent) | Shell       |
| `@belote/ui`        | PixiJS mobile-first rendering                               | Shell       |

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.0.0

## Commands

```bash
pnpm install        # Install dependencies
pnpm test           # Run all tests
pnpm test:watch     # Run tests in watch mode
pnpm run typecheck  # TypeScript type checking
pnpm run lint       # ESLint
pnpm run format     # Prettier format
```

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Testing**: Vitest 4
- **Build**: Vite
- **Linting**: ESLint 9 + typescript-eslint (strict type-checked) + Prettier
- **UI**: PixiJS (Canvas/WebGL)
- **Package Manager**: pnpm (workspaces)
