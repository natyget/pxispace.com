import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.next', 'out', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // `process` must be a known global, or `process.env.NEXT_PUBLIC_*` trips
        // no-undef and invites the workaround `globalThis.process?.env?.X`. That
        // workaround silences the linter and BREAKS the build: Next inlines these
        // values by literal text substitution of `process.env.NEXT_PUBLIC_*`, so
        // any other spelling is never replaced and reads undefined in the browser.
        // Readonly, so nothing can assign to it.
        process: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
