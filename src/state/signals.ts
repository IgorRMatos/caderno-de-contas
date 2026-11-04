import { signal } from '@preact/signals';
import { IDIOMA_PADRAO, type Idioma } from '../config.js';
import type { Categoria, Filtros, Lancamento } from '../domain/types.js';

export const FILTROS_PADRAO: Filtros = { periodo: { tipo: 'ultimo-mes' }, categorias: [] };

export const lancamentos = signal<Lancamento[]>([]);
export const categorias = signal<Categoria[]>([]);
export const filtros = signal<Filtros>(FILTROS_PADRAO);
export const tema = signal<'light' | 'dark'>('light');
export const idioma = signal<Idioma>(IDIOMA_PADRAO);

export interface EstadoUI {
  storageOk: boolean;
  avisoCorrupcaoMostrado: boolean;
  itensDescartados: number;
}

export const ui = signal<EstadoUI>({
  storageOk: true,
  avisoCorrupcaoMostrado: false,
  itensDescartados: 0,
});
