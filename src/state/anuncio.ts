import { signal } from '@preact/signals';

/** UX §8 — uma única live region `polite` para "caderno pronto", recálculos e desfazer. */
export const anuncio = signal('');

export function anunciar(texto: string): void {
  // zera antes para o leitor de tela anunciar mesmo quando o texto repete.
  anuncio.value = '';
  setTimeout(() => {
    anuncio.value = texto;
  }, 30);
}
