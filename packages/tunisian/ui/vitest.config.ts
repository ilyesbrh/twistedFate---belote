import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "tunisian-ui",
    include: ["__tests__/**/*.test.tsx", "__tests__/**/*.test.ts"],
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
