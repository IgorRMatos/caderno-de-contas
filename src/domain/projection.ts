import { kpisDoMes } from './aggregate.js';
import { anoMesDeslocado, mesTemDados } from './filters.js';
import type { Lancamento } from './types.js';

function media(valores: readonly number[]): number {
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function desvioPadrao(valores: readonly number[]): number {
  const m = media(valores);
  const variancia = media(valores.map((v) => (v - m) ** 2));
  return Math.sqrt(variancia);
}

function mesEhCompleto(anoMes: string, agora: Date): boolean {
  const mesRelogio = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  return anoMes < mesRelogio;
}

export interface Projecao {
  /** Meses usados na média, em ordem cronológica, até 3. */
  baseMeses: string[];
  mediaEntrouCentavos: number;
  mediaSaiuCentavos: number;
  mediaSobrouCentavos: number;
  /** D6 — 0 com só 1 mês na base. */
  desvioPadraoSobrouCentavos: number;
  mesesProjetados: { anoMes: string; sobrouCentavos: number }[];
  /** D6 — base com 1–2 meses: projeta mesmo assim, mas avisa. */
  poucosMeses: boolean;
  /** D6 — 0 meses de base: estado vazio, sem projeção. */
  semDados: boolean;
}

/**
 * D6 — base de até 3 meses **completos** (anteriores ao mês do relógio) e
 * **com dados**, terminando no mês de referência (ou no mês anterior, se o
 * próprio mês de referência ainda não tiver fechado). Projeta os 3 meses
 * seguintes ao de referência com a média da base; respeita o filtro de
 * categoria porque `lancamentos` já vem filtrado por quem chama.
 */
export function calcularProjecao(
  lancamentos: readonly Lancamento[],
  mesReferencia: string,
  agora: Date,
): Projecao {
  let cursor = mesEhCompleto(mesReferencia, agora)
    ? mesReferencia
    : anoMesDeslocado(mesReferencia, -1);

  const baseMeses: string[] = [];
  while (baseMeses.length < 3) {
    if (!mesEhCompleto(cursor, agora)) break;
    if (!mesTemDados(lancamentos, cursor)) break;
    baseMeses.unshift(cursor);
    cursor = anoMesDeslocado(cursor, -1);
  }

  if (baseMeses.length === 0) {
    return {
      baseMeses: [],
      mediaEntrouCentavos: 0,
      mediaSaiuCentavos: 0,
      mediaSobrouCentavos: 0,
      desvioPadraoSobrouCentavos: 0,
      mesesProjetados: [],
      poucosMeses: false,
      semDados: true,
    };
  }

  const kpisBase = baseMeses.map((m) => kpisDoMes(lancamentos, m));
  const mediaEntrouCentavos = Math.round(media(kpisBase.map((k) => k.entrouCentavos)));
  const mediaSaiuCentavos = Math.round(media(kpisBase.map((k) => k.saiuCentavos)));
  const mediaSobrouCentavos = Math.round(media(kpisBase.map((k) => k.sobrouCentavos)));
  const desvioPadraoSobrouCentavos =
    baseMeses.length < 2 ? 0 : Math.round(desvioPadrao(kpisBase.map((k) => k.sobrouCentavos)));

  const mesesProjetados = [1, 2, 3].map((i) => ({
    anoMes: anoMesDeslocado(mesReferencia, i),
    sobrouCentavos: mediaSobrouCentavos,
  }));

  return {
    baseMeses,
    mediaEntrouCentavos,
    mediaSaiuCentavos,
    mediaSobrouCentavos,
    desvioPadraoSobrouCentavos,
    mesesProjetados,
    poucosMeses: baseMeses.length < 3,
    semDados: false,
  };
}
