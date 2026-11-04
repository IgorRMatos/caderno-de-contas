import { effect, signal } from '@preact/signals';
import { temDados } from './state/derivados.js';

export type Rota = '/' | '/mapeamento' | '/caderno' | '/livro-caixa' | '/seus-dados';

const ROTAS_VALIDAS: readonly Rota[] = [
  '/',
  '/mapeamento',
  '/caderno',
  '/livro-caixa',
  '/seus-dados',
];

function lerHash(): Rota {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  return (ROTAS_VALIDAS as readonly string[]).includes(hash) ? (hash as Rota) : '/';
}

export const rotaAtual = signal<Rota>(lerHash());

window.addEventListener('hashchange', () => {
  rotaAtual.value = lerHash();
});

export function navegar(rota: Rota): void {
  if (window.location.hash.replace(/^#/, '') === rota) {
    rotaAtual.value = rota;
  } else {
    window.location.hash = rota;
  }
}

const ROTAS_COM_GUARDA: readonly Rota[] = ['/caderno', '/livro-caixa'];

/**
 * Sem NENHUM lançamento no app, #/caderno e #/livro-caixa não fazem sentido:
 * voltam para o início (TECH.md §2 "Rotas"). Usa `temDados` (não
 * `mesReferencia`) de propósito: um filtro que zera a lista (CA08.5) deve
 * mostrar o estado vazio dentro da tela, não chutar o usuário de volta.
 */
export function iniciarGuardaDeRotas(): () => void {
  return effect(() => {
    if (ROTAS_COM_GUARDA.includes(rotaAtual.value) && !temDados.value) {
      navegar('/');
    }
  });
}
