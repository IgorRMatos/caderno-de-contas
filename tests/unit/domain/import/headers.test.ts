import { describe, expect, it } from 'vitest';
import {
  inferirMapeamentoColunas,
  inferirTipoPorTexto,
  normalizarTexto,
} from '../../../../src/domain/import/headers';

describe('normalizarTexto', () => {
  it('remove acentos e normaliza caixa', () => {
    expect(normalizarTexto('Descrição')).toBe('descricao');
    expect(normalizarTexto('CATEGORÍA')).toBe('categoria');
  });
});

describe('inferirMapeamentoColunas (CA02.1 — sinônimos PT/ES/EN)', () => {
  it('reconhece cabeçalhos em português', () => {
    const m = inferirMapeamentoColunas(['data', 'descricao', 'valor', 'tipo', 'categoria']);
    expect(m).toEqual({ data: 0, descricao: 1, valor: 2, tipo: 3, categoria: 4 });
  });

  it('reconhece cabeçalhos em espanhol', () => {
    const m = inferirMapeamentoColunas(['Fecha', 'Descripcion', 'Monto', 'Tipo', 'Categoria']);
    expect(m).toEqual({ data: 0, descricao: 1, valor: 2, tipo: 3, categoria: 4 });
  });

  it('reconhece cabeçalhos em inglês, em outra ordem', () => {
    const m = inferirMapeamentoColunas(['Amount', 'Date', 'Category', 'Description']);
    expect(m).toEqual({ valor: 0, data: 1, categoria: 2, descricao: 3 });
  });

  it('cabeçalhos não reconhecidos não aparecem no mapeamento', () => {
    const m = inferirMapeamentoColunas(['Quando', 'O que', 'Quanto']);
    expect(m).toEqual({});
  });
});

describe('inferirTipoPorTexto (CA01.6a)', () => {
  it('reconhece entrada por vários sinônimos', () => {
    for (const s of ['entrada', 'Receita', 'CREDITO', 'in', 'ingreso']) {
      expect(inferirTipoPorTexto(s)).toBe('entrada');
    }
  });
  it('reconhece saída por vários sinônimos', () => {
    for (const s of ['saida', 'saída', 'Despesa', 'DEBITO', 'out', 'gasto']) {
      expect(inferirTipoPorTexto(s)).toBe('saida');
    }
  });
  it('texto não reconhecido retorna null', () => {
    expect(inferirTipoPorTexto('xyz')).toBeNull();
  });
});
