import type { Idioma } from '../../config.js';
import { fluxoMensal } from '../../domain/aggregate.js';
import { formatarMesAbreviado, formatarMesPorExtenso } from '../../domain/dates.js';
import { formatarCompacto, formatarMoeda } from '../../domain/money.js';
import type { Projecao as ProjecaoDados } from '../../domain/projection.js';
import { t } from '../../i18n/index.js';
import { lancamentosComCategoria, mesReferencia, projecaoAtual } from '../../state/derivados.js';
import { idioma } from '../../state/signals.js';
import { criarEscalaLinear, gerarTicks } from './escala.js';

const MARGEM_ESQUERDA = 40;
const MARGEM_DIREITA = 20;
const LARGURA_PASSO_PADRAO = 67.5;
const LARGURA_MINIMA = 600;
const TOPO = 20;
const EIXO_Y = 190;
const ALTURA = 225;

/** Mesma ideia de `larguraDoGrupo` do FluxoCaixa: viewBox nunca mais estreito que `LARGURA_MINIMA`, senão o texto sai gigante. */
function larguraDoPasso(quantidadePontos: number): number {
  if (quantidadePontos <= 1) return LARGURA_PASSO_PADRAO;
  const disponivel = LARGURA_MINIMA - MARGEM_ESQUERDA - MARGEM_DIREITA;
  return Math.max(LARGURA_PASSO_PADRAO, disponivel / (quantidadePontos - 1));
}

/** Para `<path d="M ...">`: comandos `L` entre os pontos. */
function caminhoPontos(coords: readonly { x: number; y: number }[]): string {
  return coords.map((p) => `${p.x} ${p.y}`).join(' L ');
}

/** Para `<polygon points="...">`: só pares "x y", sem comandos de path. */
function poligonoPontos(coords: readonly { x: number; y: number }[]): string {
  return coords.map((p) => `${p.x},${p.y}`).join(' ');
}

function descricaoProjecao(
  reais: readonly { anoMes: string }[],
  projecao: ProjecaoDados,
  idiomaAtual: Idioma,
): string {
  const primeiro = reais[0];
  const ultimo = reais[reais.length - 1];
  const base = projecao.baseMeses;
  if (primeiro === undefined || ultimo === undefined || base.length === 0) return '';

  return t('graficos.projecaoDescricao', {
    m1: formatarMesPorExtenso(primeiro.anoMes, idiomaAtual),
    m2: formatarMesPorExtenso(ultimo.anoMes, idiomaAtual),
    valor: formatarMoeda(projecao.mediaSobrouCentavos, idiomaAtual),
    baseM1: formatarMesPorExtenso(base[0]!, idiomaAtual),
    baseM3: formatarMesPorExtenso(base[base.length - 1]!, idiomaAtual),
  });
}

