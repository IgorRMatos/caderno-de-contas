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

/**
 * Sem NENHUM lançamento no app, #/caderno não faz sentido: volta para o início
 * (TECH.md §2 "Rotas"). Usa `temDados` (não `mesReferencia`) de propósito: um
 * filtro que zera a lista (CA08.5) deve mostrar o estado vazio dentro do
 * dashboard, não chutar o usuário de volta para o início.
 */
export function iniciarGuardaDeRotas(): () => void {
  return effect(() => {
    if (rotaAtual.value === '/caderno' && !temDados.value) {
      navegar('/');
    }
  });
}
