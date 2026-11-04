export type Tipo = 'entrada' | 'saida';

export interface Lancamento {
  id: string;
  /** AAAA-MM-DD, data local, nunca `Date`. */
  data: string;
  descricao: string;
  /** Sempre positivo; o sinal vem de `tipo`. */
  valorCentavos: number;
  tipo: Tipo;
  /** id (slug) da categoria. */
  categoria: string;
  origem: 'importado' | 'manual' | 'exemplo';
  /** ISO com hora, carimbo de criação do registro (não da data do lançamento). */
  criadoEm: string;
}

export interface Categoria {
  id: string;
  nome: string;
  personalizada: boolean;
}

export type TipoPeriodo = 'ultimo-mes' | 'ultimos-3' | 'este-ano' | 'tudo' | 'mes' | 'intervalo';

export interface Filtros {
  periodo: {
    tipo: TipoPeriodo;
    /** AAAA-MM, usado quando `tipo` é 'mes' ou 'intervalo' (início). */
    de?: string;
    /** AAAA-MM, usado quando `tipo` é 'intervalo' (fim). */
    ate?: string;
  };
  /** vazio = todas */
  categorias: string[];
}
