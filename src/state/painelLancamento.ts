import { signal } from '@preact/signals';
import type { Lancamento } from '../domain/types.js';

export type ModoPainelLancamento = { modo: 'novo' } | { modo: 'editar'; lancamento: Lancamento };

/** T11 — painel "Anotar no caderno"/"Corrigir lançamento", compartilhado entre o dashboard e o livro-caixa. */
export const painelLancamento = signal<ModoPainelLancamento | null>(null);

export function abrirNovoLancamento(): void {
  painelLancamento.value = { modo: 'novo' };
}

export function abrirEdicaoLancamento(lancamento: Lancamento): void {
  painelLancamento.value = { modo: 'editar', lancamento };
}

export function fecharPainelLancamento(): void {
  painelLancamento.value = null;
}
