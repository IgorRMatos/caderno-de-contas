import { describe, expect, it } from 'vitest';
import { calcularProjecao } from '../../../src/domain/projection';
import { gerarInsights } from '../../../src/domain/insights';
import type { Lancamento } from '../../../src/domain/types';
import { construirLancamentosPadaria } from './_fixtures/padaria';

const AGORA = new Date(2026, 10, 3);

function chaves(lancamentos: Lancamento[], mes: string) {
  const projecao = calcularProjecao(lancamentos, mes, AGORA);
  return gerarInsights(lancamentos, mes, projecao).insights.map((i) => i.chave);
}

describe('gerarInsights — CA07.1 (3 a 5 frases, Padaria outubro)', () => {
  const lancamentos = construirLancamentosPadaria();

  it('gera entre 3 e 5 candidatos, com o resumo do mês em 1º (maior prioridade)', () => {
    const resultado = gerarInsights(
      lancamentos,
      '2026-10',
      calcularProjecao(lancamentos, '2026-10', AGORA),
    );
    expect(resultado.insights.length).toBeGreaterThanOrEqual(3);
    expect(resultado.insights.length).toBeLessThanOrEqual(5);
    expect(resultado.insights[0]?.chave).toBe('resumo_positivo');
    expect(resultado.insights[0]?.params).toMatchObject({ mes: '2026-10', percentual: 18 });
    expect(resultado.motivoVazio).toBeNull();
  });

  it('inclui o maior gasto por categoria (fornecedores, 42%)', () => {
    const ks = chaves(lancamentos, '2026-10');
    expect(ks).toContain('maior_categoria');
  });

  it('inclui o mês histórico no vermelho mais recente (julho)', () => {
    const resultado = gerarInsights(
      lancamentos,
      '2026-10',
      calcularProjecao(lancamentos, '2026-10', AGORA),
    );
    const insight = resultado.insights.find((i) => i.chave === 'mes_vermelho_historico');
    expect(insight?.params).toEqual({ mes: '2026-07', valorCentavos: 75_000 });
  });

  it('inclui a projeção/ritmo do próximo mês', () => {
    expect(chaves(lancamentos, '2026-10')).toContain('projecao_azul');
  });
});

describe('gerarInsights — mês no vermelho (resumo_negativo)', () => {
  it('julho (sobrou negativo) gera resumo_negativo em 1º lugar', () => {
    const lancamentos = construirLancamentosPadaria();
    const resultado = gerarInsights(
      lancamentos,
      '2026-07',
      calcularProjecao(lancamentos, '2026-07', AGORA),
    );
    expect(resultado.insights[0]).toMatchObject({
      chave: 'resumo_negativo',
      params: { mes: '2026-07', valorCentavos: 75_000 },
    });
  });
});

describe('gerarInsights — categoria subindo > 25% (T3 — X = 25%)', () => {
  it('detecta categoria que sobe bem acima da média dos últimos 3 meses', () => {
    const base: Lancamento[] = [];
    let seq = 0;
    function l(
      data: string,
      valor: number,
      tipo: 'entrada' | 'saida',
      categoria: string,
    ): Lancamento {
      seq++;
      return {
        id: `s${seq}`,
        data,
        descricao: '',
        valorCentavos: valor * 100,
        tipo,
        categoria,
        origem: 'exemplo',
        criadoEm: new Date().toISOString(),
      };
    }
    for (const mes of ['07', '08', '09']) {
      base.push(l(`2026-${mes}-10`, 1000, 'entrada', 'vendas'));
      base.push(l(`2026-${mes}-11`, 100, 'saida', 'energia'));
    }
    base.push(l('2026-10-10', 1000, 'entrada', 'vendas'));
    base.push(l('2026-10-11', 200, 'saida', 'energia')); // +100% vs média de 100

    const resultado = gerarInsights(base, '2026-10', calcularProjecao(base, '2026-10', AGORA));
    const insight = resultado.insights.find((i) => i.chave === 'categoria_subindo');
    expect(insight).toBeDefined();
    expect(insight?.params.categoria).toBe('energia');
    expect(insight?.params.percentual).toBe(100);
  });
});

describe('gerarInsights — CA07.4 (sem dados suficientes)', () => {
  it('mês sem nenhum lançamento → lista vazia + motivo, nunca frase com valores vazios', () => {
    const resultado = gerarInsights([], '2026-10', calcularProjecao([], '2026-10', AGORA));
    expect(resultado.insights).toEqual([]);
    expect(resultado.motivoVazio).toBe('sem-dados-mes');
  });
});
