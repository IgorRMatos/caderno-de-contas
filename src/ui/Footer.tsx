import { Download, ExternalLink, Lock, Trash2 } from 'lucide-preact';
import { LINKEDIN_URL } from '../config.js';
import { t } from '../i18n/index.js';

/**
 * T6/CA14.3 — rodapé com privacidade + Exportar/Apagar (lógica real vem no
 * T12) + assinatura. Lucide não tem mais ícone de marca (removido do pacote
 * por política de trademark): uso `ExternalLink` no lugar do logo do LinkedIn.
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
          <a class="btn btn-line" href="#/seus-dados">
            <Download class="icon" strokeWidth={1.75} aria-hidden="true" />
            {t('apagar.exportarMeusDados')}
          </a>
          <a class="btn btn-ghost" href="#/seus-dados">
            <Trash2 class="icon" strokeWidth={1.75} aria-hidden="true" />
            {t('apagar.botao')}
          </a>
        </p>
      </div>
      <div class="signature">
        <span class="hand">{t('assinatura.texto')}</span>
        <a href={LINKEDIN_URL} rel="noopener" target="_blank">
          <ExternalLink class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
          {t('assinatura.linkedin')}
        </a>
      </div>
    </footer>
  );
}
