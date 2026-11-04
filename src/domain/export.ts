import type { Categoria, Lancamento } from './types.js';

/**
 * D11 — lançamentos → CSV reimportável, no mesmo formato do `exemplo.csv`:
 * cabeçalho `data;descricao;valor;tipo;categoria`, separador `;`, UTF-8 com
 * BOM (o Excel em pt-BR abre com acento certo), valor `1234,56` (sem milhar,
 * vírgula decimal, sempre positivo — o sinal vem de `tipo`), data `AAAA-MM-DD`.
 * Puro: sem DOM; o download (Blob + `<a download>`) fica em `state/seusDados.ts`.
 */

export const CABECALHO_EXPORT = ['data', 'descricao', 'valor', 'tipo', 'categoria'] as const;
const SEPARADOR = ';';
const BOM = String.fromCharCode(0xfeff);

/** Primeiros caracteres que fazem Excel/Sheets/LibreOffice tratar a célula como fórmula. */
const INICIO_FORMULA = /^[=+\-@\t\r]/;

/**
 * D11 — neutraliza injeção de fórmula (CSV injection): célula que começa com
 * `= + - @ \t \r` ganha um `'` na frente, que as planilhas mostram como texto.
 */
export function neutralizarFormula(celula: string): string {
  return INICIO_FORMULA.test(celula) ? `'${celula}` : celula;
}

/**
 * Inverso de `neutralizarFormula`, usado na importação para a ida e volta
 * exportar → importar devolver o mesmo texto. Só remove o `'` quando ele vem
 * seguido de um caractere de fórmula (ou seja, quando fomos nós que pusemos).
 */
export function desneutralizarFormula(celula: string): string {
  return celula.length > 1 && celula[0] === "'" && INICIO_FORMULA.test(celula.slice(1))
    ? celula.slice(1)
    : celula;
}

/** Aspas RFC 4180 só quando precisa (separador, aspas ou quebra de linha). */
function escaparCSV(celula: string): string {
  return /[;"\r\n]/.test(celula) ? `"${celula.replace(/"/g, '""')}"` : celula;
}

/** Centavos inteiros → `1234,56`, sem float (D2). */
export function valorParaCSV(centavos: number): string {
  const abs = Math.abs(centavos);
  const inteiro = Math.floor(abs / 100);
  const resto = abs % 100;
  return `${inteiro},${resto.toString().padStart(2, '0')}`;
}

/**
 * Exporta o NOME da categoria (não o id): o importador faz `slugificar(nome)`,
 * que devolve o mesmo id, e o nome legível (ex.: "Embalagens Kraft") sobrevive
 * à ida e volta. Categoria sem cadastro (ex.: `outros`) sai pelo próprio id.
 */
export function gerarCSV(
  lancamentos: readonly Lancamento[],
  categorias: readonly Categoria[],
): string {
  const nomePorId = new Map(categorias.map((c) => [c.id, c.nome]));
  const linhas = [CABECALHO_EXPORT.join(SEPARADOR)];
  for (const l of lancamentos) {
    const celulas = [
      l.data,
      l.descricao,
      valorParaCSV(l.valorCentavos),
      l.tipo,
      nomePorId.get(l.categoria) ?? l.categoria,
    ];
    linhas.push(celulas.map((c) => escaparCSV(neutralizarFormula(c))).join(SEPARADOR));
  }
  return BOM + linhas.join('\n') + '\n';
}

/** UX §4.7 — `caderno-AAAA-MM-DD.csv`, com a data LOCAL de hoje (não UTC). */
export function nomeArquivoExport(hoje: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `caderno-${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}.csv`;
}
