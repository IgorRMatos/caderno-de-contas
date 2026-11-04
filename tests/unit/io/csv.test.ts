import { describe, expect, it } from 'vitest';
import { parseCSV } from '../../../src/io/csv';

describe('parseCSV — detecção de delimitador (CA01.5)', () => {
  it('lê CSV separado por vírgula', () => {
    const t = parseCSV('data,valor\n2026-10-01,100,00');
    expect(t.colunas).toEqual(['data', 'valor']);
  });

  it('lê CSV separado por ponto e vírgula', () => {
    const t = parseCSV('data;valor\n01/10/2026;100,00\n02/10/2026;200,00');
    expect(t.colunas).toEqual(['data', 'valor']);
    expect(t.linhas).toEqual([
      ['01/10/2026', '100,00'],
      ['02/10/2026', '200,00'],
    ]);
  });

  it('lida com aspas e valores entre aspas', () => {
    const t = parseCSV('data,descricao,valor\n2026-10-01,"Venda, balcão","1.500,00"');
    expect(t.linhas[0]).toEqual(['2026-10-01', 'Venda, balcão', '1.500,00']);
  });

  it('pula linhas vazias', () => {
    const t = parseCSV('data,valor\n2026-10-01,100\n\n2026-10-02,200\n');
    expect(t.linhas).toHaveLength(2);
  });
});
