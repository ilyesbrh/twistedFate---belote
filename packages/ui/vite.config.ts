import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// `VITE_BASE_PATH` lets the docker/production build target the bare domain
// (`/`) while the default keeps the existing GitHub-Pages base path. Must
// end with a trailing slash to satisfy Vite's URL-rewriting expectations.
const basePath = process.env["VITE_BASE_PATH"] ?? "/twistedFate-belote/";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: basePath,
  test: {
    name: "ui",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: ["./__tests__/setup.ts"],
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
