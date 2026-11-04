/**
 * D10 — toda função de movimento devolve um handle. `kill()` para a animação
 * E deixa o elemento no estado FINAL (nunca meio escondido): é o que um
 * re-render chama antes de animar de novo, e o que garante que interromper
 * uma animação nunca some com conteúdo.
 */
export interface Handle {
  kill(): void;
}

export const NADA: Handle = { kill() {} };

export function juntar(handles: readonly Handle[]): Handle {
  return {
    kill() {
      for (const h of handles) h.kill();
    },
  };
}
