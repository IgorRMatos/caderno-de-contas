import { expect, test } from '@playwright/test';

test.use({ locale: 'pt-BR' });

async function carregarExemplo(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /Ver com dados de exemplo/ }).click();
  await expect(page).toHaveURL(/#\/caderno$/);
}

test.describe('T9 — Dashboard: manchete, indicadores, insights, filtros (CA05, CA07, CA08)', () => {
  test('mostra manchete (quanto sobrou), indicadores secundários e insights do mês', async ({
    page,
  }) => {
    await carregarExemplo(page);

    await expect(page.locator('.hero-kpi .big')).toBeVisible();
    await expect(page.locator('.hero-kpi .headline')).not.toBeEmpty();

    await expect(page.locator('.side-kpis .row.in .v')).toBeVisible();
    await expect(page.locator('.side-kpis .row.out .v')).toBeVisible();
    await expect(page.locator('.side-kpis .margin .stamp')).toBeVisible();

    // outubro é o mês de referência (último com dados) — fornecedores é 42% das saídas (CA06.2)
    await expect(page.locator('.cat-list li').first()).toContainText('42%');
  });

  test('atalhos de período têm aria-pressed e trocam o indicador ativo (CA08.1)', async ({
    page,
  }) => {
    await carregarExemplo(page);

    const ultimoMes = page.getByRole('button', { name: 'Último mês', exact: true });
    const ultimos3 = page.getByRole('button', { name: 'Últimos 3 meses', exact: true });
    await expect(ultimoMes).toHaveAttribute('aria-pressed', 'true');
    await expect(ultimos3).toHaveAttribute('aria-pressed', 'false');

    await ultimos3.click();
    await expect(ultimos3).toHaveAttribute('aria-pressed', 'true');
    await expect(ultimoMes).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.filters .active-row')).toBeVisible();
    await expect(page.locator('.filters .active-row')).toContainText('Olhando:');
  });

  test('filtro de categoria: aplicar e depois Limpar filtros (CA08.2, CA08.4)', async ({
    page,
  }) => {
    await carregarExemplo(page);

    await page.locator('.filters').getByRole('button', { name: 'Todas' }).click();
    await page.getByRole('checkbox', { name: 'aluguel' }).check();
    await page.getByRole('button', { name: 'Aplicar' }).click();

    await expect(page.locator('.filters .active-row')).toContainText('aluguel');
    // só aluguel nas saídas do mês: vira 100% da categoria exibida
    await expect(page.locator('.cat-list li')).toHaveCount(1);
    await expect(page.locator('.cat-list li').first()).toContainText('100%');

    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(page.locator('.filters .active-row')).toHaveCount(0);
    await expect(page.locator('.cat-list li').first()).toContainText('42%');
  });
});
