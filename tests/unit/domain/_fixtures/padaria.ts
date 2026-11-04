import type { Lancamento, Tipo } from '../../../../src/domain/types';

let seq = 0;
function l(data: string, valorReais: number, tipo: Tipo, categoria = 'vendas'): Lancamento {
  seq++;
  return {
    id: `fx-${seq}`,
    data,
    descricao: `lancamento ${seq}`,
    valorCentavos: Math.round(valorReais * 100),
    tipo,
    categoria,
    origem: 'exemplo',
    criadoEm: new Date().toISOString(),
  };
}

/**
 * Padaria Dona Lurdes — mesmos números do mockup 04-dashboard.html / UX §10.7:
 * mai–out/2026, julho no vermelho (−750), outubro o melhor mês (3.240, margem 18%).
 * Um lançamento de entrada e um de saída por mês (totais batem), exceto
 * outubro, cujas saídas vêm quebradas nas 6 categorias do mockup.
 */
export function construirLancamentosPadaria(): Lancamento[] {
  return [
    l('2026-05-15', 15200, 'entrada'),
    l('2026-05-16', 13100, 'saida', 'fornecedores'),

    l('2026-06-15', 16100, 'entrada'),
    l('2026-06-16', 13500, 'saida', 'fornecedores'),

    l('2026-07-15', 13900, 'entrada'),
    l('2026-07-16', 14650, 'saida', 'fornecedores'),

    l('2026-08-15', 15800, 'entrada'),
    l('2026-08-16', 13900, 'saida', 'fornecedores'),

    l('2026-09-15', 16400, 'entrada'),
    l('2026-09-16', 13650, 'saida', 'fornecedores'),

    l('2026-10-15', 18000, 'entrada'),
    l('2026-10-20', 6200, 'saida', 'fornecedores'),
    l('2026-10-21', 3900, 'saida', 'folha-de-pagamento'),
    l('2026-10-22', 2200, 'saida', 'aluguel'),
    l('2026-10-23', 1180, 'saida', 'energia-e-gas'),
    l('2026-10-24', 640, 'saida', 'embalagens'),
    l('2026-10-25', 640, 'saida', 'outros'),
  ];
}
