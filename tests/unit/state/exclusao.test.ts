import { beforeEach, describe, expect, it } from 'vitest';
import {
  confirmarExclusao,
  desfazerExclusao,
  excluirLancamento,
  exclusaoPendente,
} from '../../../src/state/exclusao';
import { lancamentos } from '../../../src/state/signals';
import type { Lancamento } from '../../../src/domain/types';

function lancamento(id: string, descricao: string): Lancamento {
  return {
    id,
    data: '2026-10-01',
    descricao,
    valorCentavos: 1000,
    tipo: 'saida',
    categoria: 'outros',
    origem: 'manual',
    criadoEm: '2026-10-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  lancamentos.value = [lancamento('a', 'A'), lancamento('b', 'B'), lancamento('c', 'C')];
  exclusaoPendente.value = null;
});

describe('excluirLancamento (D17)', () => {
  it('remove da lista na hora e guarda posição original em exclusaoPendente', () => {
    excluirLancamento('b');
    expect(lancamentos.value.map((l) => l.id)).toEqual(['a', 'c']);
    expect(exclusaoPendente.value).toMatchObject({ indice: 1, lancamento: { id: 'b' } });
  });

  it('só a última exclusão fica desfazível: excluir de novo substitui a pendente', () => {
    excluirLancamento('a');
    excluirLancamento('c');
    expect(lancamentos.value.map((l) => l.id)).toEqual(['b']);
    expect(exclusaoPendente.value?.lancamento.id).toBe('c');
  });
});

describe('desfazerExclusao', () => {
  it('devolve o mesmo objeto (mesmo id) à posição original', () => {
    excluirLancamento('b');
    const idRestaurado = desfazerExclusao();
    expect(idRestaurado).toBe('b');
    expect(lancamentos.value.map((l) => l.id)).toEqual(['a', 'b', 'c']);
    expect(exclusaoPendente.value).toBeNull();
  });

  it('sem exclusão pendente, não faz nada', () => {
    const resultado = desfazerExclusao();
    expect(resultado).toBeNull();
    expect(lancamentos.value).toHaveLength(3);
  });
});

describe('confirmarExclusao', () => {
  it('limpa a pendência sem mexer na lista (exclusão vira definitiva)', () => {
    excluirLancamento('b');
    confirmarExclusao();
    expect(exclusaoPendente.value).toBeNull();
    expect(lancamentos.value.map((l) => l.id)).toEqual(['a', 'c']);
  });
});
