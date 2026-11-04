import { Check, ChevronDown } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { IDIOMAS, type Idioma } from '../config.js';
import { Bandeira } from './flags.js';
import { carregarIdioma, t } from '../i18n/index.js';
import { idioma } from '../state/signals.js';

function idOpcao(idiomaOpcao: Idioma): string {
  return `lang-opt-${idiomaOpcao}`;
}

/**
 * D15/UX §5.3 — `<option>` não renderiza SVG, então é uma listbox própria:
 * botão `aria-haspopup="listbox"` + `aria-expanded`; lista `role="listbox"`
 * com `role="option"` + `aria-selected` + `aria-activedescendant`. Teclado:
 * Enter/Espaço abre, ↑/↓ navegam, Enter escolhe, Esc fecha e devolve o foco.
 */
export function SeletorIdioma() {
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(() => IDIOMAS.indexOf(idioma.value));
  const botaoRef = useRef<HTMLButtonElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const raizRef = useRef<HTMLDivElement>(null);

  function abrir() {
    setDestacado(IDIOMAS.indexOf(idioma.value));
    setAberto(true);
  }

  function fechar(devolverFoco: boolean) {
    setAberto(false);
    if (devolverFoco) botaoRef.current?.focus();
  }

  function escolher(indice: number) {
    const alvo = IDIOMAS[indice];
    if (alvo !== undefined) void carregarIdioma(alvo);
    fechar(true);
  }

  useEffect(() => {
    if (aberto) listaRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(ev: MouseEvent) {
      if (!raizRef.current?.contains(ev.target as Node)) fechar(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  function aoTeclarBotao(ev: KeyboardEvent) {
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(ev.key)) {
      ev.preventDefault();
      abrir();
    }
  }

  function aoTeclarLista(ev: KeyboardEvent) {
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        setDestacado((d) => (d + 1) % IDIOMAS.length);
        break;
      case 'ArrowUp':
        ev.preventDefault();
        setDestacado((d) => (d - 1 + IDIOMAS.length) % IDIOMAS.length);
        break;
      case 'Enter':
      case ' ':
        ev.preventDefault();
        escolher(destacado);
        break;
      case 'Escape':
        ev.preventDefault();
        fechar(true);
        break;
      case 'Tab':
        fechar(false);
        break;
      default:
        break;
    }
  }

  const nomeCompletoAtual = t(`idiomas.${idioma.value}_completo`);

  return (
    <div class="lang" ref={raizRef}>
      <button
        type="button"
        class="lang-btn"
        ref={botaoRef}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={t('header.idiomaAtual', { idioma: nomeCompletoAtual })}
        onClick={() => (aberto ? fechar(false) : abrir())}
        onKeyDown={aoTeclarBotao}
      >
        <Bandeira idioma={idioma.value} />
        <span class="lang-name">{t(`idiomas.${idioma.value}`)}</span>
        <ChevronDown class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
      </button>
      <ul
        class="lang-list"
        role="listbox"
        tabIndex={-1}
        ref={listaRef}
        aria-label={t('header.escolherIdioma')}
        aria-activedescendant={aberto ? idOpcao(IDIOMAS[destacado] ?? IDIOMAS[0]!) : undefined}
        hidden={!aberto}
        onKeyDown={aoTeclarLista}
      >
        {IDIOMAS.map((opcao, i) => (
          <li
            key={opcao}
            id={idOpcao(opcao)}
            role="option"
            aria-selected={opcao === idioma.value}
            class={i === destacado ? 'active' : undefined}
            onMouseEnter={() => setDestacado(i)}
            onClick={() => escolher(i)}
          >
            <Bandeira idioma={opcao} />
            {t(`idiomas.${opcao}_completo`)}
            <Check class="icon icon-sm check" strokeWidth={1.75} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </div>
  );
}
