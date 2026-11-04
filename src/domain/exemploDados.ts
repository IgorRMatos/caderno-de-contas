/**
 * Conteúdo do `exemplo.csv` embutido no bundle (não via `fetch`, que o CSP de
 * produção bloqueia com `connect-src 'none'` — D12). `public/exemplo.csv` é
 * só o link de download (CA03.3); o app carrega os mesmos dados daqui.
 *
 * Placeholder do T7 — T8 substitui pelo dataset determinístico completo da
 * Padaria Dona Lurdes, gerado por `scripts/gerar-exemplo.ts`, mantendo os
 * dois arquivos em sincronia.
 */
export const EXEMPLO_CSV = `data;descricao;valor;tipo;categoria
2026-10-01;Venda do balcão;100,00;entrada;vendas
2026-10-02;Farinha;45,00;saida;fornecedores`;
