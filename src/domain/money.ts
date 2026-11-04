import type { Idioma } from '../config.js';
import { LOCALE_INTL, moedaAtiva } from '../config.js';

export type SeparadorDecimal = ',' | '.';

export interface ParseValorOk {
  ok: true;
  centavos: number;
}
export interface ParseValorErro {
  ok: false;
}
export type ResultadoParseValor = ParseValorOk | ParseValorErro;

/**
 * D3 — remove símbolo de moeda, espaços/NBSP e identifica o sinal (`-`, `−`
 * U+2212, ou parênteses). Devolve só dígitos + separadores, e se é negativo.
 */
function limparValorBruto(bruto: string): { textoLimpo: string; negativo: boolean } {
  let s = bruto.trim();
  let negativo = false;

  if (s.startsWith('(') && s.endsWith(')')) {
    negativo = true;
    s = s.slice(1, -1).trim();
  }
  if (s.includes('-') || s.includes('−')) {
    negativo = true;
  }

  const textoLimpo = s.replace(/[^0-9.,]/g, '');
  return { textoLimpo, negativo };
}

/**
 * D3 — infere o separador decimal **da coluna inteira**, não célula a célula:
 * 1) se alguma célula tem `.` e `,`, o último dos dois (mais à direita) é o decimal;
 * 2) senão, se o último separador de alguma célula é seguido só de 1–2 dígitos, ele é o decimal;
 * 3) senão (só grupos de 3, ambíguo), usa o idioma ativo: pt/es → `,`; en → `.`.
 */
export function inferirSeparadorDecimal(
  valoresBrutos: readonly string[],
  idiomaAtivo: Idioma,
): SeparadorDecimal {
  const limpos = valoresBrutos.map((v) => limparValorBruto(v).textoLimpo).filter((v) => v !== '');

  for (const v of limpos) {
    if (v.includes('.') && v.includes(',')) {
      return v.lastIndexOf(',') > v.lastIndexOf('.') ? ',' : '.';
    }
  }

  for (const v of limpos) {
    const lastDot = v.lastIndexOf('.');
    const lastComma = v.lastIndexOf(',');
    const lastSep = Math.max(lastDot, lastComma);
    if (lastSep === -1) continue;
    const tail = v.slice(lastSep + 1);
    if (tail.length >= 1 && tail.length <= 2 && /^\d+$/.test(tail)) {
      return v[lastSep] as SeparadorDecimal;
    }
  }

  return idiomaAtivo === 'en' ? '.' : ',';
}

/**
 * D3 — parse de uma célula já conhecendo o separador decimal da coluna
 * (achado por `inferirSeparadorDecimal`). Qualquer outro separador presente
 * é tratado como agrupador de milhar e descartado.
 */
export function parseValorPlanilha(
  bruto: string,
  decimalChar: SeparadorDecimal,
): ResultadoParseValor {
  const { textoLimpo, negativo } = limparValorBruto(bruto);
  if (textoLimpo === '') return { ok: false };

  const idx = textoLimpo.lastIndexOf(decimalChar);
  const parteInteira =
    idx === -1 ? textoLimpo.replace(/[^\d]/g, '') : textoLimpo.slice(0, idx).replace(/[^\d]/g, '');
  const parteDecimal = idx === -1 ? '' : textoLimpo.slice(idx + 1).replace(/[^\d]/g, '');

  if (parteInteira === '' && parteDecimal === '') return { ok: false };

  const inteiro = parteInteira === '' ? 0 : parseInt(parteInteira, 10);
  const centavosDecimais = parteDecimal === '' ? 0 : Math.round(Number(`0.${parteDecimal}`) * 100);

  let centavos = inteiro * 100 + centavosDecimais;
  if (negativo) centavos = -centavos;

  if (!Number.isSafeInteger(centavos)) return { ok: false };
  return { ok: true, centavos };
}

/**
 * D3 — única exceção de ponto flutuante do domínio: célula numérica nativa do
 * XLSX (SheetJS já entrega um `number`, não precisa inferir separador).
 */
export function centavosDeNumero(n: number): number {
  return Math.round(n * 100);
}

export function totalCentavos(valores: readonly number[]): number {
  let total = 0;
  for (const v of valores) total += v;
  return total;
}

const formatadoresMoeda = new Map<string, Intl.NumberFormat>();

/** D1 — formata em centavos → string de moeda, lendo a moeda só de `config.ts`. */
export function formatarMoeda(centavos: number, idioma: Idioma): string {
  const moeda = moedaAtiva(idioma);
  const chave = `${idioma}:${moeda}`;
  let fmt = formatadoresMoeda.get(chave);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE_INTL[idioma], { style: 'currency', currency: moeda });
    formatadoresMoeda.set(chave, fmt);
  }
  return fmt.format(centavos / 100);
}
