import { signal } from '@preact/signals';
import { gerarCSV, nomeArquivoExport } from '../domain/export.js';
import { t } from '../i18n/index.js';
import { navegar } from '../router.js';
import { confirmarExclusao } from './exclusao.js';
import { cancelarMapeamento, cancelarSomarOuSubstituir } from './importacao.js';
import { fecharPainelLancamento } from './painelLancamento.js';
import { apagarDadosSalvos } from './persistencia.js';
import { categorias, filtros, FILTROS_PADRAO, lancamentos } from './signals.js';
import { adicionarToast } from './toasts.js';

/** T12/CA12.3 — diálogo "Arrancar todas as folhas?" aberto (rodapé ou tela Seus dados). */
export const dialogoApagarAberto = signal(false);

export function abrirDialogoApagar(): void {
  dialogoApagarAberto.value = true;
}

export function fecharDialogoApagar(): void {
  dialogoApagarAberto.value = false;
}

/**
 * Baixa o texto como arquivo, 100% local (D11/D12: Blob + `<a download>`,
 * nenhuma requisição de rede). Separado para o teste de unidade poder trocar.
 */
export function baixarArquivo(conteudo: string, nome: string, tipoMime: string): void {
  const blob = new Blob([conteudo], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // dá tempo ao navegador de começar o download antes de liberar a URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CA12.2 — "Exportar meus dados": CSV reimportável (D11) + toast "Cópia baixada". */
export function exportarDados(): void {
  const lista = lancamentos.value;
  const nome = nomeArquivoExport(new Date());
  baixarArquivo(gerarCSV(lista, categorias.value), nome, 'text/csv;charset=utf-8');
  adicionarToast(
    'ok',
    t('seusDados.copiaBaixadaDetalhe', { arquivo: nome, n: lista.length }),
    t('toasts.copiaBaixada'),
  );
}

/**
 * CA12.3 — apaga lançamentos, categorias e filtros (memória + storage, com os
 * backups), MANTÉM tema e idioma (UX §4.7), fecha o que dependia dos dados
 * (painel, desfazer, importação pendente), volta ao Início + toast "Caderno zerado".
 */
export function apagarDados(): void {
  confirmarExclusao();
  fecharPainelLancamento();
  cancelarSomarOuSubstituir();
  cancelarMapeamento();

  lancamentos.value = [];
  categorias.value = [];
  filtros.value = FILTROS_PADRAO;
  apagarDadosSalvos();

  dialogoApagarAberto.value = false;
  navegar('/');
  adicionarToast('ok', t('seusDados.zeradoDetalhe'), t('toasts.cadernoZerado'));
}
