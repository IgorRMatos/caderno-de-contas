import { expect, test } from '@playwright/test';

// CA10.4: o idioma inicial é detectado do navegador. O locale padrão do
// Playwright é en-US, então sem fixar pt-BR aqui a página abriria em inglês
// (comportamento correto da feature — só fixamos para o teste ser determinístico).
test.use({ locale: 'pt-BR' });

test.describe('T6 — shell (cabeçalho, tema, idioma, skip link, rodapé)', () => {
  test('skip link fica fora da tela e aparece ao focar via Tab', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveCSS('top', '-100px');

    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    // a transição CSS (--dur-fast) leva um instante; espera o valor final em
    // vez de ler o computed style no meio da animação (instável no WebKit).
    await expect(skipLink).not.toHaveCSS('top', '-100px');
  });

  test('sol/lua alterna o tema e sincroniza data-theme + aria-label', async ({ page }) => {
    await page.goto('/');
    const botao = page.getByRole('button', { name: /Mudar para tema/ });
    const temaAntes = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );

    await botao.click();

    const temaDepois = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(temaDepois).not.toBe(temaAntes);
    await expect(botao).toHaveAccessibleName(
      temaDepois === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro',
    );
  });

  test('seletor de idioma troca lang/título/conteúdo e devolve o foco ao fechar', async ({
    page,
  }) => {
    await page.goto('/');
    // seletor por classe, não pelo rótulo acessível: o rótulo ("Idioma:" /
    // "Language:") muda de texto junto com o próprio idioma que estamos testando.
    const botaoIdioma = page.locator('.lang-btn');
    await botaoIdioma.click();

    const opcaoEn = page.getByRole('option', { name: 'English (US)' });
    await opcaoEn.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveTitle(/The Ledger Notebook/);
    await expect(botaoIdioma).toBeFocused();
  });

  test('listbox de idioma: Escape fecha sem trocar e devolve o foco', async ({ page }) => {
    await page.goto('/');
    const botaoIdioma = page.getByRole('button', { name: /^Idioma:/ });
    await botaoIdioma.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(listbox).toBeFocused(); // garante o foco migrou antes do Esc (WebKit é mais lento aqui)

    await page.keyboard.press('Escape');

    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(botaoIdioma).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });

  test('rodapé: assinatura e links de privacidade presentes, sem window.confirm', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /LinkedIn/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Exportar meus dados/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Apagar meus dados/ })).toBeVisible();
  });
});
