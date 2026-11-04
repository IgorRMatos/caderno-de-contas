import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lerTextoArquivo } from '../../../src/io/readFile';

const FIXTURES = join(__dirname, '../../fixtures');

function arquivoDeFixture(nome: string): File {
  const buf = readFileSync(join(FIXTURES, nome));
  return new File([buf], nome);
}

describe('lerTextoArquivo — detecção de codificação (CA01.5)', () => {
  it('lê UTF-8 normalmente', async () => {
    const texto = await lerTextoArquivo(arquivoDeFixture('utf8-virgula.csv'));
    expect(texto).toContain('descricao,valor,tipo,categoria');
  });

  it('cai para windows-1252 quando o arquivo não é UTF-8 válido', async () => {
    const texto = await lerTextoArquivo(arquivoDeFixture('latin1.csv'));
    expect(texto).toContain('pães e baguetes');
    expect(texto).toContain('Energia e gás');
  });

  it('remove o BOM se presente', async () => {
    const comBom = new File([new Uint8Array([0xef, 0xbb, 0xbf]), 'a,b\n1,2'], 'bom.csv');
    const texto = await lerTextoArquivo(comBom);
    expect(texto.startsWith('a,b')).toBe(true);
  });
});
