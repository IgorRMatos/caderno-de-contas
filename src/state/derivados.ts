import { computed } from '@preact/signals';
import { categoriasDoMes, fluxoMensal, kpisDoMes } from '../domain/aggregate.js';
import {
  aplicarFiltroCategorias,
  resolverJanelaExibicao,
  resolverMesReferencia,
} from '../domain/filters.js';
import { gerarInsights } from '../domain/insights.js';
import { calcularProjecao } from '../domain/projection.js';
import { filtros, lancamentos } from './signals.js';

/** CA08.1/CA08.2 — lançamentos com o filtro de categoria aplicado (período não restringe o histórico, só ancora o mês de referência). */
export const lancamentosComCategoria = computed(() =>
  aplicarFiltroCategorias(lancamentos.value, filtros.value.categorias),
);

export const mesReferencia = computed(() =>
  resolverMesReferencia(lancamentosComCategoria.value, filtros.value.periodo),
);

export const janelaExibicao = computed(() =>
  resolverJanelaExibicao(lancamentosComCategoria.value, filtros.value.periodo),
);

/** CA08.5 — true quando o filtro atual não deixa nenhum lançamento para mostrar. */
export const filtroVazio = computed(() => mesReferencia.value === null);

export const kpisAtuais = computed(() => {
  const mes = mesReferencia.value;
  return mes === null ? null : kpisDoMes(lancamentosComCategoria.value, mes);
});

export const kpisMesAnterior = computed(() => {
  const mes = mesReferencia.value;
  if (mes === null) return null;
  const [ano, mesNum] = mes.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(ano, mesNum - 2, 1));
  const anterior = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const temDados = lancamentosComCategoria.value.some((l) => l.data.slice(0, 7) === anterior);
  return temDados ? kpisDoMes(lancamentosComCategoria.value, anterior) : null;
});

export const categoriasDoMesAtual = computed(() => {
  const mes = mesReferencia.value;
  return mes === null ? [] : categoriasDoMes(lancamentosComCategoria.value, mes);
});

export const fluxoMensalAtual = computed(() => fluxoMensal(lancamentosComCategoria.value));

export const projecaoAtual = computed(() => {
  const mes = mesReferencia.value;
  return mes === null ? null : calcularProjecao(lancamentosComCategoria.value, mes, new Date());
});

export const insightsAtuais = computed(() => {
  const mes = mesReferencia.value;
  const projecao = projecaoAtual.value;
  if (mes === null || projecao === null) {
    return { insights: [], motivoVazio: 'sem-dados-mes' as const };
  }
  return gerarInsights(lancamentosComCategoria.value, mes, projecao);
});
