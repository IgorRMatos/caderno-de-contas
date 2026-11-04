/** Célula crua como vem do CSV (sempre string) ou do XLSX (número/Date nativos). */
export type CelulaBruta = string | number | Date;

export interface TabelaBruta {
  colunas: string[];
  linhas: CelulaBruta[][];
}
