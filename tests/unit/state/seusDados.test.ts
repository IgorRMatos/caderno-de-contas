import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAVES, chaveBackup } from '../../../src/storage/chaves';
import { iniciarPersistencia } from '../../../src/state/persistencia';
import { exclusaoPendente } from '../../../src/state/exclusao';
import { painelLancamento } from '../../../src/state/painelLancamento';
import {
  abrirDialogoApagar,
  apagarDados,
  dialogoApagarAberto,
  exportarDados,
} from '../../../src/state/seusDados';
import {
  categorias,
  filtros,
  FILTROS_PADRAO,
  idioma,
  lancamentos,
  tema,
} from '../../../src/state/signals';
import { toasts } from '../../../src/state/toasts';
import type { Lancamento } from '../../../src/domain/types';

const L: Lancamento = {
  id: 'a1',
  data: '2026-10-01',
  descricao: 'Farinha',
  valorCentavos: 45000,
  tipo: 'saida',
  categoria: 'embalagens',
  origem: 'manual',
  criadoEm: '2026-10-01T12:00:00.000Z',
};

let parar: (() => void) | null = null;

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  lancamentos.value = [];
  categorias.value = [];
  filtros.value = FILTROS_PADRAO;
  tema.value = 'light';
  idioma.value = 'pt-BR';
  toasts.value = [];
  window.location.hash = '#/seus-dados';
});

afterEach(() => {
  parar?.();
  parar = null;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('apagarDados — CA12.3', () => {
  it('apaga lançamentos, categorias, filtros e backups; mantém tema e idioma; volta ao Início com toast', () => {
    vi.useFakeTimers();
    window.localStorage.setItem(CHAVES.tema, 'dark');
    window.localStorage.setItem(CHAVES.idioma, 'es');
    window.localStorage.setItem(chaveBackup(CHAVES.lancamentos), '{"estragado":');
    parar = iniciarPersistencia().parar;

    lancamentos.value = [L];
    categorias.value = [{ id: 'embalagens', nome: 'Embalagens', personalizada: true }];
    filtros.value = { periodo: { tipo: 'tudo' }, categorias: ['embalagens'] };
    vi.advanceTimersByTime(200);
    expect(window.localStorage.getItem(CHAVES.lancamentos)).toContain('Farinha');

    painelLancamento.value = { modo: 'novo' };
    exclusaoPendente.value = { lancamento: L, indice: 0 };
    abrirDialogoApagar();

    apagarDados();
    vi.advanceTimersByTime(200);

    expect(lancamentos.value).toEqual([]);
    expect(categorias.value).toEqual([]);
    expect(filtros.value).toEqual(FILTROS_PADRAO);
    expect(window.localStorage.getItem(CHAVES.lancamentos) ?? '[]').toBe('[]');
    expect(window.localStorage.getItem(CHAVES.categorias) ?? '[]').toBe('[]');
    expect(window.localStorage.getItem(chaveBackup(CHAVES.lancamentos))).toBeNull();

    expect(tema.value).toBe('dark');
    expect(idioma.value).toBe('es');
    expect(window.localStorage.getItem(CHAVES.tema)).toBe('dark');
    expect(window.localStorage.getItem(CHAVES.idioma)).toBe('es');

    expect(dialogoApagarAberto.value).toBe(false);
    expect(painelLancamento.value).toBeNull();
    expect(exclusaoPendente.value).toBeNull();
    expect(window.location.hash).toBe('#/');
    expect(toasts.value[0]).toMatchObject({ tipo: 'ok', titulo: 'Caderno zerado' });
  });
});

describe('exportarDados — CA12.2', () => {
  it('baixa caderno-AAAA-MM-DD.csv via Blob + <a download> (sem rede) e mostra "Cópia baixada"', async () => {
    const criar = vi.fn((_b: Blob) => 'blob:fake');
    const revogar = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: criar, revokeObjectURL: revogar }));
    const cliques: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      cliques.push(this);
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    lancamentos.value = [L, { ...L, id: 'a2', descricao: '=1+1' }];
    exportarDados();

    expect(cliques).toHaveLength(1);
    expect(cliques[0]!.download).toMatch(/^caderno-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(cliques[0]!.isConnected).toBe(false); // removido do DOM depois do clique
    const blob = criar.mock.calls[0]![0];
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM UTF-8
    const texto = new TextDecoder().decode(bytes.slice(3));
    expect(texto.split('\n')[0]).toBe('data;descricao;valor;tipo;categoria');
    expect(texto).toContain(";'=1+1;");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(toasts.value[0]).toMatchObject({ tipo: 'ok', titulo: 'Cópia baixada' });
    expect(toasts.value[0]!.mensagem).toBe(`${cliques[0]!.download} com 2 lançamentos.`);
    expect(toasts.value[0]!.mensagem).toMatch(/^caderno-/);
  });
});
