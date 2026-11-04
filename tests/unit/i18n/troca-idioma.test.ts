import { afterEach, describe, expect, it } from 'vitest';
import { carregarIdioma } from '../../../src/i18n/index';
import { formatarMoeda } from '../../../src/domain/money';
import { formatarData, formatarMesPorExtenso } from '../../../src/domain/dates';

function semNbsp(s: string): string {
  return s.replace(/\u00A0/g, ' ');
}

afterEach(async () => {
  await carregarIdioma('pt-BR');
});

describe('CA10.3/CA10.5 — trocar idioma reformata moeda/data/mês, nunca converte o valor', () => {
  const centavos = 324_000; // sempre os mesmos centavos nos 3 idiomas
  const dataISO = '2026-10-15';
  const anoMes = '2026-10';

  it('mesmos centavos, três formatações de moeda diferentes', async () => {
    await carregarIdioma('pt-BR');
    expect(semNbsp(formatarMoeda(centavos, 'pt-BR'))).toBe('R$ 3.240,00');

    await carregarIdioma('es');
    expect(semNbsp(formatarMoeda(centavos, 'es'))).toBe('3240,00 €');

    await carregarIdioma('en');
    expect(semNbsp(formatarMoeda(centavos, 'en'))).toBe('$3,240.00');
  });

  it('mesma data ISO, três formatações diferentes', () => {
    expect(formatarData(dataISO, 'pt-BR')).toBe('15/10/2026');
    expect(formatarData(dataISO, 'en')).toBe('10/15/2026');
  });

  it('mesmo mês, nome por extenso em cada idioma', () => {
    expect(formatarMesPorExtenso(anoMes, 'pt-BR').toLowerCase()).toContain('outubro');
    expect(formatarMesPorExtenso(anoMes, 'es').toLowerCase()).toContain('octubre');
    expect(formatarMesPorExtenso(anoMes, 'en').toLowerCase()).toContain('october');
  });
});
