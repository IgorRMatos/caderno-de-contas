import { Moon, Sun } from 'lucide-preact';
import { useRef } from 'preact/hooks';
import { t } from '../i18n/index.js';
import { girarTema, juntar, type Handle } from '../motion/index.js';
import { tema } from '../state/signals.js';

/** UX §5.2/D15 — Sun no tema claro, Moon no escuro; a troca de ícone é CSS (`[data-theme]`). */
export function ThemeToggle() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const giroRef = useRef<Handle | null>(null);

  function alternar() {
    tema.value = tema.value === 'dark' ? 'light' : 'dark';
    // UX §5.2/§7 — sol ↔ lua gira e cresce; com reduced-motion só troca
    giroRef.current?.kill();
    const icones = Array.from(btnRef.current?.querySelectorAll('svg') ?? []);
    giroRef.current = juntar(icones.map((i) => girarTema(i)));
  }

  const rotulo = tema.value === 'dark' ? t('header.mudarParaClaro') : t('header.mudarParaEscuro');

  return (
    <button ref={btnRef} type="button" class="theme-btn" aria-label={rotulo} onClick={alternar}>
      <Sun class="icon sun" strokeWidth={1.75} aria-hidden="true" />
      <Moon class="icon moon" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
