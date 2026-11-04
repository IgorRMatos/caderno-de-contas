/** T10 — escala linear reutilizável pelos gráficos SVG (FluxoCaixa, Projecao). */

/** Arredonda para cima num "número bonito" (1/2/2,5/5/10 × potência de 10). 0 → 0. */
export function arredondarParaCima(valor: number): number {
  if (valor <= 0) return 0;
  const grandeza = 10 ** Math.floor(Math.log10(valor));
  const passos = [1, 2, 2.5, 5, 10];
  for (const p of passos) {
    const candidato = p * grandeza;
    if (candidato >= valor - 1e-9) return candidato;
  }
  return 10 * grandeza;
}

export interface EscalaLinear {
  min: number;
  max: number;
  /** Converte um valor do domínio em y (px), com y crescendo para baixo (convenção SVG). */
  paraY(valor: number): number;
}

/**
 * Escala linear dos `valores` (podem ser negativos) para a faixa vertical
 * `[areaPx.topo, areaPx.base]`. `min`/`max` são arredondados para "números
 * bonitos" (0 fica em 0 quando não há negativos, para o eixo bater com a
 * grade do FluxoCaixa).
 */
export function criarEscalaLinear(
  valores: readonly number[],
  areaPx: { topo: number; base: number },
): EscalaLinear {
  const maximoBruto = Math.max(0, ...valores);
  const minimoBruto = Math.min(0, ...valores);
  const max = arredondarParaCima(maximoBruto) || 1;
  const min = minimoBruto === 0 ? 0 : -arredondarParaCima(-minimoBruto);
  const alcance = max - min || 1;
  return {
    min,
    max,
    paraY: (valor) => areaPx.base - ((valor - min) / alcance) * (areaPx.base - areaPx.topo),
  };
}

/** `quantidade` marcas igualmente espaçadas entre `min` e `max`, da maior para a menor. */
export function gerarTicks(min: number, max: number, quantidade: number): number[] {
  if (quantidade < 2) return [max];
  // Exclui `min` de propósito: no FluxoCaixa o 0 já está marcado pela linha
  // do eixo; na Projecao, pela linha "zero" (quando há valor negativo).
  const passo = (max - min) / quantidade;
  return Array.from({ length: quantidade }, (_, i) => Math.round(max - i * passo));
}
