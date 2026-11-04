import { describe, expect, it } from 'vitest';
import { arredondarParaCima, criarEscalaLinear, gerarTicks } from '../../../src/ui/charts/escala';

describe('arredondarParaCima', () => {
  it('0 e negativos viram 0', () => {
    expect(arredondarParaCima(0)).toBe(0);
    expect(arredondarParaCima(-50)).toBe(0);
  });

  it('arredonda para 1/2/2,5/5/10 × potência de 10', () => {
    expect(arredondarParaCima(18000)).toBe(20000);
    expect(arredondarParaCima(750)).toBe(1000);
    expect(arredondarParaCima(2200)).toBe(2500);
    expect(arredondarParaCima(1)).toBe(1);
  });

  it('um valor já "bonito" não sobe para o próximo passo', () => {
    expect(arredondarParaCima(5000)).toBe(5000);
  });
});

describe('gerarTicks', () => {
  it('4 marcas de 20000 a 0, da maior para a menor', () => {
    expect(gerarTicks(0, 20000, 4)).toEqual([20000, 15000, 10000, 5000]);
  });

  it('quantidade < 2 devolve só o máximo', () => {
    expect(gerarTicks(0, 20000, 1)).toEqual([20000]);
  });
});

describe('criarEscalaLinear', () => {
  it('só valores positivos: min fica em 0 (não vira negativo à toa)', () => {
    const e = criarEscalaLinear([18000, 14760, 3240], { topo: 20, base: 200 });
    expect(e.min).toBe(0);
    expect(e.max).toBe(20000);
    expect(e.paraY(0)).toBe(200);
    expect(e.paraY(20000)).toBe(20);
  });

  it('com valor negativo, min vira um número bonito negativo', () => {
    const e = criarEscalaLinear([2100, 2600, -750, 1900, 2800, 3240], { topo: 20, base: 200 });
    expect(e.min).toBe(-1000);
    expect(e.max).toBe(5000);
    // y(0) fica estritamente entre topo e base quando há negativos
    expect(e.paraY(0)).toBeGreaterThan(20);
    expect(e.paraY(0)).toBeLessThan(200);
  });

  it('todos os valores iguais (ou só um) não quebra a escala (alcance 0)', () => {
    const e = criarEscalaLinear([0], { topo: 20, base: 200 });
    expect(e.paraY(0)).toBe(200);
  });
});
