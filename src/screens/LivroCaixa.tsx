import { Plus } from 'lucide-preact';
import { useRef } from 'preact/hooks';
import { formatarMesPorExtenso } from '../domain/dates.js';
import { t } from '../i18n/index.js';
import { filtroVazio, lancamentosDoMesAtual, mesReferencia } from '../state/derivados.js';
import { abrirNovoLancamento } from '../state/painelLancamento.js';
import { categorias, idioma } from '../state/signals.js';
import { Ledger } from '../ui/Ledger.js';
import { FiltroVazio } from './Dashboard.js';

/** T11 — livro-caixa completo do mês de referência (UX §4.6), CA04.1-CA04.4. */
export function LivroCaixa() {
  const novoBtnRef = useRef<HTMLButtonElement>(null);
  const mes = mesReferencia.value;

  return (
    <section class="sheet ledger" aria-labelledby="lc-titulo">
      <div class="sec-title">
        <h1 id="lc-titulo">
          {t('secoes.livroCaixa')}
          {mes !== null && ` · ${formatarMesPorExtenso(mes, idioma.value)}`}
        </h1>
        <button type="button" class="btn btn-ink" ref={novoBtnRef} onClick={abrirNovoLancamento}>
          <Plus class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
          {t('secoes.novoLancamento')}
        </button>
      </div>

      {filtroVazio.value ? (
        <FiltroVazio />
      ) : (
        <Ledger
          lancamentos={lancamentosDoMesAtual.value}
          categorias={categorias.value}
          novoBtnRef={novoBtnRef}
          legendaSrOnly={
            mes === null
              ? t('secoes.livroCaixa')
              : t('secoes.saidasDoMes', { mes: formatarMesPorExtenso(mes, idioma.value) })
          }
        />
      )}
    </section>
  );
}
