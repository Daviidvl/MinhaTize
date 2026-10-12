import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'vite.config.js', 'vite.config.d.ts', 'public/sw.js'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Frontend (browser)
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Funções serverless e arquivos de configuração (Node)
  {
    files: ['api/**/*.ts', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  {
    rules: {
      // O compilador já cobre isso (noUnusedLocals / noUnusedParameters)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      // Nada de console.log esquecido no app; warn/error são usados de propósito
      'no-console': ['error', { allow: ['warn', 'error', 'log'] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: { 'no-console': ['error', { allow: ['warn', 'error'] }] },
  },
)
