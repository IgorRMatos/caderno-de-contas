import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  abrirCaderno,
  contar,
  crossfade,
  marcaTexto,
  NADA,
  revelarSecoes,
  sairToast,
  semMovimento,
  virarPagina,
} from '../../../src/motion/index';

// jsdom não tem matchMedia, e o ticker do GSAP o consulta de forma assíncrona:
// um padrão permanente (que `unstubAllGlobals` não remove) evita erro fora do teste.
window.matchMedia ??= ((q: string) =>
  ({
    matches: true,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }) as unknown as MediaQueryList) as typeof window.matchMedia;

function preferencia(reduzir: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({
      matches: q.includes('reduce') ? reduzir : false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })),
  );
}

function elComTexto(texto: string): HTMLElement {
  const el = document.createElement('span');
  el.appendChild(document.createTextNode(texto));
  document.body.appendChild(el);
  return el;
}

const fmt = (c: number) => `R$ ${(c / 100).toFixed(2)}`;

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('semMovimento (RNF08)', () => {
  it('respeita prefers-reduced-motion e, se matchMedia falhar, assume o lado seguro', () => {
    preferencia(true);
    expect(semMovimento()).toBe(true);
    preferencia(false);
    expect(semMovimento()).toBe(false);
    vi.stubGlobal('matchMedia', () => {
      throw new Error('bloqueado');
    });
    expect(semMovimento()).toBe(true);
  });
});

describe('contar (CA05.6)', () => {
  it('reduced-motion: valor final na hora, no MESMO nó de texto', () => {
    preferencia(true);
    const el = elComTexto(fmt(324000));
    const no = el.firstChild;
    const h = contar(el, 0, 324000, fmt);
    expect(h).toBe(NADA);
    expect(el.textContent).toBe('R$ 3240.00');
    expect(el.firstChild).toBe(no);
  });

  it('com movimento: o "from" é aplicado pelo JS e kill() deixa o valor final', () => {
    preferencia(false);
    const el = elComTexto(fmt(324000));
    const h = contar(el, 0, 324000, fmt);
    expect(el.textContent).toBe('R$ 0.00');
    h.kill();
    expect(el.textContent).toBe('R$ 3240.00');
  });

  it('valor igual ao anterior não anima', () => {
    preferencia(false);
    const el = elComTexto('x');
    expect(contar(el, 500, 500, fmt)).toBe(NADA);
    expect(el.textContent).toBe('R$ 5.00');
  });
});

describe('virarPagina (CA14.2)', () => {
  it('reduced-motion: troca e termina na hora, sem girar', () => {
    preferencia(true);
    const folha = document.createElement('main');
    const ordem: string[] = [];
    virarPagina(
      folha,
      () => ordem.push('meio'),
      () => ordem.push('fim'),
    );
    expect(ordem).toEqual(['meio', 'fim']);
    expect(folha.style.transform).toBe('');
  });

  it('com movimento: kill() no meio da virada ainda troca o conteúdo e limpa o transform', () => {
    preferencia(false);
    const folha = document.createElement('main');
    document.body.appendChild(folha);
    const ordem: string[] = [];
    const h = virarPagina(
      folha,
      () => ordem.push('meio'),
      () => ordem.push('fim'),
    );
    expect(ordem).toEqual([]);
    h.kill();
    expect(ordem).toEqual(['meio', 'fim']);
    expect(folha.style.transform).toBe('');
  });
});

describe('kill() sempre deixa o estado final (nada fica escondido)', () => {
  it('abrirCaderno, crossfade e sairToast', () => {
    preferencia(false);
    const folha = document.createElement('main');
    const bloco = document.createElement('section');
    const toast = document.createElement('div');
    document.body.append(folha, bloco, toast);

    abrirCaderno(folha).kill();
    expect(folha.style.transform).toBe('');

    crossfade([bloco]).kill();
    expect(bloco.style.opacity).toBe('');

    const fim = vi.fn();
    sairToast(toast, fim).kill();
    expect(fim).toHaveBeenCalledOnce();
  });

  it('reduced-motion: revelarSecoes e marcaTexto não tocam no DOM', () => {
    preferencia(true);
    const secao = document.createElement('section');
    secao.appendChild(document.createElement('p'));
    const hl = document.createElement('span');
    expect(revelarSecoes([secao])).toBe(NADA);
    expect(marcaTexto(hl)).toBe(NADA);
    expect((secao.firstChild as HTMLElement).style.opacity).toBe('');
    expect(hl.style.backgroundSize).toBe('');
  });
});
