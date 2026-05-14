import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/*/vitest.config.ts",
      "packages/ui/vite.config.ts",
      "packages/coinche/*/vitest.config.ts",
      "packages/tunisian/*/vitest.config.ts",
    ],
  },
});
