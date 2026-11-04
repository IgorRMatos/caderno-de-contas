import { signal } from '@preact/signals';
import { IDIOMA_PADRAO, LOCALE_INTL, type Idioma } from '../config.js';
import { idioma as idiomaSignal } from '../state/signals.js';
import ptBR from './pt-BR.json';

type Dicionario = typeof ptBR;
type ArvoreDeChaves = Record<string, unknown>;

/** pt-BR vai no bundle principal (D9); es/en só por `import()` dinâmico. */
const dicionarios: Partial<Record<Idioma, Dicionario>> = { 'pt-BR': ptBR };

/**
 * Sobe a cada dicionário novo carregado — `t()` assina isto (além do signal
 * `idioma`) para re-renderizar quando o `import()` dinâmico de es/en termina,
 * mesmo que algo tenha mudado `idioma.value` sem passar por `carregarIdioma`.
 */
const versaoDicionarios = signal(0);

export function idiomaAtivo(): Idioma {
  return idiomaSignal.value;
}

/** CA10.4 — navegador decide o idioma inicial; sem match, cai para pt-BR. */
export function detectarIdiomaInicial(idiomasNavegador: readonly string[]): Idioma {
  for (const lang of idiomasNavegador) {
    const base = lang.toLowerCase();
    if (base.startsWith('pt')) return 'pt-BR';
    if (base.startsWith('es')) return 'es';
    if (base.startsWith('en')) return 'en';
  }
  return IDIOMA_PADRAO;
}

/** Carrega es/en sob demanda (D9/D14) e torna `idioma` (signal) o idioma ativo. */
export async function carregarIdioma(idioma: Idioma): Promise<void> {
  if (!dicionarios[idioma]) {
    const modulo = idioma === 'es' ? await import('./es.json') : await import('./en.json');
    dicionarios[idioma] = modulo.default as Dicionario;
    versaoDicionarios.value++;
  }
  idiomaSignal.value = idioma;
}

function buscarTemplate(chave: string, idioma: Idioma): string | undefined {
  const dicionario = dicionarios[idioma] ?? dicionarios[IDIOMA_PADRAO];
  let atual: unknown = dicionario;
  for (const parte of chave.split('.')) {
    if (typeof atual !== 'object' || atual === null) return undefined;
    atual = (atual as ArvoreDeChaves)[parte];
  }
  return typeof atual === 'string' ? atual : undefined;
}

const regrasPlural = new Map<Idioma, Intl.PluralRules>();
function categoriaPlural(idioma: Idioma, n: number): Intl.LDMLPluralRule {
  let regra = regrasPlural.get(idioma);
  if (!regra) {
    regra = new Intl.PluralRules(LOCALE_INTL[idioma]);
    regrasPlural.set(idioma, regra);
  }
  return regra.select(n);
}

/**
 * D9 — `t(chave, params)` com `{nome}` e plurais via `Intl.PluralRules`
 * (`chave_one`/`chave_other`, escolhido quando `params.n` é um número).
 * Lê `idioma.value` (signal) + `versaoDicionarios.value`, então componentes
 * que chamam `t()` re-renderizam sozinhos quando o idioma muda.
 */
export function t(chave: string, params?: Record<string, string | number>): string {
  const idioma = idiomaSignal.value;
  void versaoDicionarios.value;

  let chaveFinal = chave;
  if (params && typeof params.n === 'number') {
    const sufixo = categoriaPlural(idioma, params.n);
    if (buscarTemplate(`${chave}_${sufixo}`, idioma) !== undefined) {
      chaveFinal = `${chave}_${sufixo}`;
    } else if (buscarTemplate(`${chave}_other`, idioma) !== undefined) {
      chaveFinal = `${chave}_other`;
    }
  }

  const template =
    buscarTemplate(chaveFinal, idioma) ?? buscarTemplate(chaveFinal, IDIOMA_PADRAO) ?? chave;
  if (!params) return template;
  const resultado = template.replace(/\{(\w+)\}/g, (match, nome: string) =>
    nome in params ? String(params[nome]) : match,
  );
  // Nota da Rosetta (revisão T5.1): formatarMesPorExtenso devolve minúsculas
  // ("outubro de 2026"). Quando o template começa com um {param} (em geral
  // {mes}), capitaliza a 1ª letra do resultado; frases que já começam com
  // texto literal (inclusive anotações que ficam minúsculas de propósito,
  // como "últimos {n} meses") não são tocadas.
  if (template.startsWith('{') && resultado.length > 0) {
    return resultado.charAt(0).toLocaleUpperCase(LOCALE_INTL[idioma]) + resultado.slice(1);
  }
  return resultado;
}
