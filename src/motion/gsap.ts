import { gsap } from 'gsap';
import { DURACOES, EASE_GSAP, seg } from './duracoes.js';
import { NADA, type Handle } from './handle.js';
import { semMovimento } from './reduced.js';

/**
 * D10 — estrutura e páginas (GSAP). Regras:
 * - o estado "from" é aplicado pelo JS no início da animação; o CSS nunca
 *   esconde conteúdo esperando o JS;
 * - `kill()` leva ao estado final (`progress(1)`) antes de matar, e os
 *   `clearProps` devolvem o elemento ao CSS;
 * - com reduced-motion: sem rotação, deslocamento nem virada de página.
 */

type Animacao = gsap.core.Animation;

function handleDe(...animacoes: Animacao[]): Handle {
  return {
    kill() {
      for (const a of animacoes) {
        a.scrollTrigger?.kill();
        a.progress(1);
        a.kill();
      }
    },
  };
}

const PERSPECTIVA = 1200;

/** CA14.2 — a folha "abre como caderno" (lombada à esquerda) e o cabeçalho entra em cascata. */
export function abrirCaderno(folha: HTMLElement, cabecalho?: HTMLElement | null): Handle {
  if (semMovimento()) return NADA;
  const tl = gsap.timeline();
  tl.from(folha, {
    rotationY: -14,
    transformOrigin: 'left center',
    transformPerspective: PERSPECTIVA,
    duration: seg(DURACOES.abrirCaderno),
    ease: EASE_GSAP,
    clearProps: 'transform',
  });
  if (cabecalho && cabecalho.children.length > 0) {
    tl.from(
      cabecalho.children,
      {
        y: -8,
        duration: seg(DURACOES.cabecalho),
        stagger: seg(DURACOES.cabecalhoStagger),
        ease: EASE_GSAP,
        clearProps: 'transform',
      },
      seg(DURACOES.abrirCaderno) - seg(DURACOES.cabecalho),
    );
  }
  return handleDe(tl);
}

/**
 * CA14.2 — virar a página (Início → dashboard): a folha atual gira até −90°,
 * `aoMeio` troca o conteúdo, a nova folha volta de 90° a 0. Com reduced-motion
 * (ou no `kill()`), os dois callbacks rodam na hora: a troca nunca se perde.
 */
export function virarPagina(folha: HTMLElement, aoMeio: () => void, aoFim: () => void): Handle {
  if (semMovimento()) {
    aoMeio();
    aoFim();
    return NADA;
  }
  void precarregarScrollTrigger();
  const tl = gsap.timeline({ onComplete: aoFim });
  tl.to(folha, {
    rotationY: -90,
    transformOrigin: 'left center',
    transformPerspective: PERSPECTIVA,
    duration: seg(DURACOES.virarSaida),
    ease: 'power2.in',
  })
    .add(aoMeio)
    .fromTo(
      folha,
      { rotationY: 90 },
      {
        rotationY: 0,
        duration: seg(DURACOES.virarEntrada),
        ease: EASE_GSAP,
        clearProps: 'transform',
      },
    );
  return handleDe(tl);
}

type ModuloScrollTrigger = typeof import('gsap/ScrollTrigger');
let scrollTriggerPromise: Promise<ModuloScrollTrigger['ScrollTrigger']> | null = null;

/** D14 — ScrollTrigger é lazy: só baixa na transição para o dashboard. */
export function precarregarScrollTrigger(): Promise<ModuloScrollTrigger['ScrollTrigger']> {
  scrollTriggerPromise ??= import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
    gsap.registerPlugin(ScrollTrigger);
    return ScrollTrigger;
  });
  return scrollTriggerPromise;
}

/**
 * CA14.2 — seções surgem no scroll (`top 85%`, once): filhos `y 24 → 0` +
 * fade, em cascata. `aoEntrar` dispara os desenhos do anime.js (gráficos)
 * quando a seção entra. Quem chama NÃO passa a manchete nem os indicadores
 * (LCP: pintados de imediato). Reduced-motion: nada é registrado, o
 * conteúdo já está pronto, e `aoEntrar` não é chamado (os gráficos já estão completos).
 */
export function revelarSecoes(
  secoes: readonly HTMLElement[],
  aoEntrar?: (secao: HTMLElement) => void,
): Handle {
  if (semMovimento() || secoes.length === 0) return NADA;
  let cancelado = false;
  const tweens: Animacao[] = [];
  void precarregarScrollTrigger().then(() => {
    if (cancelado) return;
    for (const secao of secoes) {
      tweens.push(
        gsap.from(secao.children, {
          y: 24,
          opacity: 0,
          duration: seg(DURACOES.revelarSecao),
          stagger: seg(DURACOES.revelarStagger),
          ease: EASE_GSAP,
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: secao, start: 'top 85%', once: true },
          onStart: () => aoEntrar?.(secao),
        }),
      );
    }
  });
  return {
    kill() {
      cancelado = true;
      handleDe(...tweens).kill();
    },
  };
}

/** UX §7 "Filtro aplicado" — crossfade dos blocos que mudaram (opacity .4 → 1). */
export function crossfade(elementos: readonly Element[]): Handle {
  if (semMovimento() || elementos.length === 0) return NADA;
  return handleDe(
    gsap.fromTo(
      elementos,
      { opacity: 0.4 },
      {
        opacity: 1,
        duration: seg(DURACOES.filtroCrossfade),
        ease: EASE_GSAP,
        clearProps: 'opacity',
      },
    ),
  );
}

/** D16 — toast entra deslizando da direita até a inclinação do post-it (que vem do CSS). */
export function entrarToast(el: HTMLElement): Handle {
  if (semMovimento()) {
    return handleDe(
      gsap.from(el, { opacity: 0, duration: seg(DURACOES.reduzidoFade), clearProps: 'opacity' }),
    );
  }
  return handleDe(
    gsap.from(el, {
      x: 40,
      rotation: 0,
      duration: seg(DURACOES.toastEntrada),
      ease: EASE_GSAP,
      clearProps: 'transform',
    }),
  );
}

/** D16 — saída suave; `aoFim` remove o toast (também no `kill()`, nunca fica órfão). */
export function sairToast(el: HTMLElement, aoFim: () => void): Handle {
  const reduzido = semMovimento();
  return handleDe(
    gsap.to(el, {
      opacity: 0,
      x: reduzido ? 0 : 24,
      duration: seg(reduzido ? DURACOES.reduzidoFade : DURACOES.toastSaida),
      ease: 'power2.in',
      onComplete: aoFim,
    }),
  );
}

/** UX §7 "Painel e diálogos" — painel `x 100% → 0`; diálogo `scale .96 → 1` + fade. */
export function abrirDialogo(el: HTMLElement, variante: 'dialog' | 'drawer'): Handle {
  if (semMovimento()) return NADA;
  const props: gsap.TweenVars =
    variante === 'drawer'
      ? { xPercent: 100, duration: seg(DURACOES.painel) }
      : { scale: 0.96, opacity: 0, duration: seg(DURACOES.dialogo) };
  return handleDe(gsap.from(el, { ...props, ease: EASE_GSAP, clearProps: 'transform,opacity' }));
}
