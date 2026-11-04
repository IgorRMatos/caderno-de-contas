import { defineConfig, devices } from '@playwright/test';

/**
 * E2E roda contra o BUILD de produção servido por `vite preview`, não contra
 * o `vite dev`. Motivo (chore de estabilidade, 2026-11-04): no dev, cada
 * módulo é transformado sob demanda; com a suíte em paralelo nos 3 navegadores,
 * o servidor às vezes deixava requisições de módulo sem resposta. O Firefox
 * abre no máximo 6 conexões por host, então 6 módulos pendurados travavam o
 * carregamento inteiro (página em branco, `goto`/`click` estourando 30 s em
 * testes aleatórios). O build serve poucos arquivos estáticos já prontos,
 * sem transformação, e de quebra testa o que vai ao ar, com a CSP real (D12).
 *
 * `reuseExistingServer: false` garante um build novo a cada rodada (nunca
 * testar um `dist/` velho). Porta própria para não colidir com um preview manual.
 */
const PORTA = 4174;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
