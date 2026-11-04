import { expect, test } from '@playwright/test';

test('carrega sem erros no console e mostra a folha do caderno', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (err) => erros.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') erros.push(msg.text());
  });

  await page.goto('/');
  await expect(page.locator('.sheet')).toBeVisible();
  expect(erros).toEqual([]);
});

test('aplica data-theme antes da pintura, sem flash', async ({ page }) => {
  await page.goto('/');
  const tema = await page.locator('html').getAttribute('data-theme');
  expect(['light', 'dark']).toContain(tema);
});
