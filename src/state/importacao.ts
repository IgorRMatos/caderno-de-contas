import { signal } from '@preact/signals';
import { EXEMPLO_CSV } from '../domain/exemploDados.js';
import type { CampoPlanilha } from '../domain/import/headers.js';
import { processarTabela, type RelatorioImportacao } from '../domain/import/normalize.js';
import type { TabelaBruta } from '../domain/import/types.js';
import { parseCSV } from '../io/csv.js';
import { lerTextoArquivo } from '../io/readFile.js';
import { parseXLSX } from '../io/xlsx.js';
import { t } from '../i18n/index.js';
import { navegar } from '../router.js';
import { categorias, idioma, lancamentos } from './signals.js';
import { adicionarToast } from './toasts.js';

export type EstadoDropzone = 'parado' | 'arrastando' | 'lendo' | 'erro';

export const estadoDropzone = signal<EstadoDropzone>('parado');
export const nomeArquivoLendo = signal<string>('');
export const linhasLendo = signal<number>(0);

/** Tabela bruta completa da última leitura, guardada para reprocessar após o
 * usuário confirmar o mapeamento manual (CA02.2) — o relatório só carrega a prévia. */
const tabelaCrua = signal<TabelaBruta | null>(null);

/** CA02.1-CA02.4 — relatório pendente de mapeamento manual (colunas não reconhecidas). */
export const mapeamentoPendente = signal<RelatorioImportacao | null>(null);

/** CA01.11 — relatório pronto, aguardando "somar ou substituir" (já há dados salvos). */
export const somarOuSubstituirPendente = signal<RelatorioImportacao | null>(null);

function extensao(nome: string): string {
  const i = nome.lastIndexOf('.');
  return i === -1 ? '' : nome.slice(i + 1).toLowerCase();
}

async function lerTabela(arquivo: File): Promise<TabelaBruta | null> {
  const ext = extensao(arquivo.name);
  if (ext === 'csv') return parseCSV(await lerTextoArquivo(arquivo));
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(arquivo);
  return null;
}

function finalizarComRelatorio(relatorio: RelatorioImportacao): void {
  if (relatorio.precisaMapeamento) {
    mapeamentoPendente.value = relatorio;
    navegar('/mapeamento');
    return;
  }
  if (lancamentos.value.length > 0) {
    somarOuSubstituirPendente.value = relatorio;
    return;
  }
  commitarImportacao(relatorio, 'substituir');
}

/** CA01.1-CA01.9 — ponto de entrada único: arquivo solto ou escolhido. */
export async function processarArquivo(arquivo: File): Promise<void> {
  estadoDropzone.value = 'lendo';
  nomeArquivoLendo.value = arquivo.name;

  const tabela = await lerTabela(arquivo);
  if (tabela === null) {
    estadoDropzone.value = 'erro';
    adicionarToast('err', t('toasts.erroArquivo'));
    return;
  }

  linhasLendo.value = tabela.linhas.length;
  tabelaCrua.value = tabela;
  const relatorio = processarTabela(tabela, idioma.value, 'importado');
  estadoDropzone.value = 'parado';
  finalizarComRelatorio(relatorio);
}

/**
 * CA03.1-CA03.4 — "Ver com dados de exemplo": mesmo pipeline do upload, mas a
 * partir do CSV embutido no bundle (nunca via `fetch`, que o CSP de produção
 * bloqueia — D12). `origem: 'exemplo'` identifica os lançamentos resultantes.
 */
export function carregarExemplo(): void {
  const tabela = parseCSV(EXEMPLO_CSV);
  const relatorio = processarTabela(tabela, idioma.value, 'exemplo');
  tabelaCrua.value = tabela;
  finalizarComRelatorio(relatorio);
}

/** CA02.2 — usuário confirma o mapeamento manual das colunas; reprocessa a tabela completa. */
export function confirmarMapeamento(mapeamento: Partial<Record<CampoPlanilha, number>>): void {
  const tabela = tabelaCrua.value;
  if (tabela === null) return;
  const relatorio = processarTabela(tabela, idioma.value, 'importado', mapeamento);
  mapeamentoPendente.value = null;
  finalizarComRelatorio(relatorio);
}

/** CA01.11 — soma aos lançamentos atuais ou substitui tudo; sem `window.confirm`. */
export function commitarImportacao(
  relatorio: RelatorioImportacao,
  modo: 'somar' | 'substituir',
): void {
  lancamentos.value =
    modo === 'substituir'
      ? relatorio.lancamentos
      : [...lancamentos.value, ...relatorio.lancamentos];

  const idsExistentes = new Set(categorias.value.map((c) => c.id));
  const novas = relatorio.categoriasEncontradas.filter((c) => !idsExistentes.has(c.id));
  if (novas.length > 0) categorias.value = [...categorias.value, ...novas];

  somarOuSubstituirPendente.value = null;
  tabelaCrua.value = null;

  if (relatorio.lancamentos.length > 0) {
    adicionarToast('ok', t('toasts.importado', { n: relatorio.lancamentos.length }));
  }
  if (relatorio.semCategoria > 0) {
    adicionarToast('warn', t('toasts.semCategoria', { n: relatorio.semCategoria }));
  }
  if (relatorio.invalidas > 0) {
    adicionarToast('warn', t('toasts.linhasInvalidas', { n: relatorio.invalidas }));
  }

  navegar('/caderno');
}

export function cancelarSomarOuSubstituir(): void {
  somarOuSubstituirPendente.value = null;
  tabelaCrua.value = null;
}

export function cancelarMapeamento(): void {
  mapeamentoPendente.value = null;
  tabelaCrua.value = null;
}