/** T10/CA06.3 — sobra real (tinta) → projeção dos próximos 3 meses (lápis tracejado + faixa de desvio). */
export function Projecao() {
  const projecao = projecaoAtual.value;
  const mes = mesReferencia.value;
  if (projecao === null || mes === null) return null;

  const idiomaAtual = idioma.value;
  const idTitulo = 'pj-t';
  const idDesc = 'pj-d';

  if (projecao.semDados) {
    return (
      <section class="projection" aria-labelledby={idTitulo}>
        <div class="sec-title">
          <h2 id={idTitulo}>{t('secoes.proximosMeses')}</h2>
        </div>
        <p>{t('projecao.semDados')}</p>
      </section>
    );
  }

  const reais = fluxoMensal(lancamentosComCategoria.value).filter((f) => f.anoMes <= mes);
  const n = reais.length;
  const todasAsCoordenadas = [
    ...reais.map((f) => f.sobrouCentavos),
    ...projecao.mesesProjetados.map((p) => p.sobrouCentavos + projecao.desvioPadraoSobrouCentavos),
    ...projecao.mesesProjetados.map((p) => p.sobrouCentavos - projecao.desvioPadraoSobrouCentavos),
  ];
  const escala = criarEscalaLinear(todasAsCoordenadas, { topo: TOPO, base: EIXO_Y });
  const ticks = gerarTicks(escala.min, escala.max, escala.min < 0 ? 3 : 2);

  const totalPontos = n + projecao.mesesProjetados.length;
  const larguraPasso = larguraDoPasso(totalPontos);
  const x = (i: number): number => MARGEM_ESQUERDA + i * larguraPasso;
  const largura = x(totalPontos - 1) + MARGEM_DIREITA;

  const pontosReais = reais.map((f, i) => ({ x: x(i), y: escala.paraY(f.sobrouCentavos) }));
  const pontosProj = projecao.mesesProjetados.map((p, i) => ({
    x: x(n + i),
    y: escala.paraY(p.sobrouCentavos),
  }));
  const linhaProj = pontosReais.length > 0 ? [pontosReais[pontosReais.length - 1]!, ...pontosProj] : pontosProj;

  const faixaBanda =
    projecao.desvioPadraoSobrouCentavos > 0
      ? [
          ...pontosProj.map((_, i) => ({
            x: x(n + i),
            y: escala.paraY(
              projecao.mesesProjetados[i]!.sobrouCentavos + projecao.desvioPadraoSobrouCentavos,
            ),
          })),
          ...[...pontosProj]
            .reverse()
            .map((_, j) => {
              const i = pontosProj.length - 1 - j;
              return {
                x: x(n + i),
                y: escala.paraY(
                  projecao.mesesProjetados[i]!.sobrouCentavos - projecao.desvioPadraoSobrouCentavos,
                ),
              };
            }),
        ]
      : [];

  const xDivisoria = (x(n - 1) + x(n)) / 2;

  return (
    <section class="projection" aria-labelledby={idTitulo}>
      <div class="sec-title">
        <h2 id={idTitulo}>{t('secoes.proximosMeses')}</h2>
        <span class="hand">{t('secoes.aLapis')}</span>
      </div>
      {projecao.poucosMeses && (
        <p class="field-msg" role="status">
          {t('projecao.poucosMeses', { n: projecao.baseMeses.length })}
        </p>
      )}
      <svg class="chart" viewBox={`0 0 ${largura} ${ALTURA}`} role="img" aria-labelledby={`${idTitulo} ${idDesc}`}>
        <desc id={idDesc}>{descricaoProjecao(reais, projecao, idiomaAtual)}</desc>
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
        {escala.min < 0 && (
          <line class="zero" x1={MARGEM_ESQUERDA} x2={largura} y1={escala.paraY(0)} y2={escala.paraY(0)} />
        )}

        {faixaBanda.length > 0 && <polygon class="proj-band" points={poligonoPontos(faixaBanda)} />}

        <line
          x1={xDivisoria}
          x2={xDivisoria}
          y1="10"
          y2="200"
          style={{ stroke: 'var(--ink-2)' }}
          stroke-dasharray="3 4"
        />

        {pontosReais.length > 1 && <path class="real" d={`M ${caminhoPontos(pontosReais)}`} />}
        {linhaProj.length > 1 && <path class="proj" d={`M ${caminhoPontos(linhaProj)}`} />}

        {reais.map((f, i) => {
          const p = pontosReais[i]!;
          const rotulo = `${formatarMesPorExtenso(f.anoMes, idiomaAtual)}: ${formatarMoeda(f.sobrouCentavos, idiomaAtual)}`;
          return (
            <g key={f.anoMes} tabindex={0} role="img" aria-label={rotulo}>
              <title>{rotulo}</title>
              <circle class={`dot${f.sobrouCentavos < 0 ? ' neg' : ''}`} cx={p.x} cy={p.y} r={4.5} />
            </g>
          );
        })}
        {projecao.mesesProjetados.map((p, i) => {
          const ponto = pontosProj[i]!;
          const rotulo = `${formatarMesPorExtenso(p.anoMes, idiomaAtual)}: ${t('projecao.estimativa', { valor: formatarMoeda(p.sobrouCentavos, idiomaAtual) })}`;
          return (
            <g key={p.anoMes} tabindex={0} role="img" aria-label={rotulo}>
              <title>{rotulo}</title>
              <circle class="dot proj-dot" cx={ponto.x} cy={ponto.y} r={4.5} />
            </g>
          );
        })}

        <g text-anchor="middle">
          {reais.map((f, i) => (
            <text key={f.anoMes} x={x(i)} y="208" style={i === n - 1 ? { fontWeight: 700, fill: 'var(--ink)' } : undefined}>
              {formatarMesAbreviado(f.anoMes, idiomaAtual)}
            </text>
          ))}
          {projecao.mesesProjetados.map((p, i) => (
            <text key={p.anoMes} x={x(n + i)} y="208" style={{ fontStyle: 'italic' }}>
              {formatarMesAbreviado(p.anoMes, idiomaAtual)}
            </text>
          ))}
        </g>
      </svg>
      <div class="legend">
        <span>
          <i class="k-real" />
          {t('projecao.oQueSobrouDeVerdade')}
        </span>
        <span>
          <i class="k-proj" />
          {t('projecao.legenda', {
            m1: formatarMesAbreviado(projecao.baseMeses[0]!, idiomaAtual),
            m3: formatarMesAbreviado(projecao.baseMeses[projecao.baseMeses.length - 1]!, idiomaAtual),
          })}
        </span>
      </div>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', marginTop: '8px' }}>
        {t('projecao.explicacao')}
      </p>
    </section>
  );
}
