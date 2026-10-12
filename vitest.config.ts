import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/__tests__/**', 'src/vite-env.d.ts'],
      // PISO, não meta: valores logo abaixo da cobertura medida em out/2026, para
      // `npm run test:coverage` acusar regressão. Suba-os conforme os componentes
      // ganharem testes.
      thresholds: { lines: 40, statements: 40, functions: 36, branches: 65 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
