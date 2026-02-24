import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/twistedFate---belote/',
  test: {
    name: 'ui',
    include: ['__tests__/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
