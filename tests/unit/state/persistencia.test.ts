import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAVES } from '../../../src/storage/chaves';
import { iniciarPersistencia } from '../../../src/state/persistencia';
import {
  categorias,
  filtros,
  FILTROS_PADRAO,
  idioma,
  lancamentos,
  tema,
  ui,
} from '../../../src/state/signals';

function resetSinais() {
  lancamentos.value = [];
  categorias.value = [];
  filtros.value = FILTROS_PADRAO;
  tema.value = 'light';
  idioma.value = 'pt-BR';
  ui.value = { storageOk: true, avisoCorrupcaoMostrado: false, itensDescartados: 0 };
  // o effect de tema grava data-theme no <html>; sem isso, um teste anterior
  // vaza o atributo para o próximo (o app real conta com o script inline do
  // D7 já ter resolvido isso antes do boot — aqui simulamos "página nova").
  document.documentElement.removeAttribute('data-theme');
}

let parar: (() => void) | null = null;

beforeEach(() => {
  window.localStorage.clear();
  resetSinais();
});

afterEach(() => {
  parar?.();
  parar = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('iniciarPersistencia — carga inicial (CA13.2)', () => {
  it('sem nada salvo, começa com os padrões', () => {
    const p = iniciarPersistencia();
    parar = p.parar;
    expect(lancamentos.value).toEqual([]);
    expect(filtros.value).toEqual(FILTROS_PADRAO);
    expect(p.storage.disponivel).toBe(true);
  });

  it('recarrega o que já estava salvo', () => {
    window.localStorage.setItem(CHAVES.tema, 'dark');
    window.localStorage.setItem(CHAVES.idioma, 'en');
    const p = iniciarPersistencia();
    parar = p.parar;
    expect(tema.value).toBe('dark');
    expect(idioma.value).toBe('en');
  });

  it('D7: <html data-theme> já resolvido pelo script inline tem prioridade sobre o storage (evita dessincronia)', () => {
    window.localStorage.setItem(CHAVES.tema, 'light');
    document.documentElement.setAttribute('data-theme', 'dark'); // simula prefers-color-scheme: dark
    const p = iniciarPersistencia();
    parar = p.parar;
    expect(tema.value).toBe('dark');
  });

  it('tema.value muda o data-theme do <html> em runtime (ex.: clique no sol/lua)', () => {
    const p = iniciarPersistencia();
    parar = p.parar;
    tema.value = 'dark';
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    tema.value = 'light';
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('iniciarPersistencia — persiste com debounce de 150ms', () => {
  it('não grava antes do debounce, grava depois', () => {
    vi.useFakeTimers();
    const p = iniciarPersistencia();
    parar = p.parar;

    lancamentos.value = [
      {
        id: 'a1',
        data: '2026-10-15',
        descricao: 'Venda',
        valorCentavos: 1000,
        tipo: 'entrada',
        categoria: 'vendas',
        origem: 'manual',
        criadoEm: new Date().toISOString(),
      },
    ];

    vi.advanceTimersByTime(100);
    expect(window.localStorage.getItem(CHAVES.lancamentos)).toBeNull();

    vi.advanceTimersByTime(60);
    expect(window.localStorage.getItem(CHAVES.lancamentos)).not.toBeNull();
    expect(JSON.parse(window.localStorage.getItem(CHAVES.lancamentos)!)).toHaveLength(1);
  });

  it('mudanças rápidas em sequência só gravam uma vez, com o valor final', () => {
    vi.useFakeTimers();
    const p = iniciarPersistencia();
    parar = p.parar;

    filtros.value = { periodo: { tipo: 'ultimos-3' }, categorias: [] };
    vi.advanceTimersByTime(50);
    filtros.value = { periodo: { tipo: 'este-ano' }, categorias: [] };
    vi.advanceTimersByTime(50);
    filtros.value = { periodo: { tipo: 'tudo' }, categorias: ['vendas'] };
    vi.advanceTimersByTime(150);

    const salvo = JSON.parse(window.localStorage.getItem(CHAVES.filtros)!);
    expect(salvo).toEqual({ periodo: { tipo: 'tudo' }, categorias: ['vendas'] });
  });
});

describe('iniciarPersistencia — window.localStorage lançando no getter (bug do projeto anterior)', () => {
  it('não lança: cai para modo memória com storageOk=false', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get(): Storage {
        throw new Error('SecurityError: acesso negado (modo privado)');
      },
    });

    try {
      // só LER a propriedade já lança — é exatamente o bug do projeto anterior
      expect(() => window.localStorage).toThrow();

      const p = iniciarPersistencia();
      parar = p.parar;
      expect(p.storage.disponivel).toBe(false);
      expect(ui.value.storageOk).toBe(false);
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});
