import { describe, expect, it } from 'vitest';
import en from '../../../src/i18n/en.json';
import es from '../../../src/i18n/es.json';
import ptBR from '../../../src/i18n/pt-BR.json';

function coletarChaves(obj: unknown, prefixo = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefixo];
  const chaves: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    chaves.push(...coletarChaves(v, prefixo ? `${prefixo}.${k}` : k));
  }
  return chaves;
}

describe('i18n — paridade de chaves entre pt-BR.json, es.json e en.json (D9)', () => {
  const chavesPt = coletarChaves(ptBR).sort();
  const chavesEs = coletarChaves(es).sort();
  const chavesEn = coletarChaves(en).sort();

  it('es.json tem exatamente as mesmas chaves que pt-BR.json', () => {
    expect(chavesEs).toEqual(chavesPt);
  });

  it('en.json tem exatamente as mesmas chaves que pt-BR.json', () => {
    expect(chavesEn).toEqual(chavesPt);
  });

  it('nenhum arquivo tem valor vazio (string em branco) — traduções pendentes ficariam óbvias', () => {
    function valoresVazios(obj: unknown, prefixo = ''): string[] {
      if (typeof obj === 'string') return obj.trim() === '' ? [prefixo] : [];
      if (typeof obj !== 'object' || obj === null) return [];
      const vazios: string[] = [];
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        vazios.push(...valoresVazios(v, prefixo ? `${prefixo}.${k}` : k));
      }
      return vazios;
    }
    expect(valoresVazios(ptBR)).toEqual([]);
    expect(valoresVazios(es)).toEqual([]);
    expect(valoresVazios(en)).toEqual([]);
  });

  it('todo "{param}" presente no pt-BR também aparece no es e no en, para a mesma chave (params não traduzíveis)', () => {
    function paramsDe(template: string): Set<string> {
      return new Set([...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!));
    }
    function paramsPorChave(obj: unknown, prefixo = ''): Map<string, Set<string>> {
      const mapa = new Map<string, Set<string>>();
      if (typeof obj === 'string') {
        mapa.set(prefixo, paramsDe(obj));
        return mapa;
      }
      if (typeof obj !== 'object' || obj === null) return mapa;
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        for (const [chave, params] of paramsPorChave(v, prefixo ? `${prefixo}.${k}` : k)) {
          mapa.set(chave, params);
        }
      }
      return mapa;
    }
    const pt = paramsPorChave(ptBR);
    const esMapa = paramsPorChave(es);
    const enMapa = paramsPorChave(en);

    for (const [chave, params] of pt) {
      expect([...(esMapa.get(chave) ?? [])].sort(), `es.json: ${chave}`).toEqual(
        [...params].sort(),
      );
      expect([...(enMapa.get(chave) ?? [])].sort(), `en.json: ${chave}`).toEqual(
        [...params].sort(),
      );
    }
  });
});
