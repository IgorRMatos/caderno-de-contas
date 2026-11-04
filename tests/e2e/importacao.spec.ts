import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '../fixtures');

test.use({ locale: 'pt-BR' });

test.describe('T7 — início, upload e mapeamento (CA01, CA02, CA12.1)', () => {
  test('upload de CSV com cabeçalhos reconhecidos vai direto para o dashboard', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Quanto sobrou este mês/ })).toBeVisible();
    await expect(page.locator('.privacy-tag')).toContainText(
      'Sua planilha não sai deste computador',
    );

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Escolher arquivo' }).click(),
    ]);
    await fileChooser.setFiles(path.join(FIXTURES, 'utf8-virgula.csv'));

    await expect(page).toHaveURL(/#\/caderno$/);
    await expect(page.locator('.toast.ok')).toBeVisible();
    await expect(page.locator('.toast.ok')).toContainText('importada');
  });

  test('CSV com cabeçalhos não reconhecidos abre a tela de mapeamento com prévia', async ({
    page,
  }) => {
    await page.goto('/');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Escolher arquivo' }).click(),
    ]);
    await fileChooser.setFiles(path.join(FIXTURES, 'cabecalhos-estranhos.csv'));

    await expect(page).toHaveURL(/#\/mapeamento$/);
    await expect(page.getByRole('heading', { name: /outros nomes/ })).toBeVisible();
    // prévia ao vivo: o cabeçalho real do arquivo aparece na tabela
    await expect(page.locator('.preview')).toContainText('Quando');

    const montar = page.getByRole('button', { name: /Montar meu caderno/ });
    await expect(montar).toHaveAttribute('aria-disabled', 'true');

    // escolhe as colunas obrigatórias (Quando=data, Quanto=valor)
    await page.locator('#map-data').selectOption({ label: 'Quando' });
    await page.locator('#map-valor').selectOption({ label: 'Quanto' });
    await expect(montar).not.toHaveAttribute('aria-disabled', 'true');

    await montar.click();
    await expect(page).toHaveURL(/#\/caderno$/);
  });

  test('aria-disabled no botão de montar ainda assim é clicável e leva o foco ao campo obrigatório vazio (CA02.4)', async ({
    page,
  }) => {
    await page.goto('/');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Escolher arquivo' }).click(),
    ]);
    await fileChooser.setFiles(path.join(FIXTURES, 'cabecalhos-estranhos.csv'));
    await expect(page).toHaveURL(/#\/mapeamento$/);

    const montar = page.getByRole('button', { name: /Montar meu caderno/ });
    // force: true — aria-disabled (D15) não bloqueia clique real de mouse no
    // navegador (só `disabled` nativo faria isso); o Playwright trata
    // aria-disabled="true" como não-acionável por padrão, então pedimos
    // explicitamente o clique que um usuário vidente consegue dar de verdade.
    await montar.click({ force: true }); // nenhum campo obrigatório preenchido ainda

    await expect(page.locator('.missing')).toBeVisible();
    await expect(page.locator('#map-data')).toBeFocused();
  });

  test('arquivo ilegível (extensão não suportada) mostra estado de erro + toast, sem quebrar a página', async ({
    page,
  }) => {
    const erros: string[] = [];
    page.on('pageerror', (err) => erros.push(String(err)));

    await page.goto('/');
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Escolher arquivo' }).click(),
    ]);
    await fileChooser.setFiles({
      name: 'foto-do-caderno.png',
      mimeType: 'image/png',
      buffer: Buffer.from('não é uma planilha de verdade'),
    });

    await expect(page.locator('.dropzone.is-error')).toBeVisible();
    await expect(page.locator('.toast.err')).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('"Ver com dados de exemplo" carrega dados e vai para o dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Ver com dados de exemplo/ }).click();
    await expect(page).toHaveURL(/#\/caderno$/);
  });
});
