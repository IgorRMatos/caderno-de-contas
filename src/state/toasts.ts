import { signal } from '@preact/signals';
import { gerarId } from '../domain/id.js';

export type TipoToast = 'ok' | 'warn' | 'err';

export interface Toast {
  id: string;
  tipo: TipoToast;
  titulo?: string;
  mensagem: string;
  duracaoMs: number;
}

/** CA11.2 — 4s sucesso/atenção, 6s erro. */
const DURACAO_MS: Record<TipoToast, number> = { ok: 4000, warn: 4000, err: 6000 };

/** D16/CA11.4 — no máximo 3 visíveis; o novo entra no topo, o mais antigo sai. */
const MAX_VISIVEIS = 3;

export const toasts = signal<Toast[]>([]);

export function adicionarToast(tipo: TipoToast, mensagem: string, titulo?: string): string {
  const novo: Toast = { id: gerarId(), tipo, titulo, mensagem, duracaoMs: DURACAO_MS[tipo] };
  toasts.value = [novo, ...toasts.value].slice(0, MAX_VISIVEIS);
  return novo.id;
}

export function removerToast(id: string): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}
