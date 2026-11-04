import { calcularVariacao, categoriasDoMes, fluxoMensal, kpisDoMes } from './aggregate.js';
import { anoMesDeslocado, mesTemDados } from './filters.js';
import type { Projecao } from './projection.js';
import type { Lancamento } from './types.js';

/** T3 — X da regra "categoria subindo mais que X% vs. média de 3 meses". */
const LIMIAR_CATEGORIA_SUBINDO = 25;

export interface Insight {
  chave: string;
  params: Record<string, string | number>;
  prioridade: number;
}

export interface ResultadoInsights {
  insights: Insight[];
  /** CA07.4 — motivo para a UI mostrar mensagem amigável no lugar da lista. */
  motivoVazio: 'sem-dados-mes' | null;
}

function detectarCategoriaSubindo(
  lancamentos: readonly Lancamento[],
  mesReferencia: string,
): { categoria: string; percentual: number } | null {
  const categoriasAtuais = categoriasDoMes(lancamentos, mesReferencia);
  const mesesAnteriores = [1, 2, 3].map((i) => anoMesDeslocado(mesReferencia, -i));

  let melhor: { categoria: string; percentual: number } | null = null;
  for (const atual of categoriasAtuais) {
    const valoresAnteriores = mesesAnteriores.map(
      (m) =>
        categoriasDoMes(lancamentos, m).find((c) => c.categoria === atual.categoria)
          ?.valorCentavos ?? 0,
    );
    const mediaAnterior = valoresAnteriores.reduce((a, b) => a + b, 0) / 3;
    if (mediaAnterior === 0) continue;

    const aumento = Math.round(((atual.valorCentavos - mediaAnterior) / mediaAnterior) * 100);
    if (aumento >= LIMIAR_CATEGORIA_SUBINDO && (melhor === null || aumento > melhor.percentual)) {
      melhor = { categoria: atual.categoria, percentual: aumento };
    }
  }
  return melhor;
}

function encontrarMesVermelhoRecente(
  lancamentos: readonly Lancamento[],
  mesReferencia: string,
): { anoMes: string; sobrouCentavos: number } | null {
  const historico = fluxoMensal(lancamentos).filter((f) => f.anoMes < mesReferencia);
  for (let i = historico.length - 1; i >= 0; i--) {
    const mes = historico[i];
    if (mes !== undefined && mes.sobrouCentavos < 0) return mes;
  }
  return null;
}

/**
 * CA07.1–CA07.4 — gera 3 a 5 candidatos a insight como `{chave, params}`
 * (nunca texto: a tradução é responsabilidade da UI/i18n, T5/T9).
 */
export function gerarInsights(
  lancamentos: readonly Lancamento[],
  mesReferencia: string,
  projecao: Projecao,
): ResultadoInsights {
  const kpisAtual = kpisDoMes(lancamentos, mesReferencia);

  if (kpisAtual.entrouCentavos === 0 && kpisAtual.saiuCentavos === 0) {
    return { insights: [], motivoVazio: 'sem-dados-mes' };
  }

  const candidatos: Insight[] = [];

  const mesAnterior = anoMesDeslocado(mesReferencia, -1);
  const kpisAnterior = mesTemDados(lancamentos, mesAnterior)
    ? kpisDoMes(lancamentos, mesAnterior)
    : null;
  const variacaoSobrou = kpisAnterior
    ? calcularVariacao(kpisAtual.sobrouCentavos, kpisAnterior.sobrouCentavos)
    : null;

  if (kpisAtual.sobrouCentavos < 0) {
    candidatos.push({
      chave: 'resumo_negativo',
      params: { mes: mesReferencia, valorCentavos: Math.abs(kpisAtual.sobrouCentavos) },
      prioridade: 100,
    });
  } else if (variacaoSobrou) {
    candidatos.push({
      chave: variacaoSobrou.direcao === 'up' ? 'resumo_positivo' : 'resumo_neutro',
      params: {
        mes: mesReferencia,
        valorCentavos: kpisAtual.sobrouCentavos,
        percentual: variacaoSobrou.percentual,
        mesAnterior,
      },
      prioridade: 100,
    });
  } else {
    candidatos.push({
      chave: 'resumo_sem_comparacao',
      params: { mes: mesReferencia, valorCentavos: kpisAtual.sobrouCentavos },
      prioridade: 100,
    });
  }

  const categorias = categoriasDoMes(lancamentos, mesReferencia);
  const maiorCategoria = categorias[0];
  if (maiorCategoria !== undefined) {
    candidatos.push({
      chave: 'maior_categoria',
      params: {
        mes: mesReferencia,
        categoria: maiorCategoria.categoria,
        percentual: maiorCategoria.percentual,
      },
      prioridade: 90,
    });
  }

  const categoriaSubindo = detectarCategoriaSubindo(lancamentos, mesReferencia);
  if (categoriaSubindo) {
    candidatos.push({
      chave: 'categoria_subindo',
      params: { categoria: categoriaSubindo.categoria, percentual: categoriaSubindo.percentual },
      prioridade: 80,
    });
  }

  const mesVermelho = encontrarMesVermelhoRecente(lancamentos, mesReferencia);
  if (mesVermelho) {
    candidatos.push({
      chave: 'mes_vermelho_historico',
      params: { mes: mesVermelho.anoMes, valorCentavos: Math.abs(mesVermelho.sobrouCentavos) },
      prioridade: 70,
    });
  }

  if (!projecao.semDados) {
    const proximoMes = projecao.mesesProjetados[0];
    if (proximoMes !== undefined) {
      candidatos.push({
        chave: proximoMes.sobrouCentavos >= 0 ? 'projecao_azul' : 'projecao_vermelho',
        params: { mes: proximoMes.anoMes, valorCentavos: Math.abs(proximoMes.sobrouCentavos) },
        prioridade: 60,
      });
    }
  }

  candidatos.sort((a, b) => b.prioridade - a.prioridade);
  return { insights: candidatos.slice(0, 5), motivoVazio: null };
}
