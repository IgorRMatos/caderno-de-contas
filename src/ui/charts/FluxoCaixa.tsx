import type { FluxoMes } from '../../domain/aggregate.js';
import { fluxoNaJanela } from '../../domain/aggregate.js';
import type { Idioma } from '../../config.js';
import { LOCALE_INTL } from '../../config.js';
import { formatarMesAbreviado, formatarMesPorExtenso } from '../../domain/dates.js';
import { formatarCompacto, formatarMoeda } from '../../domain/money.js';
import { t } from '../../i18n/index.js';
import { janelaExibicao, lancamentosComCategoria } from '../../state/derivados.js';
import { idioma } from '../../state/signals.js';
import { criarEscalaLinear, gerarTicks } from './escala.js';

const MARGEM_ESQUERDA = 40;
const MARGEM_DIREITA = 20;
const LARGURA_GRUPO_PADRAO = 90;
const LARGURA_MINIMA = 600;
const LARGURA_BARRA = 26;
const ESPACO_BARRAS = 4;
const TOPO = 20;
const EIXO_Y = 200;
const ALTURA = 252;

/**
 * Largura do grupo mês/par-de-barras: com poucos meses (caso comum do
 * atalho "Último mês"/"Últimos 3 meses"), espalha os grupos para preencher
 * `LARGURA_MINIMA` — sem isso, o viewBox fica tão estreito que o texto
 * (definido em px no CSS, logo em unidades do viewBox) sai enorme. Com
 * muitos meses, usa a largura padrão e deixa o viewBox crescer.
 */
function larguraDoGrupo(quantidadeMeses: number): number {
  if (quantidadeMeses === 0) return LARGURA_GRUPO_PADRAO;
  const disponivel = LARGURA_MINIMA - MARGEM_ESQUERDA - MARGEM_DIREITA;
  return Math.max(LARGURA_GRUPO_PADRAO, disponivel / quantidadeMeses);
}

function primeiraLetraMaiuscula(s: string, idiomaAtual: Idioma): string {
  return s.length === 0 ? s : s.charAt(0).toLocaleUpperCase(LOCALE_INTL[idiomaAtual]) + s.slice(1);
}

/**
 * CA06.4 — `<desc>` textual do gráfico. `graficos.fluxoDescricao` (aprovado
 * pela Rosetta) pressupõe exatamente 1 mês no vermelho ("todos os meses
 * sobrou, menos {mesRuim}"); fora desse caso comum (0 ou 2+ meses no
 * vermelho) ele ficaria factualmente errado, então compomos uma descrição
 * genérica a partir das palavras já traduzidas em vez de inventar/esconder
 * um mês ruim.
 */
function descricaoFluxo(meses: readonly FluxoMes[], idiomaAtual: Idioma): string {
  const primeiro = meses[0];
  const ultimo = meses[meses.length - 1];
  if (primeiro === undefined || ultimo === undefined) return '';

  const m1 = formatarMesPorExtenso(primeiro.anoMes, idiomaAtual);
  const m2 = formatarMesPorExtenso(ultimo.anoMes, idiomaAtual);
  const vermelhos = meses.filter((m) => m.sobrouCentavos < 0);
  const melhor = meses.reduce((a, b) => (b.sobrouCentavos > a.sobrouCentavos ? b : a));

  if (vermelhos.length === 1) {
    const ruim = vermelhos[0]!;
    return t('graficos.fluxoDescricao', {
      m1,
      m2,
      mesRuim: formatarMesPorExtenso(ruim.anoMes, idiomaAtual),
      valorRuim: formatarMoeda(Math.abs(ruim.sobrouCentavos), idiomaAtual),
      melhorMes: formatarMesPorExtenso(melhor.anoMes, idiomaAtual),
      valorMelhor: formatarMoeda(melhor.sobrouCentavos, idiomaAtual),
    });
  }

  return [
    `${t('graficos.entrou')} / ${t('graficos.saiu')}: ${m1} – ${m2}.`,
    `${primeiraLetraMaiuscula(formatarMesPorExtenso(melhor.anoMes, idiomaAtual), idiomaAtual)}: ${formatarMoeda(melhor.sobrouCentavos, idiomaAtual)} ${t('graficos.sobrou')}.`,
  ].join(' ');
}

