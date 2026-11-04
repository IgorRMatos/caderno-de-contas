/**
 * Conteúdo do exemplo.csv embutido no bundle (não via fetch, que o CSP
 * de produção bloqueia com connect-src 'none' — D12). public/exemplo.csv
 * é só o link de download (CA03.3); o app carrega os mesmos dados daqui.
 *
 * GERADO por scripts/gerar-exemplo.ts — não editar à mão, rode
 * `npm run gerar-exemplo` para regenerar (mantém os dois arquivos em sincronia).
 */
export const EXEMPLO_CSV = `data;descricao;valor;tipo;categoria
2026-05-01;Conta de luz;1058,59;saida;energia-e-gas
2026-05-02;Material de limpeza;117,76;saida;outros
2026-05-05;Vale-transporte equipe;1410,36;saida;folha-de-pagamento
2026-05-08;Manutenção do forno;154,31;saida;outros
2026-05-11;Salário — balconista;2030,04;saida;folha-de-pagamento
2026-05-12;Vendas do balcão;15200,00;entrada;vendas
2026-05-13;Açúcar e fermento;4054,83;saida;fornecedores
2026-05-17;Fornecedor de queijos;1502,75;saida;fornecedores
2026-05-20;Aluguel do ponto;1984,85;saida;aluguel
2026-05-23;Sacolas e caixas;184,74;saida;embalagens
2026-05-27;Papel para embrulho;344,55;saida;embalagens
2026-05-27;Taxas bancárias;257,22;saida;outros
2026-06-01;Manutenção do forno;189,92;saida;outros
2026-06-03;Farinha — Moinho Sul;3017,21;saida;fornecedores
2026-06-06;Vendas do balcão;16100,00;entrada;vendas
2026-06-07;Sacolas e caixas;163,56;saida;embalagens
2026-06-09;Conta de gás;469,50;saida;energia-e-gas
2026-06-15;Açúcar e fermento;2687,01;saida;fornecedores
2026-06-16;Papel para embrulho;379,70;saida;embalagens
2026-06-17;Salário — balconista;2090,17;saida;folha-de-pagamento
2026-06-18;Salário — equipe;1441,02;saida;folha-de-pagamento
2026-06-18;Taxas bancárias;132,20;saida;outros
2026-06-19;Conta de luz;671,35;saida;energia-e-gas
2026-06-19;Material de limpeza;221,14;saida;outros
2026-06-26;Aluguel do ponto;2037,22;saida;aluguel
2026-07-01;Papel para embrulho;587,17;saida;embalagens
2026-07-01;Material de limpeza;128,65;saida;outros
2026-07-02;Encomenda — evento;5570,92;entrada;vendas
2026-07-02;Salário — balconista;1510,65;saida;folha-de-pagamento
2026-07-05;Taxas bancárias;287,72;saida;outros
2026-07-11;Conta de gás;1291,78;saida;energia-e-gas
2026-07-12;Aluguel do ponto;2201,90;saida;aluguel
2026-07-16;Vendas no cartão;4719,56;entrada;vendas
2026-07-16;Salário — equipe;2305,98;saida;folha-de-pagamento
2026-07-17;Farinha — Moinho Sul;2791,43;saida;fornecedores
2026-07-18;Vendas do balcão;3609,52;entrada;vendas
2026-07-22;Manutenção do forno;170,80;saida;outros
2026-07-27;Açúcar e fermento;3373,92;saida;fornecedores
2026-08-01;Manteiga e ovos;1896,41;saida;fornecedores
2026-08-04;Manutenção do forno;247,06;saida;outros
2026-08-11;Salário — balconista;1803,42;saida;folha-de-pagamento
2026-08-16;Conta de gás;1276,25;saida;energia-e-gas
2026-08-17;Material de limpeza;117,53;saida;outros
2026-08-17;Taxas bancárias;190,30;saida;outros
2026-08-19;Papel para embrulho;554,89;saida;embalagens
2026-08-21;Encomenda — evento;15800,00;entrada;vendas
2026-08-24;Fornecedor de queijos;3929,93;saida;fornecedores
2026-08-24;Vale-transporte equipe;1803,37;saida;folha-de-pagamento
2026-08-25;Aluguel do ponto;2080,84;saida;aluguel
2026-09-02;Encomenda — festa;6140,40;entrada;vendas
2026-09-07;Salário — balconista;1595,52;saida;folha-de-pagamento
2026-09-11;Açúcar e fermento;3024,95;saida;fornecedores
2026-09-13;Vendas no cartão;4708,40;entrada;vendas
2026-09-15;Vendas do balcão;5551,20;entrada;vendas
2026-09-15;Manutenção do forno;542,74;saida;outros
2026-09-19;Farinha — Moinho Sul;2673,87;saida;fornecedores
2026-09-20;Aluguel do ponto;2035,29;saida;aluguel
2026-09-21;Conta de gás;596,94;saida;energia-e-gas
2026-09-23;Salário — equipe;1932,31;saida;folha-de-pagamento
2026-09-23;Conta de luz;705,64;saida;energia-e-gas
2026-09-25;Papel para embrulho;542,74;saida;embalagens
2026-10-10;Açúcar e fermento;3219,76;saida;fornecedores
2026-10-11;Manteiga e ovos;2980,24;saida;fornecedores
2026-10-14;Conta de luz;1180,00;saida;energia-e-gas
2026-10-15;Encomenda — evento;5736,60;entrada;vendas
2026-10-16;Encomenda — festa;12263,40;entrada;vendas
2026-10-16;Taxas bancárias;256,78;saida;outros
2026-10-25;Aluguel do ponto;2200,00;saida;aluguel
2026-10-25;Papel para embrulho;640,00;saida;embalagens
2026-10-26;Salário — equipe;1598,43;saida;folha-de-pagamento
2026-10-26;Material de limpeza;383,22;saida;outros
2026-10-27;Salário — balconista;2301,57;saida;folha-de-pagamento`;
