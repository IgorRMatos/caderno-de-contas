import { t } from '../i18n/index.js';
import { SeletorIdioma } from './SeletorIdioma.js';
import { ThemeToggle } from './ThemeToggle.js';

/** T6 — cabeçalho do shell: skip link, marca, seletor de idioma, sol/lua. */
export function Header() {
  return (
    <>
      {/* tabIndex=0: no Safari/WebKit, links só entram na ordem de Tab por
          padrão com "Full Keyboard Access" ligado no SO — explícito aqui
          garante o skip link alcançável em todo navegador (RNF03). */}
      <a class="skip-link" href="#conteudo" tabIndex={0}>
        {t('header.pularParaConteudo')}
      </a>
      <header class="topbar">
        <a class="brand" href="#/" aria-label={t('marca')}>
          <b>{t('marca')}</b>
        </a>
        <SeletorIdioma />
        <ThemeToggle />
      </header>
    </>
  );
}
