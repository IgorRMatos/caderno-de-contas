/**
 * T8 — gera `public/exemplo.csv` (download, CA03.3) e `src/domain/exemploDados.ts`
 * (bundle, carregado por "Ver com dados de exemplo" sem rede — D12) a partir
 * dos MESMOS dados em memória, determinístico (seed fixa, D6/CA03.2).
 *
 * Negócio: Padaria Dona Lurdes, mai–out/2026. Os totais mensais e a quebra de
 * categorias de outubro batem exatamente com o mockup 04 / UX §10.7:
 * out: entrou 18.000,00 / saiu 14.760,00 / sobrou 3.240,00 (margem 18%);
 * jul: sobrou −750,00 (único mês no vermelho).
 *
 * Rodar: `npm run gerar-exemplo` (dentro de `app/`).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------- PRNG determinístico (mulberry32) ----------
function criarPrng(seed: number) {
  let a = seed;
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const aleatorio = criarPrng(20261103); // seed fixa: data de início do projeto

function diaAleatorio(): number {
  return 1 + Math.floor(aleatorio() * 27); // 1–27, sempre válido em qualquer mês
}

interface LinhaGerada {
  data: string; // AAAA-MM-DD
  descricao: string;
  centavos: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
}

/** Divide `totalCentavos` entre `pesos` (proporções), ajustando o resto no maior item. */
function dividirPorPeso(totalCentavos: number, pesos: readonly number[]): number[] {
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  const valores = pesos.map((p) => Math.round((totalCentavos * p) / somaPesos));
  const diferenca = totalCentavos - valores.reduce((a, b) => a + b, 0);
  const indiceMaior = valores.indexOf(Math.max(...valores));
  valores[indiceMaior] = (valores[indiceMaior] ?? 0) + diferenca;
  return valores;
}

/** Quebra um total de categoria em 1–3 lançamentos individuais (datas e descrições distintas). */
function lancamentosDaCategoria(
  mes: string,
  categoria: string,
  totalCentavos: number,
  tipo: 'entrada' | 'saida',
  descricoes: readonly string[],
  maxPartes: number,
): LinhaGerada[] {
  if (totalCentavos <= 0) return [];
  const partes = Math.min(maxPartes, descricoes.length, 1 + Math.floor(aleatorio() * maxPartes));
  const pesos = Array.from({ length: partes }, () => 0.5 + aleatorio());
  const valores = dividirPorPeso(totalCentavos, pesos).filter((v) => v > 0);
  const descricoesEmbaralhadas = [...descricoes].sort(() => aleatorio() - 0.5);

  return valores.map((centavos, i) => ({
    data: `${mes}-${String(diaAleatorio()).padStart(2, '0')}`,
    descricao: descricoesEmbaralhadas[i % descricoesEmbaralhadas.length]!,
    centavos,
    tipo,
    categoria,
  }));
}

const DESCRICOES_SAIDA: Record<string, readonly string[]> = {
  fornecedores: [
    'Farinha — Moinho Sul',
    'Açúcar e fermento',
    'Manteiga e ovos',
    'Fornecedor de queijos',
  ],
  'folha-de-pagamento': ['Salário — equipe', 'Salário — balconista', 'Vale-transporte equipe'],
  aluguel: ['Aluguel do ponto'],
  'energia-e-gas': ['Conta de luz', 'Conta de gás'],
  embalagens: ['Sacolas e caixas', 'Papel para embrulho'],
  outros: ['Manutenção do forno', 'Material de limpeza', 'Taxas bancárias'],
};
const DESCRICOES_ENTRADA: readonly string[] = [
  'Vendas do balcão',
  'Vendas no cartão',
  'Encomenda — festa',
  'Encomenda — evento',
];

/** Totais mensais e quebra de saída de outubro batem com o mockup 04 (D6/UX §10.7). */
interface MesPlano {
  mes: string; // AAAA-MM
  entradaCentavos: number;
  categoriasSaida: Record<string, number>;
}

