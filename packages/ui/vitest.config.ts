import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "ui",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    environment: "node",
    server: {
      deps: {
        inline: ["@pixi/react"],
      },
    },
  },
});
