import { Download, Trash2 } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { temDados } from '../state/derivados.js';
import { abrirDialogoApagar, exportarDados } from '../state/seusDados.js';

/**
 * T12 — tela 7 "Seus dados" (UX §4.7): privacidade completa (CA12.1),
 * exportar CSV reimportável (CA12.2/D11) e apagar com `alertdialog` (CA12.3).
 * O diálogo em si mora no shell (`DialogoApagar`), porque o rodapé também o abre.
 */
export function SeusDados() {
  const vazio = !temDados.value;
  return (
    <section class="sheet with-margin seus-dados" aria-labelledby="sd-titulo">
      <p class="margin-note" aria-hidden="true">
        {t('seusDados.notaMargem')}
      </p>
      <p class="kicker">{t('seusDados.kicker')}</p>
      <h1 id="sd-titulo">{t('seusDados.titulo')}</h1>
      <p class="sd-privacidade">{t('privacidade.completa')}</p>

      {vazio && <p class="sd-vazio hand">{t('seusDados.vazio')}</p>}

      <div class="sd-blocos">
        <div>
          <h2>{t('seusDados.copiaTitulo')}</h2>
          <p class="sd-apoio">{t('seusDados.copiaApoio')}</p>
          <button type="button" class="btn btn-ink" disabled={vazio} onClick={exportarDados}>
            <Download class="icon" strokeWidth={1.75} aria-hidden="true" />
            {t('seusDados.exportarCsv')}
          </button>
        </div>
        <div id="apagar">
          <h2>{t('seusDados.zeroTitulo')}</h2>
          <p class="sd-apoio">{t('seusDados.zeroApoio')}</p>
          <button
            type="button"
            class="btn btn-line btn-terra"
            disabled={vazio}
            onClick={abrirDialogoApagar}
          >
            <Trash2 class="icon" strokeWidth={1.75} aria-hidden="true" />
            {t('apagar.botao')}
          </button>
        </div>
      </div>
    </section>
  );
}
