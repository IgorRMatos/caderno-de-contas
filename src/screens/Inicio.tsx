import { t } from '../i18n/index.js';

/** Placeholder do T6 — conteúdo real da tela de início chega no T7. */
export function Inicio() {
  return (
    <section class="intro">
      <h1>{t('inicio.h1')}</h1>
      <p class="lead">{t('inicio.apoio')}</p>
    </section>
  );
}