/** T10/CA06.1 — barras de entrou (hachura) × saiu (sólida) mês a mês, com saldo embaixo. */
export function FluxoCaixa() {
  const janela = janelaExibicao.value;
  if (janela === null) return null;

  const meses = fluxoNaJanela(lancamentosComCategoria.value, janela.de, janela.ate);
  const idiomaAtual = idioma.value;

  const valores = meses.flatMap((m) => [m.entrouCentavos, m.saiuCentavos]);
  const escala = criarEscalaLinear(valores, { topo: TOPO, base: EIXO_Y });
  const ticks = gerarTicks(escala.min, escala.max, 4);

  const larguraGrupo = larguraDoGrupo(meses.length);
  const largura = MARGEM_ESQUERDA + meses.length * larguraGrupo + MARGEM_DIREITA;
  const idTitulo = 'cf-t';
  const idDesc = 'cf-d';

  return (
    <section class="cashflow" aria-labelledby={idTitulo}>
      <div class="sec-title">
        <h2 id={idTitulo}>{t('secoes.entrouSaiu')}</h2>
        <span class="hand">{t('secoes.ultimosMeses', { n: meses.length })}</span>
      </div>
      <svg class="chart" viewBox={`0 0 ${largura} ${ALTURA}`} role="img" aria-labelledby={`${idTitulo} ${idDesc}`}>
        <desc id={idDesc}>{descricaoFluxo(meses, idiomaAtual)}</desc>
        <defs>
          <pattern id="hatch-in" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: 'var(--olive)' }} stroke-width="2" />
          </pattern>
        </defs>
        {ticks.map((valorTick) => (
          <line
            key={valorTick}
            class="grid"
            x1={MARGEM_ESQUERDA}
            x2={largura}
            y1={escala.paraY(valorTick)}
            y2={escala.paraY(valorTick)}
          />
        ))}
        {ticks.map((valorTick) => (
          <text key={valorTick} x="0" y={escala.paraY(valorTick) + 4}>
            {formatarCompacto(valorTick, idiomaAtual)}
          </text>
        ))}
        <line class="axis" x1={MARGEM_ESQUERDA} x2={largura} y1={EIXO_Y} y2={EIXO_Y} />
        <g>
          {meses.map((m, i) => {
            const xIn = MARGEM_ESQUERDA + i * larguraGrupo + 18;
            const xOut = xIn + LARGURA_BARRA + ESPACO_BARRAS;
            const yIn = escala.paraY(m.entrouCentavos);
            const yOut = escala.paraY(m.saiuCentavos);
            const rotulo = `${formatarMesPorExtenso(m.anoMes, idiomaAtual)}: ${t('graficos.entrou')} ${formatarMoeda(m.entrouCentavos, idiomaAtual)}, ${t('graficos.saiu')} ${formatarMoeda(m.saiuCentavos, idiomaAtual)}, ${t('graficos.sobrou')} ${formatarMoeda(m.sobrouCentavos, idiomaAtual)}.`;
            return (
              <g key={m.anoMes} tabindex={0} role="img" aria-label={rotulo}>
                <title>{rotulo}</title>
                <rect class="bar-in" x={xIn} y={yIn} width={LARGURA_BARRA} height={EIXO_Y - yIn} />
                <rect class="bar-out" x={xOut} y={yOut} width={LARGURA_BARRA} height={EIXO_Y - yOut} />
              </g>
            );
          })}
        </g>
        <g text-anchor="middle">
          {meses.map((m, i) => {
            const xIn = MARGEM_ESQUERDA + i * larguraGrupo + 18;
            const xOut = xIn + LARGURA_BARRA + ESPACO_BARRAS;
            const xLabel = (xIn + xOut + LARGURA_BARRA) / 2;
            const ehUltimo = i === meses.length - 1;
            return (
              <text key={m.anoMes} x={xLabel} y="220" style={ehUltimo ? { fontWeight: 700, fill: 'var(--ink)' } : undefined}>
                {formatarMesAbreviado(m.anoMes, idiomaAtual)}
              </text>
            );
          })}
          {meses.map((m, i) => {
            const xIn = MARGEM_ESQUERDA + i * larguraGrupo + 18;
            const xOut = xIn + LARGURA_BARRA + ESPACO_BARRAS;
            const xLabel = (xIn + xOut + LARGURA_BARRA) / 2;
            const sinal = m.sobrouCentavos >= 0 ? '+' : '';
            return (
              <text key={m.anoMes} class={`saldo${m.sobrouCentavos < 0 ? ' neg' : ''}`} x={xLabel} y="246">
                {sinal}
                {formatarCompacto(m.sobrouCentavos, idiomaAtual)}
              </text>
            );
          })}
        </g>
      </svg>
      <div class="legend">
        <span>
          <i class="k-in" />
          {t('graficos.entrou')}
        </span>
        <span>
          <i class="k-out" />
          {t('graficos.saiu')}
        </span>
      </div>
      <details class="data-table">
        <summary>{t('secoes.verNumerosTabela')}</summary>
        <table>
          <thead>
            <tr>
              <th>{t('graficos.mes')}</th>
              <th>{t('graficos.entrou')}</th>
              <th>{t('graficos.saiu')}</th>
              <th>{primeiraLetraMaiuscula(t('graficos.sobrou'), idiomaAtual)}</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.anoMes}>
                <td>{formatarMesAbreviado(m.anoMes, idiomaAtual)}</td>
                <td>{formatarMoeda(m.entrouCentavos, idiomaAtual)}</td>
                <td>{formatarMoeda(m.saiuCentavos, idiomaAtual)}</td>
                <td>{formatarMoeda(m.sobrouCentavos, idiomaAtual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
