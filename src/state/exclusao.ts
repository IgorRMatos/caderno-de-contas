import { signal } from '@preact/signals';
import type { Lancamento } from '../domain/types.js';
import { lancamentos } from './signals.js';

export interface ExclusaoPendente {
  lancamento: Lancamento;
  /** Posição original na lista completa, para `desfazer` devolver ao mesmo lugar. */
  indice: number;
}

/**
 * D17 — só a última exclusão é desfazível: uma nova chamada a `excluirLancamento`
 * simplesmente substitui `exclusaoPendente`, tornando a exclusão anterior
 * definitiva (ela já saiu de `lancamentos`, não há nada a limpar).
 */
export const exclusaoPendente = signal<ExclusaoPendente | null>(null);

export function excluirLancamento(id: string): void {
  const indice = lancamentos.value.findIndex((l) => l.id === id);
  if (indice === -1) return;
  const lancamento = lancamentos.value[indice]!;
  lancamentos.value = lancamentos.value.filter((l) => l.id !== id);
  exclusaoPendente.value = { lancamento, indice };
}

/** @returns o id do lançamento restaurado, para quem chamou devolver o foco a ele. */
export function desfazerExclusao(): string | null {
  const pendente = exclusaoPendente.value;
  if (pendente === null) return null;
  const nova = [...lancamentos.value];
  nova.splice(Math.min(pendente.indice, nova.length), 0, pendente.lancamento);
  lancamentos.value = nova;
  exclusaoPendente.value = null;
  return pendente.lancamento.id;
}

/** Timer expirou (ou outra ação fechou a faixa sem desfazer): exclusão vira definitiva. */
export function confirmarExclusao(): void {
  exclusaoPendente.value = null;
}
