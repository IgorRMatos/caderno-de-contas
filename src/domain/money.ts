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
 * D3 (revisado pelo Tech Lead em 2026-11-04) — infere o separador decimal
 * **da coluna inteira**, não célula a célula, e o idioma ativo não decide
 * mais nada aqui:
 * 1) se alguma célula tem `.` e `,`, o último dos dois (mais à direita) é o decimal;
 * 2) senão, se o último separador de alguma célula é seguido só de 1–2 dígitos, ele é o decimal;
 * 3) senão (só grupos de 3, ou nenhum separador) → `null`: **sem decimal**,
 *    qualquer separador presente é agrupador de milhar, em qualquer idioma.
 *    Motivo: dinheiro não tem 3 casas decimais; decidir por idioma fazia uma
 *    planilha americana ('1,234') virar 1,234 com o app em pt-BR, e uma
 *    planilha brasileira ('1.234') virar 1,234 com o app em en.
 */
export function inferirSeparadorDecimal(valoresBrutos: readonly string[]): SeparadorDecimal | null {
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

  return null;
}

/**
 * D3 — parse de uma célula já sabendo o separador decimal da coluna (achado
 * por `inferirSeparadorDecimal`). `decimalChar === null` → não há decimal:
 * todo separador presente é agrupador de milhar e é descartado.
 */
export function parseValorPlanilha(
  bruto: string,
  decimalChar: SeparadorDecimal | null,
): ResultadoParseValor {
  const { textoLimpo, negativo } = limparValorBruto(bruto);
  if (textoLimpo === '') return { ok: false };

  const idx = decimalChar === null ? -1 : textoLimpo.lastIndexOf(decimalChar);
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

const formatadoresCompactos = new Map<Idioma, Intl.NumberFormat>();

/** T10 — rótulo curto de eixo de gráfico ("18 mil" / "18K"), sem símbolo de moeda. */
export function formatarCompacto(centavos: number, idioma: Idioma): string {
  let fmt = formatadoresCompactos.get(idioma);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE_INTL[idioma], { notation: 'compact', maximumFractionDigits: 1 });
    formatadoresCompactos.set(idioma, fmt);
  }
  return fmt.format(centavos / 100);
}
