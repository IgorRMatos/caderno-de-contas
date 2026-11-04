import { IDIOMA_PADRAO, LOCALE_INTL, type Idioma } from '../config.js';
import ptBR from './pt-BR.json';

type Dicionario = typeof ptBR;
type ArvoreDeChaves = Record<string, unknown>;

/** pt-BR vai no bundle principal (D9); es/en só por `import()` dinâmico. */
const dicionarios: Partial<Record<Idioma, Dicionario>> = { 'pt-BR': ptBR };

let idiomaAtual: Idioma = IDIOMA_PADRAO;

export function idiomaAtivo(): Idioma {
  return idiomaAtual;
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

/** Carrega es/en sob demanda (D9/D14) e passa a usá-lo em `t()`. */
export async function carregarIdioma(idioma: Idioma): Promise<void> {
  if (!dicionarios[idioma]) {
    const modulo = idioma === 'es' ? await import('./es.json') : await import('./en.json');
    dicionarios[idioma] = modulo.default as Dicionario;
  }
  idiomaAtual = idioma;
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
 */
export function t(chave: string, params?: Record<string, string | number>): string {
  let chaveFinal = chave;
  if (params && typeof params.n === 'number') {
    const sufixo = categoriaPlural(idiomaAtual, params.n);
    if (buscarTemplate(`${chave}_${sufixo}`, idiomaAtual) !== undefined) {
      chaveFinal = `${chave}_${sufixo}`;
    } else if (buscarTemplate(`${chave}_other`, idiomaAtual) !== undefined) {
      chaveFinal = `${chave}_other`;
    }
  }

  const template =
    buscarTemplate(chaveFinal, idiomaAtual) ?? buscarTemplate(chaveFinal, IDIOMA_PADRAO) ?? chave;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, nome: string) =>
    nome in params ? String(params[nome]) : match,
  );
}
