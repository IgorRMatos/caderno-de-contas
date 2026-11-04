export type CampoPlanilha = 'data' | 'descricao' | 'valor' | 'tipo' | 'categoria';

export function normalizarTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** CA02.1 — sinônimos de cabeçalho em PT/ES/EN (case/acento-insensitive). */
const SINONIMOS_CABECALHO: Record<CampoPlanilha, string[]> = {
  data: ['data', 'fecha', 'date'],
  descricao: ['descricao', 'descripcion', 'description', 'historico', 'concepto', 'memo'],
  valor: ['valor', 'monto', 'amount', 'quantia', 'importe'],
  tipo: ['tipo', 'type', 'natureza'],
  categoria: ['categoria', 'category', 'categoria/rubro', 'rubro'],
};

const CAMPOS: readonly CampoPlanilha[] = ['data', 'descricao', 'valor', 'tipo', 'categoria'];

/** CA02.2 — palpite de mapeamento de colunas a partir dos cabeçalhos. */
export function inferirMapeamentoColunas(
  cabecalhos: readonly string[],
): Partial<Record<CampoPlanilha, number>> {
  const normalizados = cabecalhos.map(normalizarTexto);
  const mapeamento: Partial<Record<CampoPlanilha, number>> = {};

  for (const campo of CAMPOS) {
    const idx = normalizados.findIndex((h) => SINONIMOS_CABECALHO[campo].includes(h));
    if (idx !== -1) mapeamento[campo] = idx;
  }
  return mapeamento;
}

/** CA01.6(a) — sinônimos de valor de célula para a coluna "tipo" (case-insensitive). */
const PALAVRAS_ENTRADA = new Set([
  'entrada',
  'receita',
  'credito',
  'in',
  'income',
  'ingreso',
  'ingresos',
]);
const PALAVRAS_SAIDA = new Set(['saida', 'despesa', 'debito', 'out', 'expense', 'gasto', 'egreso']);

export function inferirTipoPorTexto(valorCelula: string): 'entrada' | 'saida' | null {
  const v = normalizarTexto(valorCelula);
  if (PALAVRAS_ENTRADA.has(v)) return 'entrada';
  if (PALAVRAS_SAIDA.has(v)) return 'saida';
  return null;
}
