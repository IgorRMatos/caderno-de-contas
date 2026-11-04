import { beforeEach, describe, expect, it } from 'vitest';
import {
  categoriasDoMesAtual,
  insightsAtuais,
  kpisAtuais,
  mesReferencia,
  projecaoAtual,
} from '../../../src/state/derivados';
import { filtros, FILTROS_PADRAO, lancamentos } from '../../../src/state/signals';
import { construirLancamentosPadaria } from '../domain/_fixtures/padaria';

beforeEach(() => {
  lancamentos.value = [];
  filtros.value = FILTROS_PADRAO;
});

describe('state/derivados — filtrados → agregados → insights (T4)', () => {
  it('sem lançamentos: mesReferencia null, KPIs null, insights vazios com motivo', () => {
    expect(mesReferencia.value).toBeNull();
    expect(kpisAtuais.value).toBeNull();
    expect(insightsAtuais.value.motivoVazio).toBe('sem-dados-mes');
  });

  it('com a Padaria: mesReferencia = outubro, KPIs batem com o mockup 04', () => {
    lancamentos.value = construirLancamentosPadaria();
    expect(mesReferencia.value).toBe('2026-10');
    expect(kpisAtuais.value).toMatchObject({
      entrouCentavos: 1_800_000,
      saiuCentavos: 1_476_000,
      sobrouCentavos: 324_000,
      margemPercentual: 18,
    });
  });

  it('categoriasDoMesAtual reage à mudança de lançamentos (reatividade do signal)', () => {
    expect(categoriasDoMesAtual.value).toEqual([]);
    lancamentos.value = construirLancamentosPadaria();
    expect(categoriasDoMesAtual.value[0]).toMatchObject({
      categoria: 'fornecedores',
      percentual: 42,
    });
  });

  it('filtro de categoria muda o mês de referência e os KPIs sem mexer na lista completa', () => {
    lancamentos.value = construirLancamentosPadaria();
    filtros.value = { periodo: { tipo: 'ultimo-mes' }, categorias: ['aluguel'] };
    expect(mesReferencia.value).toBe('2026-10');
    expect(kpisAtuais.value?.saiuCentavos).toBe(220_000); // só aluguel
    expect(lancamentos.value).toHaveLength(17); // lista-base intocada
  });

  it('insights e projeção ficam consistentes entre si (projeção usada pelos insights)', () => {
    lancamentos.value = construirLancamentosPadaria();
    expect(projecaoAtual.value?.semDados).toBe(false);
    expect(insightsAtuais.value.insights.some((i) => i.chave.startsWith('projecao_'))).toBe(true);
  });
});
