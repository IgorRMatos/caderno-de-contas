import type { Categoria, Filtros, Lancamento } from '../domain/types.js';

const RE_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function lancamentoValido(item: unknown): item is Lancamento {
  if (typeof item !== 'object' || item === null) return false;
  const l = item as Record<string, unknown>;
  return (
    typeof l.id === 'string' &&
    l.id !== '' &&
    typeof l.data === 'string' &&
    RE_DATA_ISO.test(l.data) &&
    typeof l.descricao === 'string' &&
    Number.isInteger(l.valorCentavos) &&
    (l.valorCentavos as number) > 0 &&
    (l.tipo === 'entrada' || l.tipo === 'saida') &&
    typeof l.categoria === 'string' &&
    l.categoria !== '' &&
    (l.origem === 'importado' || l.origem === 'manual' || l.origem === 'exemplo') &&
    typeof l.criadoEm === 'string' &&
    !Number.isNaN(Date.parse(l.criadoEm))
  );
}

export function categoriaValida(item: unknown): item is Categoria {
  if (typeof item !== 'object' || item === null) return false;
  const c = item as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    c.id !== '' &&
    typeof c.nome === 'string' &&
    c.nome !== '' &&
    typeof c.personalizada === 'boolean'
  );
}

const TIPOS_PERIODO = new Set(['ultimo-mes', 'ultimos-3', 'este-ano', 'tudo', 'mes', 'intervalo']);

export function filtrosValidos(item: unknown): item is Filtros {
  if (typeof item !== 'object' || item === null) return false;
  const f = item as Record<string, unknown>;
  if (typeof f.periodo !== 'object' || f.periodo === null) return false;
  const p = f.periodo as Record<string, unknown>;
  if (typeof p.tipo !== 'string' || !TIPOS_PERIODO.has(p.tipo)) return false;
  if (!Array.isArray(f.categorias) || !f.categorias.every((c) => typeof c === 'string'))
    return false;
  return true;
}
