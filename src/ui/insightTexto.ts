import type { Idioma } from '../config.js';
import { formatarMesPorExtenso } from '../domain/dates.js';
import type { Insight } from '../domain/insights.js';
import { formatarMoeda } from '../domain/money.js';
import type { Categoria } from '../domain/types.js';
import { t } from '../i18n/index.js';

function nomeCategoria(id: string, categorias: readonly Categoria[]): string {
  return categorias.find((c) => c.id === id)?.nome ?? id;
}

/**
 * Converte um `Insight` puro ({chave, params}, vindo de `domain/insights.ts`)
 * em texto final: formata moeda/mês/categoria no idioma ativo e interpola via
 * `t()`. É aqui — na UI — que os dados viram texto, nunca no domínio (D9).
 */
export function textoInsight(insight: Insight, idioma: Idioma, categorias: readonly Categoria[]): string {
  const p = insight.params;
  const params: Record<string, string | number> = {};

  if ('mes' in p) params.mes = formatarMesPorExtenso(String(p.mes), idioma);
  if ('mesAnterior' in p) params.mesAnterior = formatarMesPorExtenso(String(p.mesAnterior), idioma);
  if ('valorCentavos' in p) params.valor = formatarMoeda(Number(p.valorCentavos), idioma);
  if ('percentual' in p) params.percentual = Number(p.percentual);
  if ('categoria' in p) params.categoria = nomeCategoria(String(p.categoria), categorias);

  return t(`insights.${insight.chave}`, params);
}
