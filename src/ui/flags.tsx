import brSvg from 'flag-icons/flags/4x3/br.svg?raw';
import esSvg from 'flag-icons/flags/4x3/es.svg?raw';
import usSvg from 'flag-icons/flags/4x3/us.svg?raw';
import type { Idioma } from '../config.js';

/**
 * D13 — exceção explícita ao `dangerouslySetInnerHTML` proibido: SVGs de
 * bandeira estáticos do repo (flag-icons, MIT), nunca emoji (CA10.1).
 */
const BANDEIRAS: Record<Idioma, string> = {
  'pt-BR': brSvg,
  es: esSvg,
  en: usSvg,
};

export function Bandeira({ idioma }: { idioma: Idioma }) {
  return (
    <span class="flag" aria-hidden="true" dangerouslySetInnerHTML={{ __html: BANDEIRAS[idioma] }} />
  );
}
