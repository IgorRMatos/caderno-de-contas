import { Moon, Sun } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { tema } from '../state/signals.js';

/** UX §5.2/D15 — Sun no tema claro, Moon no escuro; a troca de ícone é CSS (`[data-theme]`). */
export function ThemeToggle() {
  function alternar() {
    tema.value = tema.value === 'dark' ? 'light' : 'dark';
  }

  const rotulo = tema.value === 'dark' ? t('header.mudarParaClaro') : t('header.mudarParaEscuro');

  return (
    <button type="button" class="theme-btn" aria-label={rotulo} onClick={alternar}>
      <Sun class="icon sun" strokeWidth={1.75} aria-hidden="true" />
      <Moon class="icon moon" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
