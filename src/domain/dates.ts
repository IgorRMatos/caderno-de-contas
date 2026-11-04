import type { Idioma } from '../config.js';
import { LOCALE_INTL } from '../config.js';

export type OrdemData = 'dmy' | 'mdy';

export interface ParseDataOk {
  ok: true;
  /** AAAA-MM-DD, data local, nunca `Date`. */
  iso: string;
}
export interface ParseDataErro {
  ok: false;
}
export type ResultadoParseData = ParseDataOk | ParseDataErro;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Confere que ano/mês/dia formam uma data real (rejeita 31/02, 30/02 etc.). */
function dataValida(ano: number, mes: number, dia: number): boolean {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

const RE_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const RE_XX_XX_AAAA = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;

/**
 * D4 — infere a ordem dd/mm × mm/dd **da coluna inteira**: se o 1º campo de
 * alguma célula passa de 12, é dmy; senão se o 2º campo passa de 12, é mdy;
 * ambíguo (ambos sempre ≤ 12) → mdy só se o idioma ativo for `en`.
 */
export function inferirOrdemData(valoresBrutos: readonly string[], idiomaAtivo: Idioma): OrdemData {
  const celulas = valoresBrutos
    .map((v) => v.trim().match(RE_XX_XX_AAAA))
    .filter((m): m is RegExpMatchArray => m !== null);

  for (const m of celulas) {
    if (parseInt(m[1]!, 10) > 12) return 'dmy';
  }
  for (const m of celulas) {
    if (parseInt(m[2]!, 10) > 12) return 'mdy';
  }
  return idiomaAtivo === 'en' ? 'mdy' : 'dmy';
}

/** D4 — parse de uma célula de data textual, já sabendo a ordem da coluna. */
export function parseDataPlanilha(bruto: string, ordem: OrdemData): ResultadoParseData {
  const s = bruto.trim();

  const iso = s.match(RE_ISO);
  if (iso) {
    // RE_ISO tem 3 grupos fixos: se `iso` existe, os 3 sempre existem.
    const [, anoStr, mesStr, diaStr] = iso as [string, string, string, string];
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10);
    const dia = parseInt(diaStr, 10);
    if (!dataValida(ano, mes, dia)) return { ok: false };
    return { ok: true, iso: `${anoStr}-${mesStr}-${diaStr}` };
  }

  const m = s.match(RE_XX_XX_AAAA);
  if (!m) return { ok: false };

  // RE_XX_XX_AAAA tem 3 grupos fixos: se `m` existe, os 3 sempre existem.
  const [, campo1Str, campo2Str, anoStr] = m as [string, string, string, string];
  const campo1 = parseInt(campo1Str, 10);
  const campo2 = parseInt(campo2Str, 10);
  const dia = ordem === 'dmy' ? campo1 : campo2;
  const mes = ordem === 'dmy' ? campo2 : campo1;
  let ano = parseInt(anoStr, 10);
  if (anoStr.length === 2) ano += 2000;

  if (!dataValida(ano, mes, dia)) return { ok: false };
  return { ok: true, iso: `${ano}-${pad2(mes)}-${pad2(dia)}` };
}

/**
 * D4 — única exceção de ponto flutuante do domínio para datas: serial do
 * Excel. Época 1899-12-30 em UTC absorve o bug histórico do 29/02/1900 do
 * Excel; lemos os campos de volta em UTC para nunca passar por fuso local.
 */
export function serialExcelParaISO(serial: number): string {
  const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** D4 — `Date` nativo que o SheetJS entrega para célula de data: ler em UTC. */
export function dataNativaParaISO(data: Date): string {
  return `${data.getUTCFullYear()}-${pad2(data.getUTCMonth() + 1)}-${pad2(data.getUTCDate())}`;
}

const formatadoresData = new Map<Idioma, Intl.DateTimeFormat>();

/** Formata `AAAA-MM-DD` para exibição, sem deixar o fuso do navegador mexer no dia. */
export function formatarData(iso: string, idioma: Idioma): string {
  let fmt = formatadoresData.get(idioma);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(LOCALE_INTL[idioma], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
    formatadoresData.set(idioma, fmt);
  }
  return fmt.format(new Date(`${iso}T00:00:00Z`));
}

const formatadoresMes = new Map<Idioma, Intl.DateTimeFormat>();

/** `AAAA-MM` → mês por extenso no idioma ativo (ex.: "outubro de 2026"). */
export function formatarMesPorExtenso(anoMes: string, idioma: Idioma): string {
  let fmt = formatadoresMes.get(idioma);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(LOCALE_INTL[idioma], {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    formatadoresMes.set(idioma, fmt);
  }
  const [ano, mes] = anoMes.split('-').map(Number) as [number, number];
  return fmt.format(new Date(Date.UTC(ano, mes - 1, 1)));
}

export function anoMesDeISO(iso: string): string {
  return iso.slice(0, 7);
}
