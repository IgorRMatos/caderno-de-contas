/**
 * RNF08/UX §7 — consultado na hora de CADA animação (não em cache), então
 * trocar a preferência no sistema vale para a próxima animação sem recarregar.
 * Sem `matchMedia` (ex.: jsdom), assume "sem movimento": é o lado seguro,
 * o conteúdo aparece pronto.
 */
export function semMovimento(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}
