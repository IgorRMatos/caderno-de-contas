import { describe, expect, it } from 'vitest';
import { EXEMPLO_CSV } from '../../../src/domain/exemploDados';
import {
  desneutralizarFormula,
  gerarCSV,
  neutralizarFormula,
  nomeArquivoExport,
  valorParaCSV,
} from '../../../src/domain/export';
import { processarTabela } from '../../../src/domain/import/normalize';
import type { Categoria, Lancamento } from '../../../src/domain/types';
import { parseCSV } from '../../../src/io/csv';

const BOM = String.fromCharCode(0xfeff);

function lanc(p: Partial<Lancamento>): Lancamento {
  return {
    id: 'x',
    data: '2026-10-01',
    descricao: 'Farinha',
    valorCentavos: 12345,
    tipo: 'saida',
    categoria: 'fornecedores',
    origem: 'manual',
    criadoEm: '2026-10-01T12:00:00.000Z',
    ...p,
  };
}

/** O que precisa sobreviver à ida e volta (id/criadoEm/origem são do registro, não do dado). */
function essencial(l: Lancamento) {
  return {
    data: l.data,
    descricao: l.descricao,
    valorCentavos: l.valorCentavos,
    tipo: l.tipo,
    categoria: l.categoria,
  };
}

/** Exporta → lê pelo pipeline real de importação (io/csv + readFile sem BOM + normalize). */
function idaEVolta(lista: Lancamento[], categorias: Categoria[], idioma: 'pt-BR' | 'es' | 'en') {
  const csv = gerarCSV(lista, categorias);
  const semBom = csv.replace(new RegExp('^' + BOM), ''); // o que io/readFile.ts faz
  return processarTabela(parseCSV(semBom), idioma, 'importado');
}

describe('export — formato D11', () => {
  it('cabeçalho igual ao exemplo.csv, separador ;, UTF-8 com BOM', () => {
    const csv = gerarCSV([lanc({})], []);
    expect(csv.startsWith(BOM)).toBe(true);
    const linhas = csv.slice(1).split('\n');
    expect(linhas[0]).toBe(EXEMPLO_CSV.split('\n')[0]!.trim());
    expect(linhas[0]).toBe('data;descricao;valor;tipo;categoria');
    expect(linhas[1]).toBe('2026-10-01;Farinha;123,45;saida;fornecedores');
  });

  it('valor 1234,56 sem separador de milhar e sem float', () => {
    expect(valorParaCSV(123456)).toBe('1234,56');
    expect(valorParaCSV(5)).toBe('0,05');
    expect(valorParaCSV(100)).toBe('1,00');
    expect(valorParaCSV(999999999)).toBe('9999999,99');
  });

  it('usa o nome da categoria (não o id) quando ela está cadastrada', () => {
    const csv = gerarCSV(
      [lanc({ categoria: 'embalagens-kraft' })],
      [{ id: 'embalagens-kraft', nome: 'Embalagens Kraft', personalizada: true }],
    );
    expect(csv).toContain(';Embalagens Kraft\n');
  });

  it('põe aspas (RFC 4180) quando a célula tem ; aspas ou quebra de linha', () => {
    const csv = gerarCSV([lanc({ descricao: 'Pão; "francês"\nduas linhas' })], []);
    expect(csv).toContain('"Pão; ""francês""\nduas linhas"');
  });

  it('nome do arquivo: caderno-AAAA-MM-DD.csv com a data local', () => {
    expect(nomeArquivoExport(new Date(2026, 0, 5, 23, 59))).toBe('caderno-2026-01-05.csv');
  });
});

describe('export — neutralizar fórmula (CSV injection, D11)', () => {
  it.each(['=SOMA(A1)', '+55 11', '-desconto', '@usuario', '\tcom tab', '\rcom cr'])(
    "célula começando com %j recebe prefixo '",
    (c) => {
      expect(neutralizarFormula(c)).toBe(`'${c}`);
    },
  );

  it('texto comum não muda', () => {
    expect(neutralizarFormula('Farinha')).toBe('Farinha');
    expect(neutralizarFormula("'citação")).toBe("'citação");
    expect(neutralizarFormula('')).toBe('');
  });

  it('desneutralizar só tira o apóstrofo que o export pôs', () => {
    expect(desneutralizarFormula("'=SOMA(A1)")).toBe('=SOMA(A1)');
    expect(desneutralizarFormula("'citação")).toBe("'citação");
    expect(desneutralizarFormula("'")).toBe("'");
  });

  it('nenhuma linha exportada começa célula com caractere de fórmula', () => {
    const csv = gerarCSV(
      [lanc({ descricao: '=HYPERLINK("http://x","clique")' }), lanc({ descricao: '@SUM(1)' })],
      [{ id: 'fornecedores', nome: '+Fornecedores', personalizada: true }],
    );
    for (const linha of csv.slice(1).trim().split('\n').slice(1)) {
      for (const celula of linha.split(';')) {
        expect(celula.replace(/^"/, '')).not.toMatch(/^[=+\-@\t\r]/);
      }
    }
  });
});

describe('export — ida e volta: exportar → importar = mesmos lançamentos (D11)', () => {
  it('casos difíceis: fórmula, aspas, ;, quebra de linha, acento, centavos, entrada/saída', () => {
    const categorias: Categoria[] = [
      { id: 'embalagens-kraft', nome: 'Embalagens Kraft', personalizada: true },
      { id: 'vendas', nome: 'Vendas', personalizada: false },
    ];
    const lista = [
      lanc({ descricao: '=SOMA(A1:A9)', categoria: 'embalagens-kraft' }),
      lanc({ descricao: '-10% fornecedor', valorCentavos: 1 }),
      lanc({ descricao: '+ venda extra', tipo: 'entrada', categoria: 'vendas' }),
      lanc({ descricao: '@loja "centro"; balcão', valorCentavos: 123456789 }),
      lanc({ descricao: 'Pão\nde queijo', data: '2025-12-31', valorCentavos: 100 }),
      lanc({ descricao: 'Ação & coração ñ ü', categoria: 'outros' }),
      lanc({ descricao: '' }),
    ];
    for (const idioma of ['pt-BR', 'es', 'en'] as const) {
      const r = idaEVolta(lista, categorias, idioma);
      expect(r.precisaMapeamento).toBe(false);
      expect(r.invalidas).toBe(0);
      expect(r.semCategoria).toBe(0);
      expect(r.lancamentos.map(essencial)).toEqual(lista.map(essencial));
      expect(r.categoriasEncontradas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'embalagens-kraft', nome: 'Embalagens Kraft' }),
        ]),
      );
    }
  });

  it('dados de exemplo inteiros (Padaria) sobrevivem à ida e volta', () => {
    const original = processarTabela(parseCSV(EXEMPLO_CSV), 'pt-BR', 'exemplo');
    expect(original.lancamentos.length).toBe(EXEMPLO_CSV.trim().split('\n').length - 1);
    const r = idaEVolta(original.lancamentos, original.categoriasEncontradas, 'pt-BR');
    expect(r.lancamentos.map(essencial)).toEqual(original.lancamentos.map(essencial));
    const soma = r.lancamentos.reduce((s, l) => s + l.valorCentavos, 0);
    expect(Number.isSafeInteger(soma)).toBe(true);
  });

  it('lista vazia exporta só o cabeçalho', () => {
    expect(gerarCSV([], [])).toBe(BOM + 'data;descricao;valor;tipo;categoria\n');
  });
});
