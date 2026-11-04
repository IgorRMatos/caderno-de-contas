import { Pencil, Trash2 } from 'lucide-preact';
import type { RefObject } from 'preact';
import { useRef } from 'preact/hooks';
import { formatarData } from '../domain/dates.js';
import { formatarMoeda } from '../domain/money.js';
import type { Categoria, Lancamento } from '../domain/types.js';
import { t } from '../i18n/index.js';
import { excluirLancamento } from '../state/exclusao.js';
import { abrirEdicaoLancamento } from '../state/painelLancamento.js';
import { idioma } from '../state/signals.js';
import { UndoStrip } from './UndoStrip.js';

export interface LedgerProps {
  lancamentos: readonly Lancamento[];
  categorias: readonly Categoria[];
  /** Para onde o foco volta se o tempo de desfazer expirar com o foco ainda na faixa (D17). */
  novoBtnRef: RefObject<HTMLButtonElement>;
  legendaSrOnly: string;
}

/** T11 — tabela de lançamentos com editar/excluir inline e a faixa de Desfazer (D17). Usada no dashboard e no livro-caixa. */
export function Ledger({ lancamentos, categorias, novoBtnRef, legendaSrOnly }: LedgerProps) {
  const lixeiraRefs = useRef(new Map<string, HTMLButtonElement>());

  function nomeCategoria(id: string): string {
    return categorias.find((c) => c.id === id)?.nome ?? id;
  }

  function aoDesfazer(idRestaurado: string): void {
    requestAnimationFrame(() => lixeiraRefs.current.get(idRestaurado)?.focus());
  }

  return (
    <>
      {lancamentos.length === 0 ? (
        <p>{t('vazios.semFiltro')}</p>
      ) : (
        <table>
          <caption class="sr-only">{legendaSrOnly}</caption>
          <thead>
            <tr>
              <th>{t('lancamento.data')}</th>
              <th>{t('lancamento.descricao')}</th>
              <th>{t('lancamento.categoria')}</th>
              <th style={{ textAlign: 'right' }}>{t('lancamento.valor')}</th>
              <th>
                <span class="sr-only">{t('secoes.novoLancamento')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr key={l.id}>
                <td class="d">{formatarData(l.data, idioma.value)}</td>
                <td class="desc">{l.descricao || '—'}</td>
                <td class="c">
                  <span class="cat">{nomeCategoria(l.categoria)}</span>
                </td>
                <td class={`v ${l.tipo === 'entrada' ? 'in' : 'out'}`}>
                  {l.tipo === 'entrada' ? '+ ' : '− '}
                  {formatarMoeda(l.valorCentavos, idioma.value)}
                </td>
                <td class="act">
                  <button
                    type="button"
                    class="icon-btn"
                    aria-label={t('lancamento.editar', {
                      descricao: l.descricao || t('lancamento.descricao'),
                    })}
                    onClick={() => abrirEdicaoLancamento(l)}
                  >
                    <Pencil class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="icon-btn"
                    ref={(el) => {
                      if (el) lixeiraRefs.current.set(l.id, el);
                    }}
                    aria-label={t('lancamento.excluir', {
                      descricao: l.descricao || t('lancamento.descricao'),
                    })}
                    onClick={() => excluirLancamento(l.id)}
                  >
                    <Trash2 class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <UndoStrip aoDesfazer={aoDesfazer} aoExpirarComFoco={() => novoBtnRef.current?.focus()} />
    </>
  );
}
