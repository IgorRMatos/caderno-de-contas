import { beforeEach, describe, expect, it } from 'vitest';
import {
  adicionarLancamento,
  criarCategoriaSePreciso,
  editarLancamento,
} from '../../../src/state/lancamentos';
import { categorias, lancamentos } from '../../../src/state/signals';
import { toasts } from '../../../src/state/toasts';

beforeEach(() => {
  lancamentos.value = [];
  categorias.value = [{ id: 'outros', nome: 'outros', personalizada: false }];
  toasts.value = [];
});

describe('criarCategoriaSePreciso (CA04.3)', () => {
  it('cria uma categoria nova e persiste no signal', () => {
    const id = criarCategoriaSePreciso('Manutenção do forno');
    expect(id).toBe('manutencao-do-forno');
    expect(categorias.value).toContainEqual({
      id: 'manutencao-do-forno',
      nome: 'Manutenção do forno',
      personalizada: true,
    });
  });

  it('reaproveita uma categoria já existente com o mesmo slug, sem duplicar', () => {
    const id = criarCategoriaSePreciso('outros');
    expect(id).toBe('outros');
    expect(categorias.value).toHaveLength(1);
  });
});

describe('adicionarLancamento (CA04.1)', () => {
  it('adiciona à lista com origem "manual" e um toast "Anotado"', () => {
    adicionarLancamento({
      tipo: 'saida',
      valorCentavos: 45000,
      descricao: 'Farinha',
      data: '2026-11-03',
      categoria: 'outros',
    });
    expect(lancamentos.value).toHaveLength(1);
    expect(lancamentos.value[0]).toMatchObject({
      origem: 'manual',
      tipo: 'saida',
      valorCentavos: 45000,
      descricao: 'Farinha',
    });
    expect(lancamentos.value[0]!.id).toBeTruthy();
    expect(lancamentos.value[0]!.criadoEm).toBeTruthy();
    expect(toasts.value[0]).toMatchObject({ tipo: 'ok', titulo: 'Anotado' });
  });
});

describe('editarLancamento (CA04.2)', () => {
  it('corrige campos preservando id/origem/criadoEm, com toast "Corrigido"', () => {
    adicionarLancamento({
      tipo: 'saida',
      valorCentavos: 45000,
      descricao: 'Farinha',
      data: '2026-11-03',
      categoria: 'outros',
    });
    const original = lancamentos.value[0]!;

    editarLancamento(original.id, {
      tipo: 'saida',
      valorCentavos: 50000,
      descricao: 'Farinha, Moinho Sul',
      data: '2026-11-04',
      categoria: 'outros',
    });

    expect(lancamentos.value).toHaveLength(1);
    expect(lancamentos.value[0]).toMatchObject({
      id: original.id,
      origem: 'manual',
      criadoEm: original.criadoEm,
      valorCentavos: 50000,
      descricao: 'Farinha, Moinho Sul',
      data: '2026-11-04',
    });
    expect(toasts.value[0]).toMatchObject({ tipo: 'ok', titulo: 'Corrigido' });
  });
});
