export interface Meta {
  schema: number;
}

export const SCHEMA_ATUAL = 1;

/**
 * D8 — existe desde já, mesmo vazia: ponto único para futuras migrações de
 * schema do storage (hoje só o schema 1 existe).
 */
export function migrar(meta: Meta | null): Meta {
  if (meta === null) return { schema: SCHEMA_ATUAL };
  if (meta.schema === SCHEMA_ATUAL) return meta;
  // futuras migrações: switch (meta.schema) { case 0: ... }
  return { schema: SCHEMA_ATUAL };
}
