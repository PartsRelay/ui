import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

process.env.TZ = 'UTC'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  test: {
    include: ['src/{core,modules/*}/tests/unit/**/*.test.ts'],
    environment: 'node',
    unstubGlobals: true,
    coverage: {
      provider: 'istanbul',
      include: ['src/core/**/*.ts', 'src/modules/*/core/**/*.ts'],
      exclude: ['src/core/api/**', '**/tests/**'],
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportOnFailure: true,
    },
  },
})
