import type { Inputs } from 'preact/hooks';
import { useLayoutEffect } from 'preact/hooks';
import type { Handle } from '../motion/index.js';

/**
 * D10 — liga uma animação ao ciclo do componente: roda depois do render e
 * ANTES da pintura (layout effect, para o "from" do JS não piscar o estado
 * final), e chama `kill()` antes de re-animar (deps mudaram) ou ao desmontar.
 */
export function useMovimento(criar: () => Handle | void, deps: Inputs): void {
  useLayoutEffect(() => {
    const h = criar();
    return () => h?.kill();
  }, deps);
}
