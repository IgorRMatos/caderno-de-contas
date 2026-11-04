import { describe, expect, it } from 'vitest';
import {
  centavosDeNumero,
  formatarMoeda,
  inferirSeparadorDecimal,
  parseValorPlanilha,
  totalCentavos,
} from '../../../src/domain/money';

function normalizarEspacos(s: string): string {
  return s.replace(/\u00A0/g, ' ');
}

describe('inferirSeparadorDecimal (D3 — por coluna)', () => {
  it('ambos os separadores presentes: o mais à direita é o decimal', () => {
    expect(inferirSeparadorDecimal(['1.234,56'], 'pt-BR')).toBe(',');
    expect(inferirSeparadorDecimal(['1,234.56'], 'en')).toBe('.');
  });

  it('só um separador, seguido de 1-2 dígitos no fim: ele é o decimal', () => {
    expect(inferirSeparadorDecimal(['12,50', '7,5'], 'pt-BR')).toBe(',');
    expect(inferirSeparadorDecimal(['12.50', '7.5'], 'en')).toBe('.');
  });

  it('só grupos de 3 (ambíguo): cai para o idioma ativo', () => {
    expect(inferirSeparadorDecimal(['12.500', '1.200'], 'pt-BR')).toBe(',');
    expect(inferirSeparadorDecimal(['12.500', '1.200'], 'en')).toBe('.');
  });
});

describe('parseValorPlanilha (D3)', () => {
  it('1.234,56 (coluna pt) → 123456 centavos', () => {
    expect(parseValorPlanilha('1.234,56', ',')).toEqual({ ok: true, centavos: 123456 });
  });

  it('1,234.56 (coluna en) → 123456 centavos', () => {
    expect(parseValorPlanilha('1,234.56', '.')).toEqual({ ok: true, centavos: 123456 });
  });

  it('R$ 12,50 → 1250 centavos (símbolo de moeda removido)', () => {
    expect(parseValorPlanilha('R$ 12,50', ',')).toEqual({ ok: true, centavos: 1250 });
  });

  it('(45,00) → -4500 centavos (negativo por parênteses)', () => {
    expect(parseValorPlanilha('(45,00)', ',')).toEqual({ ok: true, centavos: -4500 });
  });

  it('−12 (U+2212) → -1200 centavos', () => {
    expect(parseValorPlanilha('−12', ',')).toEqual({ ok: true, centavos: -1200 });
  });

  it('-12 (hífen comum) → -1200 centavos', () => {
    expect(parseValorPlanilha('-12', '.')).toEqual({ ok: true, centavos: -1200 });
  });

  it('1234 (sem separador) → 123400 centavos', () => {
    expect(parseValorPlanilha('1234', ',')).toEqual({ ok: true, centavos: 123400 });
  });

  it('12.500 na coluna pt (separador decimal é vírgula) → 1.250.000 centavos (ponto é milhar)', () => {
    expect(parseValorPlanilha('12.500', ',')).toEqual({ ok: true, centavos: 1250000 });
  });

  it('12.500 na coluna en (separador decimal é ponto) → 1250 centavos (12,500 = 12.5)', () => {
    expect(parseValorPlanilha('12.500', '.')).toEqual({ ok: true, centavos: 1250 });
  });

  it('célula vazia ou só símbolos → inválida', () => {
    expect(parseValorPlanilha('', ',')).toEqual({ ok: false });
    expect(parseValorPlanilha('R$', ',')).toEqual({ ok: false });
    expect(parseValorPlanilha('abc', ',')).toEqual({ ok: false });
  });
});

describe('centavosDeNumero (XLSX numérico nativo, D3)', () => {
  it('converte número direto da planilha em centavos inteiros', () => {
    expect(centavosDeNumero(12.5)).toBe(1250);
    expect(centavosDeNumero(1234)).toBe(123400);
    expect(centavosDeNumero(-45)).toBe(-4500);
  });
});

describe('totalCentavos — soma em inteiros (CA05.7)', () => {
  it('0,10 + 0,20 = 30 centavos, sem erro de ponto flutuante', () => {
    const dez = parseValorPlanilha('0,10', ',');
    const vinte = parseValorPlanilha('0,20', ',');
    expect(dez.ok && vinte.ok).toBe(true);
    if (dez.ok && vinte.ok) {
      expect(totalCentavos([dez.centavos, vinte.centavos])).toBe(30);
    }
  });
});

describe('formatarMoeda (D1 — moeda segue o idioma)', () => {
  it('formata em BRL, EUR e USD conforme o idioma, mesmos centavos, sem converter', () => {
    // 1.800.000 centavos = R$/€/$ 18.000,00 — valor de 5 dígitos para evitar a
    // particularidade do CLDR es-ES, que só agrupa milhar a partir de 5 dígitos.
    expect(normalizarEspacos(formatarMoeda(1800000, 'pt-BR'))).toBe('R$ 18.000,00');
    expect(normalizarEspacos(formatarMoeda(1800000, 'es'))).toBe('18.000,00 €');
    expect(normalizarEspacos(formatarMoeda(1800000, 'en'))).toBe('$18,000.00');
  });

  it('es-ES não agrupa milhar em valores de 4 dígitos (comportamento real do CLDR, não é bug)', () => {
    expect(normalizarEspacos(formatarMoeda(324000, 'es'))).toBe('3240,00 €');
  });
});
