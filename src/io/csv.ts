import Papa from 'papaparse';
import type { TabelaBruta } from '../domain/import/types.js';

/** PapaParse detecta delimitador (`,` `;` `\t`), aspas etc. sozinho. */
export function parseCSV(texto: string): TabelaBruta {
  const resultado = Papa.parse<string[]>(texto, {
    skipEmptyLines: true,
  });

  const linhas = resultado.data;
  const colunas = (linhas[0] ?? []).map((c) => String(c));
  return { colunas, linhas: linhas.slice(1) };
}
