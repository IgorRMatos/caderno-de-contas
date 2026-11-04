import { animate } from 'animejs/animation';
import { stagger } from 'animejs/utils';
import { DURACOES, EASE_ANIME, staggerBarras } from './duracoes.js';
import { NADA, type Handle } from './handle.js';
import { semMovimento } from './reduced.js';

/**
 * D10 — microinterações e "escrita" (anime.js). Mesmo contrato do `gsap.ts`:
 * o "from" é aplicado aqui, `kill()` deixa o estado final, reduced-motion
 * mostra tudo pronto (exceto a barra do toast, que é timer e continua).
 *
 * Os desenhos usam `revert()` no fim/no kill: o anime.js tira os estilos
 * inline que pôs e o elemento volta ao que o CSS/JSX diz (completo).
 */

type Animacao = ReturnType<typeof animate>;

function revertendo(a: Animacao): Handle {
  return {
    kill() {
      a.revert();
    },
  };
}

/**
 * CA05.6 — contador de 0 (ou do valor anterior) até o final, em centavos
 * inteiros, formatado por `Intl` a cada quadro (`fmt`). Escreve no MESMO nó
 * de texto que o Preact renderizou (nunca troca o nó, senão o Preact perde a
 * referência). O valor final legível por leitor de tela fica num `.sr-only`
 * irmão; este elemento é `aria-hidden`.
 */
export function contar(
  el: HTMLElement,
  deCentavos: number,
  ateCentavos: number,
  fmt: (centavos: number) => string,
  atrasoMs = 0,
): Handle {
  const no = el.firstChild;
  if (!(no instanceof Text)) return NADA;
  const escrever = (c: number) => {
    no.data = fmt(c);
  };
  if (semMovimento() || deCentavos === ateCentavos) {
    escrever(ateCentavos);
    return NADA;
  }
  const estado = { v: deCentavos };
  escrever(deCentavos);
  const a = animate(estado, {
    v: ateCentavos,
    duration: DURACOES.contador,
    delay: atrasoMs,
    ease: 'outExpo',
    onUpdate: () => escrever(Math.round(estado.v)),
    onComplete: () => escrever(ateCentavos),
  });
  return {
    kill() {
      a.cancel();
      escrever(ateCentavos);
    },
  };
}

function comprimento(path: SVGGeometryElement): number | null {
  try {
    const n = path.getTotalLength();
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null; // jsdom e afins
  }
}

/** CA06.5 — linha "desenhada" com `stroke-dashoffset` (comprimento → 0). */
export function desenharLinha(
  path: SVGGeometryElement | null,
  duracaoMs: number = DURACOES.linhaReal,
  atrasoMs = 0,
): Handle {
  if (!path || semMovimento()) return NADA;
  const n = comprimento(path);
  if (n === null) return NADA;
  path.style.strokeDasharray = `${n}`;
  path.style.strokeDashoffset = `${n}`;
  const a = animate(path, {
    strokeDashoffset: [n, 0],
    duration: duracaoMs,
    delay: atrasoMs,
    ease: 'inOutQuad',
    onComplete: () => limpar(),
  });
  function limpar() {
    a.revert();
    path!.style.strokeDasharray = '';
    path!.style.strokeDashoffset = '';
  }
  return { kill: limpar };
}

/**
 * Projeção "a lápis": a linha é tracejada (o dasharray já é o desenho), então
 * em vez de `stroke-dashoffset` ela é revelada da esquerda para a direita
 * com `clip-path`, logo depois da linha realizada.
 */
export function riscarALapis(el: SVGElement | null, atrasoMs: number = DURACOES.linhaReal): Handle {
  if (!el || semMovimento()) return NADA;
  const a = animate(el, {
    clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
    duration: DURACOES.linhaProjecao,
    delay: atrasoMs,
    ease: EASE_ANIME,
    onComplete: () => a.revert(),
  });
  return revertendo(a);
}

