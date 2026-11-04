import { useRef } from 'preact/hooks';
import { t } from '../i18n/index.js';
import {
  cancelarSomarOuSubstituir,
  commitarImportacao,
  somarOuSubstituirPendente,
} from '../state/importacao.js';
import { lancamentos } from '../state/signals.js';
import { Dialog } from './Dialog.js';

/** CA01.11 — "Já tem contas neste caderno": somar ou substituir, sem `window.confirm`. */
export function DialogoSomarSubstituir() {
  const substituirRef = useRef<HTMLButtonElement>(null);
  const relatorio = somarOuSubstituirPendente.value;

  return (
    <Dialog
      aberto={relatorio !== null}
      titulo={t('somar.titulo')}
      tituloId="somar-titulo"
      onFechar={cancelarSomarOuSubstituir}
      focoInicialRef={substituirRef}
    >
      {relatorio !== null && (
        <>
          <p>
            {t('somar.corpo', { n: lancamentos.value.length, m: relatorio.lancamentos.length })}
          </p>
          <p class="hand">{t('somar.dica')}</p>
          <div class="actions">
            <button
              type="button"
              class="btn btn-line"
              onClick={() => commitarImportacao(relatorio, 'somar')}
            >
              {t('somar.somar')}
            </button>
            <button
              type="button"
              class="btn btn-ink"
              ref={substituirRef}
              onClick={() => commitarImportacao(relatorio, 'substituir')}
            >
              {t('somar.substituir')}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
