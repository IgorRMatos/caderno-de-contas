import type { Idioma } from '../../config.js';
import { CATEGORIA_SEM_NOME } from '../../config.js';
import {
  dataNativaParaISO,
  inferirOrdemData,
  parseDataPlanilha,
  serialExcelParaISO,
} from '../dates.js';
import { gerarId, slugificar } from '../id.js';
import { centavosDeNumero, inferirSeparadorDecimal, parseValorPlanilha } from '../money.js';
import type { Categoria, Lancamento, Tipo } from '../types.js';
import type { CampoPlanilha } from './headers.js';
import { inferirMapeamentoColunas, inferirTipoPorTexto } from './headers.js';
import type { CelulaBruta, TabelaBruta } from './types.js';

export interface RelatorioImportacao {
  lancamentos: Lancamento[];
  categoriasEncontradas: Categoria[];
  semCategoria: number;
  invalidas: number;
  precisaMapeamento: boolean;
  palpite: Partial<Record<CampoPlanilha, number>>;
  colunas: string[];
  previa5: CelulaBruta[][];
}

function celulaString(c: CelulaBruta | undefined): string | undefined {
  return typeof c === 'string' ? c : undefined;
}

/**
 * CA01.2, CA01.5–CA01.9, CA02.1–CA02.3 — transforma uma tabela já lida (CSV
 * ou XLSX, ver `io/`) em lançamentos. Puro: não toca em `File`/DOM/storage.
 */
export function processarTabela(
  tabela: TabelaBruta,
  idiomaAtivo: Idioma,
  origem: 'importado' | 'exemplo',
  mapeamentoManual?: Partial<Record<CampoPlanilha, number>>,
): RelatorioImportacao {
  const palpite = inferirMapeamentoColunas(tabela.colunas);
  const mapeamento = mapeamentoManual ?? palpite;
  const previa5 = tabela.linhas.slice(0, 5);

  const colunaData = mapeamento.data;
  const colunaValor = mapeamento.valor;
  const precisaMapeamento = colunaData === undefined || colunaValor === undefined;

  if (precisaMapeamento || colunaData === undefined || colunaValor === undefined) {
    return {
      lancamentos: [],
      categoriasEncontradas: [],
      semCategoria: 0,
      invalidas: 0,
      precisaMapeamento: true,
      palpite,
      colunas: tabela.colunas,
      previa5,
    };
  }

  const valoresBrutos = tabela.linhas
    .map((l) => celulaString(l[colunaValor]))
    .filter((v): v is string => v !== undefined);
  const datasBrutas = tabela.linhas
    .map((l) => celulaString(l[colunaData]))
    .filter((v): v is string => v !== undefined);

  const decimalChar = inferirSeparadorDecimal(valoresBrutos);
  const ordemData = inferirOrdemData(datasBrutas, idiomaAtivo);

  const lancamentos: Lancamento[] = [];
  const categoriasMap = new Map<string, Categoria>();
  let semCategoria = 0;
  let invalidas = 0;

  for (const linha of tabela.linhas) {
    const celulaData = linha[colunaData];
    const celulaValor = linha[colunaValor];

    const dataISO = resolverData(celulaData, ordemData);
    const centavosComSinal = resolverValor(celulaValor, decimalChar);

    if (dataISO === null || centavosComSinal === null || centavosComSinal === 0) {
      invalidas++;
      continue;
    }

    const tipo = resolverTipo(mapeamento.tipo, linha, centavosComSinal);
    const { categoriaId, semCategoriaNestaLinha } = resolverCategoria(
      mapeamento.categoria,
      linha,
      categoriasMap,
    );
    if (semCategoriaNestaLinha) semCategoria++;

    const descricao =
      mapeamento.descricao !== undefined
        ? (celulaString(linha[mapeamento.descricao]) ?? '').trim()
        : '';

    lancamentos.push({
      id: gerarId(),
      data: dataISO,
      descricao,
      valorCentavos: Math.abs(centavosComSinal),
      tipo,
      categoria: categoriaId,
      origem,
      criadoEm: new Date().toISOString(),
    });
  }

  return {
    lancamentos,
    categoriasEncontradas: [...categoriasMap.values()],
    semCategoria,
    invalidas,
    precisaMapeamento: false,
    palpite,
    colunas: tabela.colunas,
    previa5,
  };
}

function resolverData(
  celula: CelulaBruta | undefined,
  ordem: ReturnType<typeof inferirOrdemData>,
): string | null {
  if (celula instanceof Date) return dataNativaParaISO(celula);
  if (typeof celula === 'number') return serialExcelParaISO(celula);
  if (typeof celula === 'string' && celula.trim() !== '') {
    const r = parseDataPlanilha(celula, ordem);
    return r.ok ? r.iso : null;
  }
  return null;
}

function resolverValor(
  celula: CelulaBruta | undefined,
  decimalChar: ReturnType<typeof inferirSeparadorDecimal>,
): number | null {
  if (typeof celula === 'number') return centavosDeNumero(celula);
  if (typeof celula === 'string' && celula.trim() !== '') {
    const r = parseValorPlanilha(celula, decimalChar);
    return r.ok ? r.centavos : null;
  }
  return null;
}

function resolverTipo(
  colunaTipo: number | undefined,
  linha: CelulaBruta[],
  centavosComSinal: number,
): Tipo {
  if (colunaTipo !== undefined) {
    const celula = celulaString(linha[colunaTipo]);
    const inferido = celula !== undefined ? inferirTipoPorTexto(celula) : null;
    if (inferido !== null) return inferido;
  }
  return centavosComSinal < 0 ? 'saida' : 'entrada';
}

function resolverCategoria(
  colunaCategoria: number | undefined,
  linha: CelulaBruta[],
  categoriasMap: Map<string, Categoria>,
): { categoriaId: string; semCategoriaNestaLinha: boolean } {
  if (colunaCategoria !== undefined) {
    const nomeBruto = celulaString(linha[colunaCategoria])?.trim();
    if (nomeBruto !== undefined && nomeBruto !== '') {
      const id = slugificar(nomeBruto);
      if (!categoriasMap.has(id)) {
        categoriasMap.set(id, { id, nome: nomeBruto, personalizada: false });
      }
      return { categoriaId: id, semCategoriaNestaLinha: false };
    }
  }
  return { categoriaId: CATEGORIA_SEM_NOME, semCategoriaNestaLinha: true };
}
