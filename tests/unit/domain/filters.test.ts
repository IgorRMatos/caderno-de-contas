import { describe, expect, it } from 'vitest';
import {
  anoMesDeslocado,
  aplicarFiltroCategorias,
  filtroResultaVazio,
  resolverJanelaExibicao,
  resolverMesReferencia,
} from '../../../src/domain/filters';
import type { Filtros } from '../../../src/domain/types';
import { construirLancamentosPadaria } from './_fixtures/padaria';

function periodo(
  tipo: Filtros['periodo']['tipo'],
  extra: Partial<Filtros['periodo']> = {},
): Filtros['periodo'] {
  return { tipo, ...extra };
}

describe('anoMesDeslocado', () => {
  it('desloca para frente e para trás, cruzando o ano', () => {
    expect(anoMesDeslocado('2026-10', 1)).toBe('2026-11');
    expect(anoMesDeslocado('2026-12', 1)).toBe('2027-01');
    expect(anoMesDeslocado('2026-01', -1)).toBe('2025-12');
  });
});

describe('resolverMesReferencia (D5)', () => {
  const lancamentos = construirLancamentosPadaria();

  it('padrão = último mês com dados', () => {
    expect(resolverMesReferencia(lancamentos, periodo('ultimo-mes'))).toBe('2026-10');
    expect(resolverMesReferencia(lancamentos, periodo('tudo'))).toBe('2026-10');
  });

  it('sem nenhum lançamento → null', () => {
    expect(resolverMesReferencia([], periodo('ultimo-mes'))).toBeNull();
  });
});

describe('resolverJanelaExibicao (CA08.1)', () => {
  const lancamentos = construirLancamentosPadaria();

  it('"último mês" mostra só o mês de referência', () => {
    expect(resolverJanelaExibicao(lancamentos, periodo('ultimo-mes'))).toEqual({
      de: '2026-10',
      ate: '2026-10',
    });
  });

  it('"últimos 3 meses" mostra ago-set-out', () => {
    expect(resolverJanelaExibicao(lancamentos, periodo('ultimos-3'))).toEqual({
      de: '2026-08',
      ate: '2026-10',
    });
  });

  it('"este ano" usa o ano do último mês com dados, não o relógio', () => {
    expect(resolverJanelaExibicao(lancamentos, periodo('este-ano'))).toEqual({
      de: '2026-01',
      ate: '2026-10',
    });
  });

  it('"tudo" cobre do primeiro ao último mês com dados', () => {
    expect(resolverJanelaExibicao(lancamentos, periodo('tudo'))).toEqual({
      de: '2026-05',
      ate: '2026-10',
    });
  });
});

describe('aplicarFiltroCategorias (CA08.1)', () => {
  const lancamentos = construirLancamentosPadaria();

  it('vazio = todas as categorias', () => {
    expect(aplicarFiltroCategorias(lancamentos, [])).toHaveLength(lancamentos.length);
  });

  it('filtra só as categorias pedidas', () => {
    const r = aplicarFiltroCategorias(lancamentos, ['aluguel']);
    expect(r).toHaveLength(1);
    expect(r[0]?.categoria).toBe('aluguel');
  });
});

describe('filtroResultaVazio (CA08.5)', () => {
  it('categoria sem nenhum lançamento no período → true', () => {
    const lancamentos = construirLancamentosPadaria();
    const semEssaCategoria = aplicarFiltroCategorias(lancamentos, ['categoria-que-nao-existe']);
    expect(filtroResultaVazio(semEssaCategoria, periodo('ultimo-mes'))).toBe(true);
  });

  it('categoria presente no mês de referência → false', () => {
    const lancamentos = construirLancamentosPadaria();
    const comAluguel = aplicarFiltroCategorias(lancamentos, ['aluguel']);
    expect(filtroResultaVazio(comAluguel, periodo('ultimo-mes'))).toBe(false);
  });

  it('sem nenhum lançamento → true', () => {
    expect(filtroResultaVazio([], periodo('ultimo-mes'))).toBe(true);
  });
});
