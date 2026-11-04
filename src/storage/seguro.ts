/**
 * D8 — acesso a `localStorage` sempre dentro de try/catch. O chamador (T4
 * `state/persistencia.ts`) também envolve a LEITURA da propriedade
 * `window.localStorage` em try/catch antes de chegar aqui: no Firefox/Safari
 * com storage bloqueado, só ler a propriedade já lança (bug do projeto
 * anterior) — por isso `impl` chega aqui já podendo ser `null`.
 */
export interface StorageSeguro {
  disponivel: boolean;
  lerBruto(chave: string): string | null;
  /** `true` se gravou; `false` em qualquer falha (indisponível/QuotaExceeded). */
  gravarBruto(chave: string, valor: string): boolean;
}

const CHAVE_TESTE = 'caderno:v1:teste';

export function criarStorageSeguro(impl: Storage | null): StorageSeguro {
  let disponivel = false;
  if (impl) {
    try {
      impl.setItem(CHAVE_TESTE, '1');
      impl.removeItem(CHAVE_TESTE);
      disponivel = true;
    } catch {
      disponivel = false;
    }
  }

  function lerBruto(chave: string): string | null {
    if (!disponivel || !impl) return null;
    try {
      return impl.getItem(chave);
    } catch {
      return null;
    }
  }

  function gravarBruto(chave: string, valor: string): boolean {
    if (!disponivel || !impl) return false;
    try {
      impl.setItem(chave, valor);
      return true;
    } catch {
      disponivel = false;
      return false;
    }
  }

  return {
    get disponivel() {
      return disponivel;
    },
    lerBruto,
    gravarBruto,
  };
}
