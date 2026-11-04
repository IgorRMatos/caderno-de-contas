import type { CelulaBruta, TabelaBruta } from '../domain/import/types.js';

/**
 * SheetJS CE 0.20.3, vendido do tarball oficial (nunca do npm — ver
 * package.json `xlsx: file:./vendor/xlsx-0.20.3.tgz`). Carregado só quando
 * chega um .xlsx (`import()`), nunca no bundle inicial (D14).
 */
export async function parseXLSX(arquivo: File): Promise<TabelaBruta> {
  const XLSX = await import('xlsx');
  const buffer = await arquivo.arrayBuffer();
  const livro = XLSX.read(buffer, { type: 'array', cellDates: true });

  const nomeAba = livro.SheetNames[0];
  if (nomeAba === undefined) return { colunas: [], linhas: [] };

  const planilha = livro.Sheets[nomeAba];
  if (planilha === undefined) return { colunas: [], linhas: [] };

  const linhas = XLSX.utils.sheet_to_json<CelulaBruta[]>(planilha, {
    header: 1,
    raw: true,
    defval: '',
  });

  const primeira = linhas[0] ?? [];
  const colunas = primeira.map((c) => String(c));
  return { colunas, linhas: linhas.slice(1) };
}
