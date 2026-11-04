import type { Categoria, Filtros, Lancamento } from '../domain/types.js';
import { CHAVES, chaveBackup } from './chaves.js';
import { migrar } from './migrate.js';
import type { StorageSeguro } from './seguro.js';
import { criarStorageSeguro } from './seguro.js';
import { categoriaValida, filtrosValidos, lancamentoValido } from './validar.js';

export interface CargaInicial {
  lancamentos: Lancamento[];
  categorias: Categoria[];
  /** `null` = nada salvo (ou inválido); quem chama aplica o padrão. */
  filtros: Filtros | null;
  tema: 'light' | 'dark' | null;
  idioma: string | null;
  /** D8 — algum JSON corrompido foi encontrado (backup feito, toast de atenção). */
  avisoCorrupcao: boolean;
  /** D8 — quantos itens de shape inválido foram descartados (toast de atenção). */
  itensDescartados: number;
}

function carregarColecao<T>(
  seguro: StorageSeguro,
  chave: string,
  itemValido: (x: unknown) => x is T,
): { itens: T[]; corrompido: boolean; descartados: number } {
  const bruto = seguro.lerBruto(chave);
  if (bruto === null) return { itens: [], corrompido: false, descartados: 0 };

  let dados: unknown;
  try {
    dados = JSON.parse(bruto);
  } catch {
    seguro.gravarBruto(chaveBackup(chave), bruto);
    return { itens: [], corrompido: true, descartados: 0 };
  }

  if (!Array.isArray(dados)) {
    seguro.gravarBruto(chaveBackup(chave), bruto);
    return { itens: [], corrompido: true, descartados: 0 };
  }

  const itens = dados.filter(itemValido);
  return { itens, corrompido: false, descartados: dados.length - itens.length };
}

function carregarObjeto<T>(
  seguro: StorageSeguro,
  chave: string,
  ehValido: (x: unknown) => x is T,
): { valor: T | null; corrompido: boolean } {
  const bruto = seguro.lerBruto(chave);
  if (bruto === null) return { valor: null, corrompido: false };

  let dados: unknown;
  try {
    dados = JSON.parse(bruto);
  } catch {
    seguro.gravarBruto(chaveBackup(chave), bruto);
    return { valor: null, corrompido: true };
  }

  if (!ehValido(dados)) {
    seguro.gravarBruto(chaveBackup(chave), bruto);
    return { valor: null, corrompido: true };
  }
  return { valor: dados, corrompido: false };
}

const TEMAS_VALIDOS = new Set(['light', 'dark']);

export interface StorageCaderno {
  disponivel: boolean;
  carregarTudo(): CargaInicial;
  salvarLancamentos(lista: readonly Lancamento[]): boolean;
  salvarCategorias(lista: readonly Categoria[]): boolean;
  salvarFiltros(filtros: Filtros): boolean;
  salvarTema(tema: string): boolean;
  salvarIdioma(idioma: string): boolean;
}

/** D8 completo. `impl` já deve ter vindo de um `try { window.localStorage } catch {}` de quem chama. */
export function criarStorage(impl: Storage | null): StorageCaderno {
  const seguro = criarStorageSeguro(impl);

  function carregarTudo(): CargaInicial {
    const metaBruto = seguro.lerBruto(CHAVES.meta);
    const meta = ((): { schema: number } | null => {
      try {
        return metaBruto ? (JSON.parse(metaBruto) as { schema: number }) : null;
      } catch {
        return null;
      }
    })();
    const metaMigrada = migrar(meta); // existe desde já; hoje não faz nada de fato
    if (meta === null) seguro.gravarBruto(CHAVES.meta, JSON.stringify(metaMigrada));

    const lanc = carregarColecao(seguro, CHAVES.lancamentos, lancamentoValido);
    const cat = carregarColecao(seguro, CHAVES.categorias, categoriaValida);
    const filt = carregarObjeto(seguro, CHAVES.filtros, filtrosValidos);

    const temaBruto = seguro.lerBruto(CHAVES.tema);
    const tema =
      temaBruto !== null && TEMAS_VALIDOS.has(temaBruto) ? (temaBruto as 'light' | 'dark') : null;

    const idiomaBruto = seguro.lerBruto(CHAVES.idioma);

    return {
      lancamentos: lanc.itens,
      categorias: cat.itens,
      filtros: filt.valor,
      tema,
      idioma: idiomaBruto,
      avisoCorrupcao: lanc.corrompido || cat.corrompido || filt.corrompido,
      itensDescartados: lanc.descartados + cat.descartados,
    };
  }

  return {
    get disponivel() {
      return seguro.disponivel;
    },
    carregarTudo,
    salvarLancamentos: (lista) => seguro.gravarBruto(CHAVES.lancamentos, JSON.stringify(lista)),
    salvarCategorias: (lista) => seguro.gravarBruto(CHAVES.categorias, JSON.stringify(lista)),
    salvarFiltros: (filtros) => seguro.gravarBruto(CHAVES.filtros, JSON.stringify(filtros)),
    salvarTema: (tema) => seguro.gravarBruto(CHAVES.tema, tema),
    salvarIdioma: (idioma) => seguro.gravarBruto(CHAVES.idioma, idioma),
  };
}
