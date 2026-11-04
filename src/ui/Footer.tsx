import { Download, ExternalLink, Lock, Trash2 } from 'lucide-preact';
import { LINKEDIN_URL } from '../config.js';
import { t } from '../i18n/index.js';
import { temDados } from '../state/derivados.js';
import { abrirDialogoApagar, exportarDados } from '../state/seusDados.js';

/**
 * T6/CA14.3 — rodapé com privacidade + Exportar/Apagar + assinatura. T12:
 * com dados, os botões fazem a ação direto (baixar o CSV / abrir o diálogo
 * de apagar); sem dados, levam à tela "Seus dados", que explica o porquê.
 * Lucide não tem mais ícone de marca (removido do pacote por política de
 * trademark): uso `ExternalLink` no lugar do logo do LinkedIn.
 */
export function Footer() {
  return (
    <footer class="footer">
      <div>
        <p class="privacy">
          <Lock class="icon" strokeWidth={1.75} aria-hidden="true" />
          <span>{t('privacidade.rodape')}</span>
        </p>
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {temDados.value ? (
            <>
              <button type="button" class="btn btn-line" onClick={exportarDados}>
                <Download class="icon" strokeWidth={1.75} aria-hidden="true" />
                {t('apagar.exportarMeusDados')}
              </button>
              <button type="button" class="btn btn-ghost" onClick={abrirDialogoApagar}>
                <Trash2 class="icon" strokeWidth={1.75} aria-hidden="true" />
                {t('apagar.botao')}
              </button>
            </>
          ) : (
            <>
              <a class="btn btn-line" href="#/seus-dados">
                <Download class="icon" strokeWidth={1.75} aria-hidden="true" />
                {t('apagar.exportarMeusDados')}
              </a>
              <a class="btn btn-ghost" href="#/seus-dados">
                <Trash2 class="icon" strokeWidth={1.75} aria-hidden="true" />
                {t('apagar.botao')}
              </a>
            </>
          )}
        </p>
      </div>
      <div class="signature">
        <span class="hand">{t('assinatura.texto')}</span>
        <a href={LINKEDIN_URL} rel="noopener noreferrer" target="_blank">
          <ExternalLink class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
          {t('assinatura.linkedin')}
        </a>
      </div>
    </footer>
  );
}
