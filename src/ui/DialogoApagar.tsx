import { Download } from 'lucide-preact';
import { useRef } from 'preact/hooks';
import { t } from '../i18n/index.js';
import {
  apagarDados,
  dialogoApagarAberto,
  exportarDados,
  fecharDialogoApagar,
} from '../state/seusDados.js';
import { lancamentos } from '../state/signals.js';
import { Dialog } from './Dialog.js';

/**
 * CA12.3/D15 — "Arrancar todas as folhas?": `alertdialog` sem `window.confirm`,
 * foco inicial em "Não, manter tudo" (a opção segura), atalho "Exportar antes"
 * (baixa a cópia e mantém o diálogo aberto) e "Sim, apagar tudo" em terracota.
 */
export function DialogoApagar() {
  const manterRef = useRef<HTMLButtonElement>(null);
  const aberto = dialogoApagarAberto.value;

  return (
    <Dialog
      aberto={aberto}
      titulo={t('apagar.titulo')}
      tituloId="apagar-titulo"
      descricaoId="apagar-descricao"
      tipo="alertdialog"
      onFechar={fecharDialogoApagar}
      focoInicialRef={manterRef}
    >
      {aberto && (
        <>
          <div id="apagar-descricao">
            <p>{t('apagar.corpo', { n: lancamentos.value.length })}</p>
            <p>{t('apagar.mantem')}</p>
          </div>
          <p class="hand dica-terra">{t('apagar.dica')}</p>
          <div class="actions">
            <button
              type="button"
              class="btn btn-ghost"
              ref={manterRef}
              onClick={fecharDialogoApagar}
            >
              {t('apagar.naoManter')}
            </button>
            <button type="button" class="btn btn-line" onClick={exportarDados}>
              <Download class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
              {t('apagar.exportarAntes')}
            </button>
            <button type="button" class="btn btn-danger" onClick={apagarDados}>
              {t('apagar.simApagar')}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
