import { anoMesDeISO } from './dates.js';
import { mesesComDados } from './filters.js';
import type { Lancamento } from './types.js';

export interface KPIsMes {
  entrouCentavos: number;
  saiuCentavos: number;
  sobrouCentavos: number;
  /** CA05.3 — `null` quando entradas = 0 (não dá para calcular margem). */
  margemPercentual: number | null;
}

export function kpisDoMes(lancamentos: readonly Lancamento[], anoMes: string): KPIsMes {
  let entrouCentavos = 0;
  let saiuCentavos = 0;
  for (const l of lancamentos) {
    if (anoMesDeISO(l.data) !== anoMes) continue;
    if (l.tipo === 'entrada') entrouCentavos += l.valorCentavos;
    else saiuCentavos += l.valorCentavos;
  }
  const sobrouCentavos = entrouCentavos - saiuCentavos;
  const margemPercentual =
    entrouCentavos === 0 ? null : Math.round((sobrouCentavos / entrouCentavos) * 100);
  return { entrouCentavos, saiuCentavos, sobrouCentavos, margemPercentual };
}

export interface Variacao {
  percentual: number;
  direcao: 'up' | 'down';
}

/**
 * CA05.2/D5 — variação vs. mês anterior. `null` quando o mês anterior não tem
 * dados (CA07.4: "primeiro mês anotado") ou o valor-base é 0 (nunca `Infinity`).
 */
export function calcularVariacao(atualCentavos: number, anteriorCentavos: number): Variacao | null {
  if (anteriorCentavos === 0) return null;
  const diferenca = atualCentavos - anteriorCentavos;
  const percentual = Math.round((Math.abs(diferenca) / Math.abs(anteriorCentavos)) * 100);
  return { percentual, direcao: diferenca >= 0 ? 'up' : 'down' };
}

export interface CategoriaResumo {
  categoria: string;
  valorCentavos: number;
  percentual: number;
}

/** CA06.2 — despesas por categoria do mês, ordenadas do maior para o menor. */
export function categoriasDoMes(
  lancamentos: readonly Lancamento[],
  anoMes: string,
): CategoriaResumo[] {
  const totais = new Map<string, number>();
  for (const l of lancamentos) {
    if (anoMesDeISO(l.data) !== anoMes || l.tipo !== 'saida') continue;
    totais.set(l.categoria, (totais.get(l.categoria) ?? 0) + l.valorCentavos);
  }
  const totalGeral = [...totais.values()].reduce((a, b) => a + b, 0);
  const lista = [...totais.entries()].map(([categoria, valorCentavos]) => ({
    categoria,
    valorCentavos,
    percentual: totalGeral === 0 ? 0 : Math.round((valorCentavos / totalGeral) * 100),
  }));
  lista.sort((a, b) => b.valorCentavos - a.valorCentavos);
  return lista;
}

export interface FluxoMes {
  anoMes: string;
  entrouCentavos: number;
  saiuCentavos: number;
  sobrouCentavos: number;
}

/** CA06.1 — fluxo de caixa mês a mês, para todos os meses com dados. */
export function fluxoMensal(lancamentos: readonly Lancamento[]): FluxoMes[] {
  return mesesComDados(lancamentos).map((anoMes) => {
    const k = kpisDoMes(lancamentos, anoMes);
    return {
      anoMes,
      entrouCentavos: k.entrouCentavos,
      saiuCentavos: k.saiuCentavos,
      sobrouCentavos: k.sobrouCentavos,
    };
  });
}