/** UX §7 — barras crescem `scaleY 0 → 1` a partir do eixo, em cascata (total ≤ 1,2 s). */
export function crescerBarras(barras: readonly SVGElement[]): Handle {
  if (barras.length === 0 || semMovimento()) return NADA;
  for (const b of barras) {
    b.style.transformBox = 'fill-box';
    b.style.transformOrigin = '50% 100%';
  }
  const passo = staggerBarras(barras.length);
  const a = animate(barras as SVGElement[], {
    scaleY: [0, 1],
    duration: DURACOES.barras,
    delay: stagger(passo),
    ease: EASE_ANIME,
    onComplete: () => a.revert(),
  });
  return revertendo(a);
}

/** Sublinhado/seta à mão: `stroke-dashoffset`, depois do contador. */
export function rabiscar(paths: readonly SVGGeometryElement[]): Handle {
  const handles = paths.map((p) => desenharLinha(p, DURACOES.rabisco, DURACOES.rabiscoAtraso));
  return {
    kill() {
      for (const h of handles) h.kill();
    },
  };
}

/** CA07.3 — marca-texto se expandindo da esquerda para a direita. */
export function marcaTexto(el: HTMLElement | null): Handle {
  if (!el || semMovimento()) return NADA;
  const a = animate(el, {
    backgroundSize: ['0% 62%', '100% 62%'],
    duration: DURACOES.marcaTexto,
    delay: DURACOES.marcaTextoAtraso,
    ease: EASE_ANIME,
    onComplete: () => a.revert(),
  });
  return revertendo(a);
}

export interface HandleBarra extends Handle {
  pausar(): void;
  retomar(): void;
}

/**
 * D16 — barra reversa do toast: `scaleX 1 → 0` linear. É TIMER (informação
 * de tempo), não enfeite: roda mesmo com reduced-motion e é pausável.
 * O timer que fecha o toast continua no componente; a barra só mostra o tempo.
 */
export function toastBarra(el: HTMLElement, duracaoMs: number): HandleBarra {
  const a = animate(el, { scaleX: [1, 0], duration: duracaoMs, ease: 'linear' });
  return {
    pausar: () => void a.pause(),
    retomar: () => void a.resume(),
    kill: () => void a.cancel(),
  };
}

/** UX §5.2 — sol ↔ lua: gira 0 → 180° e cresce .6 → 1 (easeOutBack); o símbolo troca pelo CSS. */
export function girarTema(el: Element | null): Handle {
  if (!el || semMovimento()) return NADA;
  const a = animate(el as HTMLElement, {
    rotate: [0, 180],
    scale: [0.6, 1],
    duration: DURACOES.solLua,
    ease: 'outBack',
    onComplete: () => a.revert(),
  });
  return revertendo(a);
}

/** Arrastar e soltar — a zona cresce um tico e inclina; o ícone dá um pulinho. */
export function realcarDropzone(zona: HTMLElement | null, icone?: Element | null): Handle {
  if (!zona || semMovimento()) return NADA;
  const a = animate(zona, {
    scale: [1, 1.01],
    rotate: [0, -0.6],
    duration: DURACOES.dropzone,
    ease: 'outBack',
  });
  const b = icone
    ? animate(icone as HTMLElement, {
        translateY: [0, -6, 0],
        duration: DURACOES.dropzone * 2,
        ease: EASE_ANIME,
      })
    : null;
  return {
    kill() {
      a.revert();
      b?.revert();
    },
  };
}

/** Botões — "press" `scale .97 → 1`. Um listener delegado no documento cobre todos os `.btn`. */
export function instalarPressaoBotoes(raiz: Document | HTMLElement = document): Handle {
  const aoPressionar = (ev: Event) => {
    if (semMovimento()) return;
    const alvo = (ev.target as Element | null)?.closest?.('.btn');
    if (!(alvo instanceof HTMLElement) || alvo.matches('[disabled],[aria-disabled="true"]')) return;
    const a = animate(alvo, {
      scale: [0.97, 1],
      duration: DURACOES.botao,
      ease: EASE_ANIME,
      onComplete: () => a.revert(),
    });
  };
  raiz.addEventListener('pointerdown', aoPressionar);
  return { kill: () => raiz.removeEventListener('pointerdown', aoPressionar) };
}
