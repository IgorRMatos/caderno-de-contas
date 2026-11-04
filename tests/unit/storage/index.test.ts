import { describe, expect, it } from 'vitest';
import { CHAVES, chaveBackup } from '../../../src/storage/chaves';
import { criarStorage } from '../../../src/storage/index';

function fakeStorageOk(inicial: Record<string, string> = {}): Storage {
  const dados: Record<string, string> = { ...inicial };
  return {
    getItem: (k: string) => (Object.prototype.hasOwnProperty.call(dados, k) ? dados[k]! : null),
    setItem: (k: string, v: string) => {
      dados[k] = v;
    },
    removeItem: (k: string) => {
      delete dados[k];
    },
    clear: () => {
      for (const k of Object.keys(dados)) delete dados[k];
    },
    key: (i: number) => Object.keys(dados)[i] ?? null,
    get length() {
      return Object.keys(dados).length;
    },
  };
}

describe('criarStorage — carga normal (CA13.1, CA13.2)', () => {
  it('carrega lançamentos, categorias e filtros salvos', () => {
    const lancamento = {
      id: 'a1',
      data: '2026-10-15',
      descricao: 'Venda',
      valorCentavos: 1000,
      tipo: 'entrada',
      categoria: 'vendas',
      origem: 'manual',
      criadoEm: new Date().toISOString(),
    };
    const categoria = { id: 'vendas', nome: 'Vendas', personalizada: false };
    const filtros = { periodo: { tipo: 'ultimo-mes' }, categorias: [] };

    const impl = fakeStorageOk({
      [CHAVES.lancamentos]: JSON.stringify([lancamento]),
      [CHAVES.categorias]: JSON.stringify([categoria]),
      [CHAVES.filtros]: JSON.stringify(filtros),
      [CHAVES.tema]: 'dark',
      [CHAVES.idioma]: 'es',
    });

    const storage = criarStorage(impl);
    const carga = storage.carregarTudo();

    expect(carga.lancamentos).toEqual([lancamento]);
    expect(carga.categorias).toEqual([categoria]);
    expect(carga.filtros).toEqual(filtros);
    expect(carga.tema).toBe('dark');
    expect(carga.idioma).toBe('es');
    expect(carga.avisoCorrupcao).toBe(false);
    expect(carga.itensDescartados).toBe(0);
  });

  it('nada salvo ainda → listas vazias, sem aviso', () => {
    const storage = criarStorage(fakeStorageOk());
    const carga = storage.carregarTudo();
    expect(carga).toMatchObject({
      lancamentos: [],
      categorias: [],
      filtros: null,
      tema: null,
      idioma: null,
      avisoCorrupcao: false,
      itensDescartados: 0,
    });
  });
});

describe('criarStorage — JSON corrompido (CA13.3, D9)', () => {
  it('lançamentos corrompidos → backup feito, segue com lista vazia, sem lançar', () => {
    const impl = fakeStorageOk({ [CHAVES.lancamentos]: '{lixo invalido' });
    const storage = criarStorage(impl);
    const carga = storage.carregarTudo();

    expect(carga.lancamentos).toEqual([]);
    expect(carga.avisoCorrupcao).toBe(true);
    expect(impl.getItem(chaveBackup(CHAVES.lancamentos))).toBe('{lixo invalido');
  });

  it('JSON válido mas não é array → tratado como corrompido, com backup', () => {
    const impl = fakeStorageOk({ [CHAVES.categorias]: JSON.stringify({ nao: 'array' }) });
    const storage = criarStorage(impl);
    const carga = storage.carregarTudo();

    expect(carga.categorias).toEqual([]);
    expect(carga.avisoCorrupcao).toBe(true);
    expect(impl.getItem(chaveBackup(CHAVES.categorias))).not.toBeNull();
  });
});

describe('criarStorage — item de shape inválido descartado (T4)', () => {
  it('mantém os lançamentos válidos e descarta os inválidos, contando-os', () => {
    const valido = {
      id: 'a1',
      data: '2026-10-15',
      descricao: 'Venda',
      valorCentavos: 1000,
      tipo: 'entrada',
      categoria: 'vendas',
      origem: 'manual',
      criadoEm: new Date().toISOString(),
    };
    const invalidos = [
      { ...valido, id: 'a2', valorCentavos: -5 },
      { ...valido, id: 'a3', tipo: 'xyz' },
      { sem: 'forma' },
    ];
    const impl = fakeStorageOk({
      [CHAVES.lancamentos]: JSON.stringify([valido, ...invalidos]),
    });
    const storage = criarStorage(impl);
    const carga = storage.carregarTudo();

    expect(carga.lancamentos).toEqual([valido]);
    expect(carga.itensDescartados).toBe(3);
    expect(carga.avisoCorrupcao).toBe(false); // JSON válido, só itens ruins — não é "corrompido"
  });
});

describe('criarStorage — storage indisponível (CA13.3, D10)', () => {
  it('impl null → disponivel=false, carrega vazio, salvar retorna false, sem lançar', () => {
    const storage = criarStorage(null);
    expect(storage.disponivel).toBe(false);
    const carga = storage.carregarTudo();
    expect(carga.lancamentos).toEqual([]);
    expect(storage.salvarLancamentos([])).toBe(false);
  });
});

describe('criarStorage — salvar (CA13.1)', () => {
  it('grava e relê lançamentos, categorias e filtros', () => {
    const impl = fakeStorageOk();
    const storage = criarStorage(impl);
    const lancamento = {
      id: 'a1',
      data: '2026-10-15',
      descricao: 'Venda',
      valorCentavos: 1000,
      tipo: 'entrada' as const,
      categoria: 'vendas',
      origem: 'manual' as const,
      criadoEm: new Date().toISOString(),
    };
    expect(storage.salvarLancamentos([lancamento])).toBe(true);
    expect(storage.salvarTema('dark')).toBe(true);
    expect(storage.salvarIdioma('en')).toBe(true);

    const recarregado = criarStorage(impl).carregarTudo();
    expect(recarregado.lancamentos).toEqual([lancamento]);
    expect(recarregado.tema).toBe('dark');
    expect(recarregado.idioma).toBe('en');
  });
});
