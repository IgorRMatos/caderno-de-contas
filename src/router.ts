import { effect, signal } from '@preact/signals';
import { mesReferencia } from './state/derivados.js';

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

/** Sem dados, #/caderno não faz sentido: volta para o início (TECH.md §2 "Rotas"). */
export function iniciarGuardaDeRotas(): () => void {
  return effect(() => {
    if (rotaAtual.value === '/caderno' && mesReferencia.value === null) {
      navegar('/');
    }
  });
}
