import { describe, expect, it } from 'vitest';
import { CATEGORIA_SEM_NOME } from '../../../../src/config';
import { processarTabela } from '../../../../src/domain/import/normalize';
import type { TabelaBruta } from '../../../../src/domain/import/types';

describe('processarTabela — CA01.2, CA02.1-3', () => {
  it('importa lançamentos válidos com cabeçalhos reconhecidos automaticamente', () => {
    const tabela: TabelaBruta = {
      colunas: ['data', 'descricao', 'valor', 'tipo', 'categoria'],
      linhas: [
        ['2026-10-01', 'Venda balcao', '1.500,00', 'entrada', 'Vendas'],
        ['2026-10-02', 'Farinha', '450,00', 'saida', 'Fornecedores'],
      ],
    };
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    expect(r.precisaMapeamento).toBe(false);
    expect(r.invalidas).toBe(0);
    expect(r.lancamentos).toHaveLength(2);
    expect(r.lancamentos[0]).toMatchObject({
      data: '2026-10-01',
      descricao: 'Venda balcao',
      valorCentavos: 150000,
      tipo: 'entrada',
      categoria: 'vendas',
      origem: 'importado',
    });
    expect(r.categoriasEncontradas).toEqual(
      expect.arrayContaining([
        { id: 'vendas', nome: 'Vendas', personalizada: false },
        { id: 'fornecedores', nome: 'Fornecedores', personalizada: false },
      ]),
    );
  });

  it('CA01.7 — sem categoria vai para "Outros" e conta em semCategoria', () => {
    const tabela: TabelaBruta = {
      colunas: ['data', 'valor'],
      linhas: [['2026-10-01', '100,00']],
    };
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    expect(r.lancamentos[0]?.categoria).toBe(CATEGORIA_SEM_NOME);
    expect(r.semCategoria).toBe(1);
  });

  it('CA01.8 — linhas inválidas (sem data ou valor legível) são ignoradas e contadas', () => {
    const tabela: TabelaBruta = {
      colunas: ['data', 'valor'],
      linhas: [
        ['2026-10-01', '100,00'],
        ['data invalida', '100,00'],
        ['2026-10-02', 'abc'],
        ['2026-10-03', '200,00'],
      ],
    };
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    expect(r.lancamentos).toHaveLength(2);
    expect(r.invalidas).toBe(2);
  });

  it('CA01.6(b) — sem coluna de tipo, infere pelo sinal do valor', () => {
    const tabela: TabelaBruta = {
      colunas: ['data', 'valor'],
      linhas: [
        ['2026-10-01', '100,00'],
        ['2026-10-02', '-50,00'],
      ],
    };
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    expect(r.lancamentos[0]).toMatchObject({ tipo: 'entrada', valorCentavos: 10000 });
    expect(r.lancamentos[1]).toMatchObject({ tipo: 'saida', valorCentavos: 5000 });
  });

  it('CA01.6(a) — coluna de tipo explícita tem prioridade sobre o sinal', () => {
    const tabela: TabelaBruta = {
      colunas: ['data', 'valor', 'tipo'],
      linhas: [['2026-10-01', '100,00', 'saida']],
    };
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    expect(r.lancamentos[0]?.tipo).toBe('saida');
  });

  it('CA02.1/CA02.4 — cabeçalhos não reconhecidos pedem mapeamento manual', () => {
    const tabela: TabelaBruta = {
      colunas: ['Quando', 'Quanto'],
      linhas: [['01/10/2026', '100,00']],
    };
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    expect(r.precisaMapeamento).toBe(true);
    expect(r.lancamentos).toHaveLength(0);
    expect(r.palpite).toEqual({});
  });

  it('CA02.2 — aceita mapeamento manual informado pelo usuário', () => {
    const tabela: TabelaBruta = {
      colunas: ['Quando', 'Quanto'],
      linhas: [['01/10/2026', '100,00']],
    };
    const r = processarTabela(tabela, 'pt-BR', 'importado', { data: 0, valor: 1 });
    expect(r.precisaMapeamento).toBe(false);
    expect(r.lancamentos).toHaveLength(1);
    expect(r.lancamentos[0]?.data).toBe('2026-10-01');
  });

  it('entende célula numérica e Date nativos do XLSX (D3/D4)', () => {
    const tabela: TabelaBruta = {
      colunas: ['data', 'valor'],
      linhas: [[new Date(Date.UTC(2026, 9, 15)), 1500]],
    };
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    expect(r.lancamentos[0]).toMatchObject({
      data: '2026-10-15',
      valorCentavos: 150000,
      tipo: 'entrada',
    });
  });

  it('previa5 traz só as 5 primeiras linhas', () => {
    const linhas = Array.from({ length: 10 }, (_, i) => [`2026-10-0${(i % 9) + 1}`, '10,00']);
    const tabela: TabelaBruta = { colunas: ['data', 'valor'], linhas };
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    expect(r.previa5).toHaveLength(5);
  });
});

describe('processarTabela — performance (CA01.4, T2)', () => {
  it('5.000 linhas processam em menos de 2s', () => {
    const linhas = Array.from({ length: 5000 }, (_, i) => [
      `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
      `${(i % 500) + 1},50`,
      i % 2 === 0 ? 'entrada' : 'saida',
      'Categoria ' + (i % 8),
    ]);
    const tabela: TabelaBruta = { colunas: ['data', 'valor', 'tipo', 'categoria'], linhas };

    const inicio = performance.now();
    const r = processarTabela(tabela, 'pt-BR', 'importado');
    const duracao = performance.now() - inicio;

    expect(r.lancamentos).toHaveLength(5000);
    expect(duracao).toBeLessThan(2000);
  });
});
