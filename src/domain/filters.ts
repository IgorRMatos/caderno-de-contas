import { anoMesDeISO } from './dates.js';
import type { Filtros, Lancamento } from './types.js';

export function anoMesDeslocado(anoMes: string, delta: number): string {
  const partes = anoMes.split('-').map(Number) as [number, number];
  const [ano, mes] = partes;
  const d = new Date(Date.UTC(ano, mes - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function mesesComDados(lancamentos: readonly Lancamento[]): string[] {
  const set = new Set(lancamentos.map((l) => anoMesDeISO(l.data)));
  return [...set].sort();
}

export function mesTemDados(lancamentos: readonly Lancamento[], anoMes: string): boolean {
  return lancamentos.some((l) => anoMesDeISO(l.data) === anoMes);
}

export function ultimoMesComDados(lancamentos: readonly Lancamento[]): string | null {
  const meses = mesesComDados(lancamentos);
  return meses.length === 0 ? null : (meses[meses.length - 1] ?? null);
}

/** CA08.1 — filtro de categoria (vazio = todas), independente do período. */
export function aplicarFiltroCategorias(
  lancamentos: readonly Lancamento[],
  categorias: readonly string[],
): Lancamento[] {
  if (categorias.length === 0) return [...lancamentos];
  const set = new Set(categorias);
  return lancamentos.filter((l) => set.has(l.categoria));
}

/**
 * D5 — mês de referência: mês final do período filtrado; padrão = último mês
 * com dados. "Este ano" usa o ano do último mês com dados, não o relógio.
 * Recebe os lançamentos já filtrados por categoria (CA08.2): o período em si
 * não restringe o histórico usado por KPIs/insights/projeção, só ancora qual
 * é "o mês" e a janela de exibição dos gráficos (`resolverJanelaExibicao`).
 */
export function resolverMesReferencia(
  lancamentosComCategoria: readonly Lancamento[],
  periodo: Filtros['periodo'],
): string | null {
  const ultimo = ultimoMesComDados(lancamentosComCategoria);
  if (ultimo === null) return null;

  switch (periodo.tipo) {
    case 'mes':
      return periodo.de ?? ultimo;
    case 'intervalo':
      return periodo.ate ?? ultimo;
    default:
      return ultimo;
  }
}

/** Janela de meses a exibir nos gráficos (fluxo de caixa), conforme o atalho de período. */
export function resolverJanelaExibicao(
  lancamentosComCategoria: readonly Lancamento[],
  periodo: Filtros['periodo'],
): { de: string; ate: string } | null {
  const mesReferencia = resolverMesReferencia(lancamentosComCategoria, periodo);
  if (mesReferencia === null) return null;

  switch (periodo.tipo) {
    case 'ultimo-mes':
      return { de: mesReferencia, ate: mesReferencia };
    case 'ultimos-3':
      return { de: anoMesDeslocado(mesReferencia, -2), ate: mesReferencia };
    case 'este-ano': {
      const ano = mesReferencia.slice(0, 4);
      return { de: `${ano}-01`, ate: mesReferencia };
    }
    case 'tudo': {
      const meses = mesesComDados(lancamentosComCategoria);
      const primeiro = meses[0] ?? mesReferencia;
      return { de: primeiro, ate: mesReferencia };
    }
    case 'mes':
      return { de: mesReferencia, ate: mesReferencia };
    case 'intervalo':
      return { de: periodo.de ?? mesReferencia, ate: periodo.ate ?? mesReferencia };
  }
}

/** CA08.5 — true quando o filtro (categoria + período) não deixa nenhum lançamento. */
export function filtroResultaVazio(
  lancamentosComCategoria: readonly Lancamento[],
  periodo: Filtros['periodo'],
): boolean {
  const janela = resolverJanelaExibicao(lancamentosComCategoria, periodo);
  if (janela === null) return true;
  return !lancamentosComCategoria.some((l) => {
    const am = anoMesDeISO(l.data);
    return am >= janela.de && am <= janela.ate;
  });
}
