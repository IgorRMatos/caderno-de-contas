import { describe, expect, it } from 'vitest';
import { moedaAtiva, MOEDA_POR_IDIOMA } from '../../src/config';

describe('moedaAtiva', () => {
  it('segue o idioma quando MOEDA_FIXA é null (decisão do PO, D1)', () => {
    expect(moedaAtiva('pt-BR')).toBe(MOEDA_POR_IDIOMA['pt-BR']);
    expect(moedaAtiva('es')).toBe(MOEDA_POR_IDIOMA.es);
    expect(moedaAtiva('en')).toBe(MOEDA_POR_IDIOMA.en);
  });
});
