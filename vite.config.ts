import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vite-plus'
import app from './locales/en-US/app.json' with { type: 'json' }
import pkg from './package.json' with { type: 'json' }
import { readEnv } from './src/env'

const ignored = [
  '**/dist/**',
  'src/core/api/**',
  'src/ui/routeTree.gen.ts',
  'public/mockServiceWorker.js',
  'locales/**',
  'CHANGELOG.md',
  '.release-please-manifest.json',
]

const env = readEnv(loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), ''))

const html: Record<string, string> = {
  APP_NAME: env.APP_NAME,
  UI_URL: env.UI_URL,
  DESCRIPTION: app.description,
}

const reactImports = ['react', 'react-dom', '@tanstack/react-*', '@/ui/*', '@/modules/*/ui/*']

export default defineConfig({
  plugins: [
    devtools({ eventBusConfig: { enabled: false } }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/ui/routes',
      generatedRouteTree: './src/ui/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    {
      name: 'html-texts',
      transformIndexHtml: (source) => source.replace(/%(\w+)%/g, (text, key) => html[key] ?? text),
    },
  ],

  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  define: {
    __ENV__: JSON.stringify(env),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'],
  },

  lint: {
    ignorePatterns: ignored,
    plugins: ['react'],
    env: { browser: true },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ['src/core/**', 'src/mocks/**', 'src/modules/*/core/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: reactImports,
                  message: 'The core layers cannot import React or the ui layers.',
                },
              ],
            },
          ],
        },
      },
    ],
  },

  fmt: {
    ignorePatterns: ignored,
    printWidth: 100,
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
    quoteProps: 'consistent',
    bracketSpacing: true,
    arrowParens: 'always',
    useTabs: false,
  },
})
