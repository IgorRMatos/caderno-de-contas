/**
 * Configuração central do produto. Pontos que o Console Master pode decidir
 * depois sem tocar no resto do código (D1, D4 do TECH.md).
 */

export type Idioma = 'pt-BR' | 'es' | 'en';

export const IDIOMAS: readonly Idioma[] = ['pt-BR', 'es', 'en'];
export const IDIOMA_PADRAO: Idioma = 'pt-BR';

/** D1 — moeda por idioma. Trocar aqui não converte valores, só a formatação. */
export const MOEDA_POR_IDIOMA: Record<Idioma, string> = {
  'pt-BR': 'BRL',
  es: 'EUR',
  en: 'USD',
};

/**
 * D1 — se o Console Master decidir moeda fixa (ex.: sempre BRL independente do
 * idioma), definir aqui o código ISO 4217. `null` = moeda segue o idioma
 * (decisão fechada pelo PO em 2026-11-03: moeda segue o idioma).
 */
export const MOEDA_FIXA: string | null = null;

export function moedaAtiva(idioma: Idioma): string {
  return MOEDA_FIXA ?? MOEDA_POR_IDIOMA[idioma];
}

/** D4 — URL do LinkedIn do autor, pendente do Console Master. */
export const LINKEDIN_URL = 'https://www.linkedin.com/in/placeholder-console-master';

/** Limite de linhas de planilha suportado numa importação (CA01.4). */
export const LIMITE_LINHAS_IMPORTACAO = 5000;

/** Categoria padrão quando a planilha não traz uma (CA01.7). */
export const CATEGORIA_SEM_NOME = 'outros';
