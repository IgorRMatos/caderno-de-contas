import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DURACOES, LIMITE_MS, staggerBarras } from '../../../src/motion/duracoes';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../src');

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const p = path.join(dir, nome);
    return statSync(p).isDirectory() ? arquivos(p) : /\.(ts|tsx)$/.test(nome) ? [p] : [];
  });
}

describe('motion — durações (D10, RNF08, UX §7)', () => {
  it.each(Object.entries(DURACOES))('%s (%i ms) ≤ 1,2 s', (_nome, ms) => {
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(LIMITE_MS);
  });

  it('sequências e atrasos também cabem em 1,2 s', () => {
    const d = DURACOES;
    expect(d.virarSaida + d.virarEntrada).toBeLessThanOrEqual(LIMITE_MS);
    expect(d.linhaReal + d.linhaProjecao).toBeLessThanOrEqual(LIMITE_MS);
    expect(d.contador + d.contadorAtrasoSecundario).toBeLessThanOrEqual(LIMITE_MS);
    expect(d.rabiscoAtraso + d.rabisco).toBeLessThanOrEqual(LIMITE_MS);
    expect(d.marcaTextoAtraso + d.marcaTexto).toBeLessThanOrEqual(LIMITE_MS);
    // abertura: folha + cabeçalho começa antes de a folha terminar
    expect(d.abrirCaderno).toBeLessThanOrEqual(LIMITE_MS);
    expect(d.cabecalho + 5 * d.cabecalhoStagger).toBeLessThanOrEqual(d.abrirCaderno + 200);
  });

  it.each([1, 6, 12, 24, 60])('barras com %i meses terminam em ≤ 1,2 s', (n) => {
    expect(DURACOES.barras + staggerBarras(n) * (n - 1)).toBeLessThanOrEqual(LIMITE_MS);
    expect(staggerBarras(n)).toBeLessThanOrEqual(DURACOES.barrasStaggerMax);
  });

  it('nenhum arquivo fora de src/motion/ importa gsap ou animejs (D10)', () => {
    const infratores = arquivos(SRC)
      .filter((p) => !p.includes(`${path.sep}motion${path.sep}`))
      .filter((p) =>
        /from ['"](gsap|animejs)(\/[^'"]*)?['"]|import\(['"](gsap|animejs)/.test(
          readFileSync(p, 'utf8'),
        ),
      );
    expect(infratores).toEqual([]);
  });
});
