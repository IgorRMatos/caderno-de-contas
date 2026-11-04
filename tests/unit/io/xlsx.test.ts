import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseXLSX } from '../../../src/io/xlsx';

const FIXTURES = join(__dirname, '../../fixtures');

function arquivoDeFixture(nome: string): File {
  const buf = readFileSync(join(FIXTURES, nome));
  return new File([buf], nome);
}

describe('parseXLSX — lazy load do SheetJS, 1ª aba (CA01.5)', () => {
  it('lê cabeçalhos e linhas da primeira aba, com Date e número nativos', async () => {
    const tabela = await parseXLSX(arquivoDeFixture('exemplo.xlsx'));
    expect(tabela.colunas).toEqual(['data', 'descricao', 'valor', 'tipo', 'categoria']);
    expect(tabela.linhas).toHaveLength(3);

    const [primeira] = tabela.linhas;
    expect(primeira?.[0]).toBeInstanceOf(Date);
    expect(primeira?.[2]).toBe(1500);
  });
});
