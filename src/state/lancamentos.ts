import { gerarId, slugificar } from '../domain/id.js';
import { formatarMoeda } from '../domain/money.js';
import type { Lancamento, Tipo } from '../domain/types.js';
import { t } from '../i18n/index.js';
import { adicionarToast } from './toasts.js';
import { categorias, idioma, lancamentos } from './signals.js';

export interface DadosLancamento {
  tipo: Tipo;
  valorCentavos: number;
  descricao: string;
  data: string;
  categoria: string;
}

/** CA04.3 — categoria personalizada por nome; reaproveita uma já existente com o mesmo slug. */
export function criarCategoriaSePreciso(nome: string): string {
  const id = slugificar(nome);
  if (!categorias.value.some((c) => c.id === id)) {
    categorias.value = [...categorias.value, { id, nome: nome.trim(), personalizada: true }];
  }
  return id;
}

function mensagemLancamento(dados: DadosLancamento): string {
  const sinal = dados.tipo === 'entrada' ? '+ ' : '− ';
  return `${dados.descricao || t('lancamento.descricao')}: ${sinal}${formatarMoeda(dados.valorCentavos, idioma.value)}`;
}

/** CA04.1/CA04.4 — novo lançamento manual; o signal já dispara o recálculo de tudo que depende dele. */
export function adicionarLancamento(dados: DadosLancamento): void {
  const novo: Lancamento = {
    id: gerarId(),
    data: dados.data,
    descricao: dados.descricao,
    valorCentavos: dados.valorCentavos,
    tipo: dados.tipo,
    categoria: dados.categoria,
    origem: 'manual',
    criadoEm: new Date().toISOString(),
  };
  lancamentos.value = [...lancamentos.value, novo];
  adicionarToast('ok', mensagemLancamento(dados), t('toasts.anotado'));
}

/** CA04.2/CA04.4 — corrige um lançamento existente, mantendo id/origem/criadoEm. */
export function editarLancamento(id: string, dados: DadosLancamento): void {
  lancamentos.value = lancamentos.value.map((l) =>
    l.id === id
      ? {
          ...l,
          data: dados.data,
          descricao: dados.descricao,
          valorCentavos: dados.valorCentavos,
          tipo: dados.tipo,
          categoria: dados.categoria,
        }
      : l,
  );
  adicionarToast('ok', mensagemLancamento(dados), t('toasts.corrigido'));
}