const PLANO: readonly MesPlano[] = [
  {
    mes: '2026-05',
    entradaCentavos: 1_520_000,
    categoriasSaida: pesoPadrao(1_310_000, 1),
  },
  {
    mes: '2026-06',
    entradaCentavos: 1_610_000,
    categoriasSaida: pesoPadrao(1_350_000, 1.05),
  },
  {
    mes: '2026-07',
    entradaCentavos: 1_390_000,
    categoriasSaida: pesoPadrao(1_465_000, 1.1), // mês no vermelho
  },
  {
    mes: '2026-08',
    entradaCentavos: 1_580_000,
    categoriasSaida: pesoPadrao(1_390_000, 1.15),
  },
  {
    mes: '2026-09',
    entradaCentavos: 1_640_000,
    categoriasSaida: pesoPadrao(1_365_000, 1.2), // energia subindo, prepara o insight "De olho"
  },
  {
    mes: '2026-10',
    entradaCentavos: 1_800_000,
    // quebra EXATA do mockup 04 — não usa pesoPadrao
    categoriasSaida: {
      fornecedores: 620_000,
      'folha-de-pagamento': 390_000,
      aluguel: 220_000,
      'energia-e-gas': 118_000,
      embalagens: 64_000,
      outros: 64_000,
    },
  },
];

/** Pesos parecidos com outubro (42/26/15/8/4/4%), com leve variação para dar vida aos meses anteriores. */
function pesoPadrao(totalCentavos: number, fatorEnergia: number): Record<string, number> {
  const pesos = [0.42, 0.26, 0.15, 0.08 * fatorEnergia, 0.04, 0.04];
  const [fornecedores, folha, aluguel, energia, embalagens, outros] = dividirPorPeso(
    totalCentavos,
    pesos,
  ) as [number, number, number, number, number, number];
  return {
    fornecedores,
    'folha-de-pagamento': folha,
    aluguel,
    'energia-e-gas': energia,
    embalagens,
    outros,
  };
}

function gerarLinhas(): LinhaGerada[] {
  const linhas: LinhaGerada[] = [];

  for (const { mes, entradaCentavos, categoriasSaida } of PLANO) {
    linhas.push(
      ...lancamentosDaCategoria(mes, 'vendas', entradaCentavos, 'entrada', DESCRICOES_ENTRADA, 3),
    );

    for (const [categoria, centavos] of Object.entries(categoriasSaida)) {
      const descricoes = DESCRICOES_SAIDA[categoria] ?? ['Despesa diversa'];
      linhas.push(...lancamentosDaCategoria(mes, categoria, centavos, 'saida', descricoes, 3));
    }
  }

  linhas.sort((a, b) => a.data.localeCompare(b.data));
  return linhas;
}

function paraValorCSV(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

function paraCSV(linhas: readonly LinhaGerada[]): string {
  const cabecalho = 'data;descricao;valor;tipo;categoria';
  const corpo = linhas.map(
    (l) => `${l.data};${l.descricao};${paraValorCSV(l.centavos)};${l.tipo};${l.categoria}`,
  );
  return [cabecalho, ...corpo].join('\n');
}

function main(): void {
  const linhas = gerarLinhas();
  const csv = paraCSV(linhas);

  const caminhoPublic = join(import.meta.dirname, '../public/exemplo.csv');
  writeFileSync(caminhoPublic, csv, 'utf8');

  const caminhoBundle = join(import.meta.dirname, '../src/domain/exemploDados.ts');
  const comentario = [
    '/**',
    ' * Conteúdo do exemplo.csv embutido no bundle (não via fetch, que o CSP',
    " * de produção bloqueia com connect-src 'none' — D12). public/exemplo.csv",
    ' * é só o link de download (CA03.3); o app carrega os mesmos dados daqui.',
    ' *',
    ' * GERADO por scripts/gerar-exemplo.ts — não editar à mão, rode',
    ' * `npm run gerar-exemplo` para regenerar (mantém os dois arquivos em sincronia).',
    ' */',
  ].join('\n');
  const csvEscapado = csv.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  const conteudoTs = `${comentario}\nexport const EXEMPLO_CSV = \`${csvEscapado}\`;\n`;
  writeFileSync(caminhoBundle, conteudoTs, 'utf8');

  console.log(`gerados: ${linhas.length} lançamentos`);
  console.log(`  public/exemplo.csv (${csv.length} bytes)`);
  console.log(`  src/domain/exemploDados.ts`);
}

main();
