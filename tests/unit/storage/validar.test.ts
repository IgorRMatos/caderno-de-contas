import { describe, expect, it } from 'vitest';
import { categoriaValida, filtrosValidos, lancamentoValido } from '../../../src/storage/validar';

const LANCAMENTO_OK = {
  id: 'a1',
  data: '2026-10-15',
  descricao: 'Venda',
  valorCentavos: 1000,
  tipo: 'entrada',
  categoria: 'vendas',
  origem: 'manual',
  criadoEm: new Date().toISOString(),
};

describe('lancamentoValido', () => {
  it('aceita um lançamento bem formado', () => {
    expect(lancamentoValido(LANCAMENTO_OK)).toBe(true);
  });

  it('rejeita valorCentavos não inteiro, zero ou negativo', () => {
    expect(lancamentoValido({ ...LANCAMENTO_OK, valorCentavos: 10.5 })).toBe(false);
    expect(lancamentoValido({ ...LANCAMENTO_OK, valorCentavos: 0 })).toBe(false);
    expect(lancamentoValido({ ...LANCAMENTO_OK, valorCentavos: -100 })).toBe(false);
  });

  it('rejeita tipo/origem fora do enum', () => {
    expect(lancamentoValido({ ...LANCAMENTO_OK, tipo: 'xyz' })).toBe(false);
    expect(lancamentoValido({ ...LANCAMENTO_OK, origem: 'xyz' })).toBe(false);
  });

  it('rejeita data fora do formato AAAA-MM-DD', () => {
    expect(lancamentoValido({ ...LANCAMENTO_OK, data: '15/10/2026' })).toBe(false);
  });

  it('rejeita não-objeto, null, array', () => {
    expect(lancamentoValido(null)).toBe(false);
    expect(lancamentoValido('string')).toBe(false);
    expect(lancamentoValido([1, 2])).toBe(false);
  });
});

describe('categoriaValida', () => {
  it('aceita categoria bem formada', () => {
    expect(categoriaValida({ id: 'vendas', nome: 'Vendas', personalizada: false })).toBe(true);
  });
  it('rejeita id/nome vazios ou personalizada não-booleana', () => {
    expect(categoriaValida({ id: '', nome: 'Vendas', personalizada: false })).toBe(false);
    expect(categoriaValida({ id: 'vendas', nome: '', personalizada: false })).toBe(false);
    expect(categoriaValida({ id: 'vendas', nome: 'Vendas', personalizada: 'nao' })).toBe(false);
  });
});

describe('filtrosValidos', () => {
  it('aceita filtros bem formados', () => {
    expect(filtrosValidos({ periodo: { tipo: 'ultimo-mes' }, categorias: [] })).toBe(true);
    expect(
      filtrosValidos({ periodo: { tipo: 'mes', de: '2026-10' }, categorias: ['vendas'] }),
    ).toBe(true);
  });
  it('rejeita tipo de período desconhecido', () => {
    expect(filtrosValidos({ periodo: { tipo: 'bogus' }, categorias: [] })).toBe(false);
  });
  it('rejeita categorias que não são array de strings', () => {
    expect(filtrosValidos({ periodo: { tipo: 'tudo' }, categorias: [1, 2] })).toBe(false);
    expect(filtrosValidos({ periodo: { tipo: 'tudo' }, categorias: 'vendas' })).toBe(false);
  });
});
