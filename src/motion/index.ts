/**
 * D10 — porta de entrada da camada de movimento. Só `src/motion/` importa
 * gsap/animejs (regra de lint `no-restricted-imports`); o resto do app usa
 * estas funções, que checam reduced-motion e devolvem um `Handle` com `kill()`.
 */
export * from './anime.js';
export * from './duracoes.js';
export * from './gsap.js';
export * from './handle.js';
export { semMovimento } from './reduced.js';
