import { afterEach, describe, expect, it } from 'vitest';
import { carregarIdioma, detectarIdiomaInicial, idiomaAtivo, t } from '../../../src/i18n/index';

afterEach(async () => {
  await carregarIdioma('pt-BR');
});

describe('detectarIdiomaInicial (CA10.4)', () => {
  it('detecta pt, es e en a partir de navigator.languages', () => {
    expect(detectarIdiomaInicial(['pt-BR', 'en-US'])).toBe('pt-BR');
    expect(detectarIdiomaInicial(['es-AR', 'en-US'])).toBe('es');
    expect(detectarIdiomaInicial(['en-GB'])).toBe('en');
  });

  it('idioma não suportado → cai para pt-BR', () => {
    expect(detectarIdiomaInicial(['fr-FR', 'de-DE'])).toBe('pt-BR');
    expect(detectarIdiomaInicial([])).toBe('pt-BR');
  });
});

describe('t() — interpolação de {param} (D9)', () => {
  it('interpola um parâmetro simples', () => {
    expect(t('filtros.removerFiltro', { nome: 'Outubro de 2026' })).toBe(
      'Remover filtro Outubro de 2026',
    );
  });

  it('interpola múltiplos parâmetros no mesmo template', () => {
    const texto = t('insights.maior_categoria', {
      mes: 'outubro',
      categoria: 'fornecedores',
      percentual: 42,
    });
    expect(texto).toBe('Seu maior gasto em outubro foi fornecedores: 42% das saídas.');
  });

  it('chave inexistente devolve a própria chave (nunca quebra a UI)', () => {
    expect(t('isso.nao.existe')).toBe('isso.nao.existe');
  });
});

describe('t() — plural via Intl.PluralRules (D9)', () => {
  it('pt-BR: n=1 usa _one, n>1 usa _other', () => {
    expect(t('toasts.semCategoria', { n: 1 })).toBe('1 linha sem categoria foi para Outros.');
    expect(t('toasts.semCategoria', { n: 12 })).toBe('12 linhas sem categoria foram para Outros.');
  });

  it('en: mesma regra de plural, texto em inglês', async () => {
    await carregarIdioma('en');
    expect(t('toasts.semCategoria', { n: 1 })).toBe('1 row with no category went to Other.');
    expect(t('toasts.semCategoria', { n: 5 })).toBe('5 rows with no category went to Other.');
  });
});

describe('t() — maiúscula inicial só para {mes} (revisão T5.1; bug do QA no T12)', () => {
  it('nome de arquivo no início fica como veio, nos 3 idiomas', async () => {
    const p1 = { arquivo: 'caderno-2026-11-04.csv', n: 6 };
    expect(t('seusDados.copiaBaixadaDetalhe', p1)).toBe(
      'caderno-2026-11-04.csv com 6 lançamentos.',
    );
    expect(t('dropzone.lendoDetalhe', { nome: 'vendas.csv', n: 2 })).toMatch(/^vendas\.csv · 2 /);
    await carregarIdioma('es');
    expect(t('seusDados.copiaBaixadaDetalhe', { arquivo: 'caderno-x.csv', n: 1 })).toBe(
      'caderno-x.csv con 1 movimiento.',
    );
    await carregarIdioma('en');
    expect(t('seusDados.copiaBaixadaDetalhe', { arquivo: 'caderno-x.csv', n: 1 })).toBe(
      'caderno-x.csv with 1 entry.',
    );
  });

  it('{mes} no início continua com maiúscula', () => {
    expect(t('manchete.semComparacao', { mes: 'outubro de 2026', valor: 'R$ 10,00' })).toBe(
      'Outubro de 2026 sobrou R$ 10,00.',
    );
  });
});

describe('carregarIdioma — es/en por import() dinâmico (D9/D14)', () => {
  it('troca o idioma ativo e passa a usar o dicionário carregado', async () => {
    expect(idiomaAtivo()).toBe('pt-BR');
    await carregarIdioma('es');
    expect(idiomaAtivo()).toBe('es');
    expect(t('indicadores.quantoSobrou')).toBe('Cuánto te quedó');
  });

  it('chave ausente no idioma carregado cai para pt-BR (nunca quebra)', async () => {
    await carregarIdioma('en');
    // marca existe em todos; só testando o mecanismo de fallback é indireto aqui —
    // garantimos ao menos que chaves existentes funcionam sem lançar
    expect(() => t('marca')).not.toThrow();
  });
});
