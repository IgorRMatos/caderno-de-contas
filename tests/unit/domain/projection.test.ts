import { describe, expect, it } from 'vitest';
import { calcularProjecao } from '../../../src/domain/projection';
import type { Lancamento } from '../../../src/domain/types';
import { construirLancamentosPadaria } from './_fixtures/padaria';

const AGORA = new Date(2026, 10, 3); // 3 de novembro de 2026 (relógio local do teste)

describe('calcularProjecao — regra D6, média de ago-out = ~R$ 2.630 (UX §4.4)', () => {
  it('base = 3 últimos meses completos com dados (ago, set, out)', () => {
    const p = calcularProjecao(construirLancamentosPadaria(), '2026-10', AGORA);
    expect(p.baseMeses).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(p.semDados).toBe(false);
    expect(p.poucosMeses).toBe(false);
    expect(p.mediaSobrouCentavos).toBe(263_000); // (1900+2750+3240)/3 = 2630,00
  });

  it('projeta os 3 meses seguintes ao mês de referência com a média', () => {
    const p = calcularProjecao(construirLancamentosPadaria(), '2026-10', AGORA);
    expect(p.mesesProjetados.map((m) => m.anoMes)).toEqual(['2026-11', '2026-12', '2027-01']);
    expect(p.mesesProjetados.every((m) => m.sobrouCentavos === 263_000)).toBe(true);
  });

  it('desvio padrão é 0 só com 1 mês de base', () => {
    const umMes: Lancamento[] = construirLancamentosPadaria().filter((l) =>
      l.data.startsWith('2026-10'),
    );
    const p = calcularProjecao(umMes, '2026-10', AGORA);
    expect(p.baseMeses).toEqual(['2026-10']);
    expect(p.poucosMeses).toBe(true);
    expect(p.desvioPadraoSobrouCentavos).toBe(0);
  });

  it('0 meses de base → estado vazio (semDados), sem projeção', () => {
    const p = calcularProjecao([], '2026-10', AGORA);
    expect(p.semDados).toBe(true);
    expect(p.baseMeses).toEqual([]);
    expect(p.mesesProjetados).toEqual([]);
  });

  it('o mês de referência em andamento (igual ao mês do relógio) não entra na base', () => {
    const lancamentos = construirLancamentosPadaria();
    const agoraDentroDoMesDeReferencia = new Date(2026, 9, 20); // 20 de outubro de 2026
    const p = calcularProjecao(lancamentos, '2026-10', agoraDentroDoMesDeReferencia);
    // a base passa a terminar em setembro, não em outubro (ainda incompleto)
    expect(p.baseMeses).toEqual(['2026-07', '2026-08', '2026-09']);
  });
});
