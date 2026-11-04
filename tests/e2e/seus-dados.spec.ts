import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.use({ locale: 'pt-BR' });

test.describe('T12 — Seus dados: exportar → apagar → reimportar (CA12.1–CA12.4)', () => {
  test('fluxo completo, mantendo tema e idioma e sem nenhuma requisição fora de localhost', async ({
    page,
  }, testInfo) => {
    const externas: string[] = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol.startsWith('http')) {
        externas.push(req.url());
      }
    });

    await page.goto('/');
    await page.getByRole('button', { name: /Ver com dados de exemplo/ }).click();
    await expect(page).toHaveURL(/#\/caderno$/);

    // preferência de interface que precisa sobreviver ao "apagar"
    await page.locator('.theme-btn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // CA12.1 — privacidade completa na tela Seus dados
    await page.goto('/#/seus-dados');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Suas contas ficam com você',
    );
    await expect(page.locator('.sd-privacidade')).toContainText('outro aparelho');

    // CA12.2 — exportar (Blob + <a download>)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar meus dados (CSV)' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^caderno-\d{4}-\d{2}-\d{2}\.csv$/);
    const arquivo = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(arquivo);
    const bytes = await readFile(arquivo);
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const texto = bytes.subarray(3).toString('utf8');
    expect(texto.split('\n')[0]).toBe('data;descricao;valor;tipo;categoria');
    const linhasExportadas = texto.trim().split('\n').length - 1;
    expect(linhasExportadas).toBeGreaterThan(0);
    const toastCopia = page.locator('.toast.ok').first();
    await expect(toastCopia).toContainText('Cópia baixada');
    // texto completo: o nome do arquivo NÃO pode ganhar maiúscula (bug do QA no T12)
    await expect(toastCopia).toContainText(
      `${download.suggestedFilename()} com ${linhasExportadas} lançamentos.`,
    );

    // CA12.3 — apagar pelo rodapé: alertdialog, foco em "Não, manter tudo"
    await page.locator('.footer').getByRole('button', { name: 'Apagar meus dados' }).click();
    const dialogo = page.getByRole('alertdialog', { name: 'Arrancar todas as folhas?' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo).toContainText(`${linhasExportadas} lançamentos`);
    await expect(dialogo).toContainText('tema e seu idioma ficam');
    await expect(dialogo.getByRole('button', { name: 'Não, manter tudo' })).toBeFocused();

    // Esc fecha sem apagar
    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
    await expect(page.getByRole('button', { name: 'Exportar meus dados (CSV)' })).toBeEnabled();

    await page.locator('.footer').getByRole('button', { name: 'Apagar meus dados' }).click();
    await dialogo.getByRole('button', { name: 'Sim, apagar tudo' }).click();

    await expect(page).toHaveURL(/#\/$/);
    await expect(page.locator('.toast.ok').first()).toContainText('Caderno zerado');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // continua vazio depois de recarregar (storage limpo), tema mantido
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.goto('/#/caderno');
    await expect(page).toHaveURL(/#\/$/); // guarda de rota: sem dados, volta ao início
    const salvo = await page.evaluate(() => localStorage.getItem('caderno:v1:lancamentos'));
    expect(salvo === null || salvo === '[]').toBe(true);

    // reimportar o CSV exportado pelo pipeline normal
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Escolher arquivo' }).click(),
    ]);
    await fileChooser.setFiles(arquivo);
    await expect(page).toHaveURL(/#\/caderno$/);
    await expect(page.locator('.toast.ok').first()).toContainText(
      `Planilha importada: ${linhasExportadas} lançamentos.`,
    );
    await expect(page.locator('.toast.warn')).toHaveCount(0); // nada sem categoria nem inválido

    // CA12.4 — nenhum dado saiu da máquina
    expect(externas).toEqual([]);
  });

  test('sem dados, a tela explica e os botões ficam desabilitados', async ({ page }) => {
    await page.goto('/#/seus-dados');
    await expect(page.locator('.sd-vazio')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar meus dados (CSV)' })).toBeDisabled();
    await expect(
      page.locator('main').getByRole('button', { name: 'Apagar meus dados' }),
    ).toBeDisabled();
  });
});
