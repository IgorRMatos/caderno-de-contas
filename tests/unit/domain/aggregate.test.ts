import { describe, expect, it } from 'vitest';
import {
  calcularVariacao,
  categoriasDoMes,
  fluxoMensal,
  fluxoNaJanela,
  kpisDoMes,
} from '../../../src/domain/aggregate';
import { construirLancamentosPadaria } from './_fixtures/padaria';

describe('kpisDoMes — números da Padaria batendo com o mockup 04 (UX §10.7)', () => {
  const lancamentos = construirLancamentosPadaria();

  it('outubro: entrou R$ 18.000,00, saiu R$ 14.760,00, sobrou R$ 3.240,00, margem 18%', () => {
    const k = kpisDoMes(lancamentos, '2026-10');
    expect(k.entrouCentavos).toBe(1_800_000);
    expect(k.saiuCentavos).toBe(1_476_000);
    expect(k.sobrouCentavos).toBe(324_000);
    expect(k.margemPercentual).toBe(18);
  });

  it('julho: sobrou -R$ 750,00 (mês no vermelho)', () => {
    const k = kpisDoMes(lancamentos, '2026-07');
    expect(k.sobrouCentavos).toBe(-75_000);
  });

  it('variação de outubro vs. setembro: entrou +9,8%≈10%, sobrou +18%', () => {
    const out = kpisDoMes(lancamentos, '2026-10');
    const set = kpisDoMes(lancamentos, '2026-09');
    const varEntrou = calcularVariacao(out.entrouCentavos, set.entrouCentavos);
    const varSobrou = calcularVariacao(out.sobrouCentavos, set.sobrouCentavos);
    expect(varEntrou).toEqual({ percentual: 10, direcao: 'up' }); // 18000 vs 16400 = 9.75% -> arredonda 10
    expect(varSobrou).toEqual({ percentual: 18, direcao: 'up' });
  });

  it('categorias de outubro: Fornecedores 42%, ordenadas do maior pro menor', () => {
    const cats = categoriasDoMes(lancamentos, '2026-10');
    expect(cats[0]).toEqual({ categoria: 'fornecedores', valorCentavos: 620_000, percentual: 42 });
    expect(cats.map((c) => c.categoria)).toEqual([
      'fornecedores',
      'folha-de-pagamento',
      'aluguel',
      'energia-e-gas',
      'embalagens',
      'outros',
    ]);
  });

  it('fluxo mensal cobre os 6 meses na ordem certa', () => {
    const fluxo = fluxoMensal(lancamentos);
    expect(fluxo.map((f) => f.anoMes)).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
  });
});

describe('kpisDoMes — margem "—" (CA05.3)', () => {
  it('entradas 0 → margemPercentual null, nunca NaN/Infinity', () => {
    const lancamentos = construirLancamentosPadaria()
      .filter((l) => l.tipo === 'saida' && l.categoria === 'fornecedores')
      .slice(0, 1);
    const k = kpisDoMes(lancamentos, lancamentos[0]!.data.slice(0, 7));
    expect(k.margemPercentual).toBeNull();
    expect(k.entrouCentavos).toBe(0);
  });

  it('mês sem nenhum lançamento → tudo zero, margem null', () => {
    const k = kpisDoMes([], '2099-01');
    expect(k).toEqual({
      entrouCentavos: 0,
      saiuCentavos: 0,
      sobrouCentavos: 0,
      margemPercentual: null,
    });
  });
});

describe('fluxoNaJanela (T10 — eixo do gráfico FluxoCaixa)', () => {
  const lancamentos = construirLancamentosPadaria();

  it('cobre exatamente a janela pedida, mesmo sendo menor que o histórico todo', () => {
    const fluxo = fluxoNaJanela(lancamentos, '2026-08', '2026-10');
    expect(fluxo.map((f) => f.anoMes)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(fluxo[2]).toMatchObject({ entrouCentavos: 1_800_000, sobrouCentavos: 324_000 });
  });

  it('de === ate: janela de um mês só (atalho "Último mês")', () => {
    expect(fluxoNaJanela(lancamentos, '2026-10', '2026-10')).toHaveLength(1);
  });

  it('mês sem nenhum lançamento dentro da janela vira zero, não é pulado', () => {
    const fluxo = fluxoNaJanela(lancamentos, '2026-01', '2026-05');
    expect(fluxo.map((f) => f.anoMes)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
    ]);
    expect(fluxo[0]).toEqual({
      anoMes: '2026-01',
      entrouCentavos: 0,
      saiuCentavos: 0,
      sobrouCentavos: 0,
    });
  });
});

describe('calcularVariacao — nunca Infinity (D5)', () => {
  it('mês anterior com valor 0 → null, não Infinity', () => {
    expect(calcularVariacao(1000, 0)).toBeNull();
  });
  it('queda vira direcao "down"', () => {
    expect(calcularVariacao(80, 100)).toEqual({ percentual: 20, direcao: 'down' });
  });
});
