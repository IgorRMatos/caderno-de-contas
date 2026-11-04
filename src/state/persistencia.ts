import { effect } from '@preact/signals';
import { IDIOMAS, type Idioma } from '../config.js';
import { criarStorage, type StorageCaderno } from '../storage/index.js';
import { categorias, filtros, FILTROS_PADRAO, idioma, lancamentos, tema, ui } from './signals.js';

const DEBOUNCE_MS = 150;

function idiomaValido(v: string): v is Idioma {
  return (IDIOMAS as readonly string[]).includes(v);
}

/**
 * D8 — lê `window.localStorage` **dentro de try/catch**: no Firefox/Safari
 * com storage bloqueado, só acessar a propriedade já lança (bug real do
 * projeto anterior), então nunca chamamos `criarStorage(window.localStorage)`
 * diretamente.
 */
function obterImplementacaoStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export interface PersistenciaIniciada {
  storage: StorageCaderno;
  /** Desliga os `effect`s de persistência (uso em testes; o app nunca chama isso). */
  parar(): void;
}

/**
 * Carrega o estado inicial do storage e liga os `effect`s de persistência
 * (debounce de 150 ms para lançamentos/categorias/filtros; tema e idioma
 * gravam na hora, são baratos e não entram em loop de digitação).
 * Chamar uma única vez, no boot (`main.tsx`).
 */
export function iniciarPersistencia(): PersistenciaIniciada {
  const storage = criarStorage(obterImplementacaoStorage());
  const carga = storage.carregarTudo();

  lancamentos.value = carga.lancamentos;
  categorias.value = carga.categorias;
  filtros.value = carga.filtros ?? FILTROS_PADRAO;
  if (carga.tema) tema.value = carga.tema;
  if (carga.idioma && idiomaValido(carga.idioma)) idioma.value = carga.idioma;

  ui.value = {
    storageOk: storage.disponivel,
    avisoCorrupcaoMostrado: false,
    itensDescartados: carga.itensDescartados,
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const pararDebounce = effect(() => {
    // lido aqui (fora do timeout) para o `effect` assinar as mudanças
    const listaLancamentos = lancamentos.value;
    const listaCategorias = categorias.value;
    const filtrosAtuais = filtros.value;

    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      const ok1 = storage.salvarLancamentos(listaLancamentos);
      const ok2 = storage.salvarCategorias(listaCategorias);
      const ok3 = storage.salvarFiltros(filtrosAtuais);
      if (!ok1 || !ok2 || !ok3) {
        if (ui.value.storageOk) ui.value = { ...ui.value, storageOk: false };
      }
    }, DEBOUNCE_MS);
  });

  const pararTema = effect(() => {
    storage.salvarTema(tema.value);
  });
  const pararIdioma = effect(() => {
    storage.salvarIdioma(idioma.value);
  });

  return {
    storage,
    parar() {
      if (timer !== undefined) clearTimeout(timer);
      pararDebounce();
      pararTema();
      pararIdioma();
    },
  };
}
