/**
 * D10/UX §7 — ÚNICA fonte das durações de movimento (ms). Regra (BRIEF/RNF08):
 * nenhuma animação passa de 1,2 s; a única exceção é a barra reversa do toast,
 * que é timer funcional e mora em `state/toasts.ts` (4 s / 6 s).
 * `tests/unit/motion/duracoes.test.ts` garante o teto, inclusive nas somas
 * (atraso + duração, coreografias em sequência).
 */
export const LIMITE_MS = 1200;

export const DURACOES = {
  /** Folha "abre como caderno": rotateY −14° → 0, só transform (LCP). */
  abrirCaderno: 700,
  /** Cabeçalho entra logo depois, em cascata. */
  cabecalho: 300,
  cabecalhoStagger: 60,
  /** Virar a página Início → dashboard: saída (power2.in) + entrada (power2.out). */
  virarSaida: 400,
  virarEntrada: 450,
  /** Seção surgindo no scroll (ScrollTrigger once). */
  revelarSecao: 500,
  revelarStagger: 60,
  toastEntrada: 320,
  toastSaida: 220,
  painel: 350,
  dialogo: 250,
  filtroCrossfade: 300,
  /** Contadores: manchete primeiro, secundários com atraso. */
  contador: 900,
  contadorAtrasoSecundario: 100,
  /** Gráficos: linha realizada e depois a projeção "a lápis". */
  linhaReal: 800,
  linhaProjecao: 400,
  barras: 500,
  barrasStaggerMax: 40,
  /** Sublinhado/seta à mão, depois do contador. */
  rabisco: 500,
  rabiscoAtraso: 500,
  marcaTexto: 700,
  marcaTextoAtraso: 300,
  dropzone: 180,
  botao: 120,
  solLua: 450,
  /** Versão reduced-motion das entradas que ainda fazem fade (toasts). */
  reduzidoFade: 150,
} as const;

export type ChaveDuracao = keyof typeof DURACOES;

/** UX §7 — `cubic-bezier(.2,.7,.2,1)` ≈ power2.out (GSAP) / outQuad (anime.js). */
export const EASE_GSAP = 'power2.out';
export const EASE_ANIME = 'outQuad';

/** ms → s (GSAP trabalha em segundos). */
export function seg(ms: number): number {
  return ms / 1000;
}

/**
 * Stagger das barras: no máximo 40 ms, mas encolhe quando há muitas barras
 * ("Tudo" com vários anos) para o total nunca passar de 1,2 s.
 */
export function staggerBarras(quantidade: number): number {
  if (quantidade <= 1) return 0;
  const folga = LIMITE_MS - DURACOES.barras;
  return Math.min(DURACOES.barrasStaggerMax, Math.floor(folga / (quantidade - 1)));
}
