const PREFIXO = 'caderno:v1';

export const CHAVES = {
  lancamentos: `${PREFIXO}:lancamentos`,
  categorias: `${PREFIXO}:categorias`,
  filtros: `${PREFIXO}:filtros`,
  tema: `${PREFIXO}:tema`,
  idioma: `${PREFIXO}:idioma`,
  meta: `${PREFIXO}:meta`,
} as const;

export function chaveBackup(chave: string): string {
  return `${chave}:backup`;
}
