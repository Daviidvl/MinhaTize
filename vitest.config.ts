import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Os testes de formulário simulam digitação tecla a tecla; com a cobertura
    // ligada (CI) passam dos 5 s padrão
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/__tests__/**', 'src/vite-env.d.ts'],
      // PISO, não meta: valores logo abaixo da cobertura medida, para
      // `npm run test:coverage` acusar regressão. Suba-os conforme os componentes
      // ganharem testes. Recalibrado em 22/out/2026 na troca para o vitest 5: o
      // coverage-v8 novo conta branches e funções com mais rigor que o 1.x
      // (medido: 46,9 statements · 32,4 branches · 28,4 functions · 48,9 lines).
      // Subido em 11/nov/2026 com os testes de profileUtils, profileForm, consent
      // e afins (medido: 48,6 · 32,8 · 32,0 · 50,8).
      thresholds: { lines: 50, statements: 48, functions: 31, branches: 32 },
    },
  },
})
