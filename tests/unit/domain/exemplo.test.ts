import { describe, expect, it } from 'vitest';
import { categoriasDoMes, kpisDoMes } from '../../../src/domain/aggregate';
import { EXEMPLO_CSV } from '../../../src/domain/exemploDados';
import { processarTabela } from '../../../src/domain/import/normalize';
import { parseCSV } from '../../../src/io/csv';

describe('exemplo.csv (T8) — KPIs batem com o mockup 04 / UX §10.7', () => {
  const tabela = parseCSV(EXEMPLO_CSV);
  const relatorio = processarTabela(tabela, 'pt-BR', 'exemplo');

  it('importa sem linhas inválidas e sem precisar de mapeamento manual', () => {
    expect(relatorio.precisaMapeamento).toBe(false);
    expect(relatorio.invalidas).toBe(0);
    expect(relatorio.semCategoria).toBe(0);
  });

  it('cobre 6 meses (mai a out/2026) e pelo menos 6 categorias (CA03.2)', () => {
    const meses = new Set(relatorio.lancamentos.map((l) => l.data.slice(0, 7)));
    expect(meses).toEqual(
      new Set(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']),
    );

    const categorias = new Set(relatorio.lancamentos.map((l) => l.categoria));
    expect(categorias.size).toBeGreaterThanOrEqual(6);
  });

  it('outubro: entrou R$ 18.000,00 / saiu R$ 14.760,00 / sobrou R$ 3.240,00 / margem 18%', () => {
    const k = kpisDoMes(relatorio.lancamentos, '2026-10');
    expect(k.entrouCentavos).toBe(1_800_000);
    expect(k.saiuCentavos).toBe(1_476_000);
    expect(k.sobrouCentavos).toBe(324_000);
    expect(k.margemPercentual).toBe(18);
  });

  it('julho é o único mês no vermelho, sobrou -R$ 750,00 (CA03.2 sazonalidade)', () => {
    const meses = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    const sobras = meses.map((m) => kpisDoMes(relatorio.lancamentos, m).sobrouCentavos);
    expect(sobras.filter((s) => s < 0)).toEqual([-75_000]);
    expect(kpisDoMes(relatorio.lancamentos, '2026-07').sobrouCentavos).toBe(-75_000);
  });

  it('outubro é o melhor mês (maior sobra) de todos os 6 (CA03.2)', () => {
    const meses = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    const sobras = meses.map((m) => kpisDoMes(relatorio.lancamentos, m).sobrouCentavos);
    expect(Math.max(...sobras)).toBe(324_000);
  });

  it('categorias de outubro batem exatamente com o mockup (fornecedores 42%, ordenado)', () => {
    const cats = categoriasDoMes(relatorio.lancamentos, '2026-10');
    expect(cats[0]).toMatchObject({
      categoria: 'fornecedores',
      valorCentavos: 620_000,
      percentual: 42,
    });
    expect(cats.reduce((total, c) => total + c.valorCentavos, 0)).toBe(1_476_000);
  });

  it('todos os lançamentos vêm com origem "exemplo"', () => {
    expect(relatorio.lancamentos.every((l) => l.origem === 'exemplo')).toBe(true);
  });
});
