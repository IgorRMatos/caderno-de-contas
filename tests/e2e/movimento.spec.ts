import { expect, test, type Page } from '@playwright/test';

/**
 * T13 — camada de movimento (CA05.6, CA06.5, CA07.3, CA14.2, RNF08).
 * Regra de estabilidade (lição do chore de E2E): nenhum `waitForTimeout`;
 * todo teste espera ESTADOS FINAIS (foco, texto final, estilo limpo) com o
 * auto-wait do `expect`.
 */

test.use({ locale: 'pt-BR' });

/** Texto final (sr-only) e texto animado (aria-hidden) de um contador. */
async function contador(page: Page, seletor: string) {
  const raiz = page.locator(seletor);
  return {
    final: raiz.locator('.sr-only'),
    animado: raiz.locator('[aria-hidden="true"]').first(),
  };
}

test.describe('T13 — com movimento ligado', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('vira a página, foca o título do mês, anuncia, e os contadores chegam ao valor final', async ({
    page,
  }) => {
    const scripts: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'script') scripts.push(r.url());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Quanto sobrou este mês/ })).toBeVisible();
    // D14 — ScrollTrigger é lazy: não vem no carregamento inicial
    expect(scripts.some((u) => /ScrollTrigger/.test(u))).toBe(false);

    await page.getByRole('button', { name: /Ver com dados de exemplo/ }).click();
    await expect(page).toHaveURL(/#\/caderno$/);

    // CA14.2 — ao fim da virada: foco no título do mês + live region
    const titulo = page.locator('#titulo-mes');
    await expect(titulo).toBeFocused();
    await expect(titulo).toHaveText(/^Outubro de 2026 · quanto sobrou$/);
    await expect(page.locator('#anuncio')).toHaveText('Seu caderno está pronto.');
    await expect(page.locator('#conteudo')).not.toHaveAttribute('style', /rotate/);
    expect(scripts.some((u) => /ScrollTrigger/.test(u))).toBe(true);

    // CA05.6 — o número animado termina igual ao valor final (que o leitor de tela já tinha)
    const hero = await contador(page, '.hero-kpi .big');
    await expect(hero.final).toHaveText(/3\.240,00/);
    await expect(hero.animado).toHaveText((await hero.final.textContent())!);
    const entrou = await contador(page, '.side-kpis .row.in .v');
    await expect(entrou.animado).toHaveText((await entrou.final.textContent())!);

    // CA07.3 — marca-texto no insight principal termina completo (estilo inline limpo)
    const hl = page.locator('.insights li.main .hl');
    await expect(hl).toBeVisible();
    await expect(hl).not.toHaveAttribute('style', /background-size/);

    // CA14.2/CA06.5 — rolando até a projeção: a seção aparece e a linha termina desenhada
    const projecao = page.locator('section.projection');
    await projecao.scrollIntoViewIfNeeded();
    await expect(projecao.locator('.sec-title')).toHaveCSS('opacity', '1');
    await expect(projecao.locator('path.real')).not.toHaveAttribute('style', /stroke-dash/);
    const barras = page.locator('section.cashflow rect.bar-in').first();
    await expect(barras).not.toHaveAttribute('style', /scale/);
  });

  test('filtro aplicado recalcula o contador do valor anterior até o novo final', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Ver com dados de exemplo/ }).click();
    await expect(page.locator('#titulo-mes')).toBeFocused();

    await page.getByRole('button', { name: 'Tudo', exact: true }).click();
    const hero = await contador(page, '.hero-kpi .big');
    const final = (await hero.final.textContent())!;
    await expect(hero.animado).toHaveText(final);
    // nenhum bloco fica meio apagado depois do crossfade
    await expect(page.locator('section.insights')).toHaveCSS('opacity', '1');
  });
});

test.describe('T13 — prefers-reduced-motion: reduce (RNF08)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('tudo aparece pronto: sem virada, contadores no final, seções e desenhos completos', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Ver com dados de exemplo/ }).click();
    await expect(page).toHaveURL(/#\/caderno$/);
    await expect(page.locator('#titulo-mes')).toBeFocused();
    await expect(page.locator('#anuncio')).toHaveText('Seu caderno está pronto.');

    // lido de uma vez, no primeiro instante em que o dashboard existe: já está no final
    const estado = await page.evaluate(() => {
      const big = document.querySelector('.hero-kpi .big')!;
      const secoes = Array.from(document.querySelectorAll<HTMLElement>('.dash > section'));
      return {
        final: big.querySelector('.sr-only')!.textContent,
        animado: big.querySelector('[aria-hidden="true"]')!.textContent,
        mainTransform: getComputedStyle(document.getElementById('conteudo')!).transform,
        opacidades: secoes.flatMap((s) =>
          Array.from(s.children).map((c) => getComputedStyle(c).opacity),
        ),
        linhaComDash: (document.querySelector('section.projection path.real') as SVGElement | null)
          ?.style.strokeDashoffset,
      };
    });
    expect(estado.animado).toBe(estado.final);
    expect(estado.mainTransform).toBe('none');
    expect(new Set(estado.opacidades)).toEqual(new Set(['1']));
    expect(estado.linhaComDash ?? '').toBe('');
  });

  test('a barra do toast continua correndo mesmo com reduced-motion (é timer)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Ver com dados de exemplo/ }).click();
    const barra = page.locator('.toast .bar').first();
    await expect(barra).toBeAttached();
    await expect
      .poll(() =>
        barra.evaluate((el) => {
          const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
          return m.a; // scaleX
        }),
      )
      .toBeLessThan(0.95);
  });
});
