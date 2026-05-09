import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "coinche-core",
    include: ["__tests__/**/*.test.ts"],
    environment: "node",
  },
});
