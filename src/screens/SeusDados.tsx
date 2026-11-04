import { t } from '../i18n/index.js';

/** Placeholder do T6 — privacidade completa, exportar e apagar chegam no T12. */
export function SeusDados() {
  return (
    <section class="card">
      <h2>{t('apagar.botao')}</h2>
      <p>{t('privacidade.completa')}</p>
    </section>
  );
}
