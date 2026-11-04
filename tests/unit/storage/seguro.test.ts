import { describe, expect, it } from 'vitest';
import { criarStorageSeguro } from '../../../src/storage/seguro';

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

function fakeStorageQueLanca(): Storage {
  return {
    getItem: () => {
      throw new Error('bloqueado');
    },
    setItem: () => {
      throw new Error('bloqueado');
    },
    removeItem: () => {
      throw new Error('bloqueado');
    },
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

describe('criarStorageSeguro — D8/D10', () => {
  it('disponivel=true quando setItem/removeItem funcionam', () => {
    const s = criarStorageSeguro(fakeStorageOk());
    expect(s.disponivel).toBe(true);
  });

  it('impl null (ex.: window.localStorage lançou no getter) → disponivel=false, sem exceção', () => {
    const s = criarStorageSeguro(null);
    expect(s.disponivel).toBe(false);
    expect(s.lerBruto('x')).toBeNull();
    expect(s.gravarBruto('x', '1')).toBe(false);
  });

  it('setItem lançando na checagem inicial → disponivel=false, sem exceção', () => {
    const s = criarStorageSeguro(fakeStorageQueLanca());
    expect(s.disponivel).toBe(false);
    expect(s.lerBruto('x')).toBeNull();
    expect(s.gravarBruto('x', '1')).toBe(false);
  });

  it('gravarBruto que lança em runtime (ex.: QuotaExceeded) vira disponivel=false dali pra frente', () => {
    const impl = fakeStorageOk();
    let falhaAgora = false;
    const original = impl.setItem.bind(impl);
    impl.setItem = (k, v) => {
      if (falhaAgora) throw new Error('QuotaExceededError');
      original(k, v);
    };
    const s = criarStorageSeguro(impl);
    expect(s.disponivel).toBe(true);

    falhaAgora = true;
    expect(s.gravarBruto('chave', 'valor')).toBe(false);
    expect(s.disponivel).toBe(false);
  });

  it('getItem lançando em runtime (não na checagem inicial) → lerBruto retorna null', () => {
    const impl = fakeStorageOk({ chave: 'valor' });
    impl.getItem = () => {
      throw new Error('falhou');
    };
    const s = criarStorageSeguro(impl);
    expect(s.lerBruto('chave')).toBeNull();
  });
});
