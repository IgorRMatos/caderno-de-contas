import { ArrowDown, ArrowUp } from 'lucide-preact';
import { formatarMesPorExtenso } from '../domain/dates.js';
import { formatarMoeda } from '../domain/money.js';
import { t } from '../i18n/index.js';
import {
  categoriasDoMesAtual,
  filtroVazio,
  insightsAtuais,
  kpisAtuais,
  kpisMesAnterior,
  mesReferencia,
} from '../state/derivados.js';
import { categorias, filtros, idioma } from '../state/signals.js';
import { BannerExemplo } from '../ui/BannerExemplo.js';
import { FluxoCaixa } from '../ui/charts/FluxoCaixa.js';
import { Projecao } from '../ui/charts/Projecao.js';
import { Filtros } from '../ui/Filtros.js';
import { textoInsight } from '../ui/insightTexto.js';

function Variacao({ percentual, direcao }: { percentual: number; direcao: 'up' | 'down' }) {
  const Icone = direcao === 'up' ? ArrowUp : ArrowDown;
  return (
    <span class={`delta ${direcao}`}>
      <Icone class="icon" strokeWidth={2.25} aria-hidden="true" />
      {t(direcao === 'up' ? 'indicadores.aMaisQue' : 'indicadores.aMenosQue', { p: percentual })}
    </span>
  );
}

/** CA08.5 — há lançamentos no app, mas o filtro atual (período + categoria) não deixa nenhum. */
function FiltroVazio() {
  const nomesCategorias = filtros.value.categorias
    .map((id) => categorias.value.find((c) => c.id === id)?.nome ?? id)
    .join(', ');

  return (
    <section class="empty state-card">
      <h3>{t('vazios.semFiltro')}</h3>
      {nomesCategorias !== '' && mesReferencia.value !== null ? (
        <p>
          {t('filtros.zeroResultados', {
            mes: formatarMesPorExtenso(mesReferencia.value, idioma.value),
            categoria: nomesCategorias,
          })}
        </p>
      ) : (
        <p>{t('vazios.semFiltro')}.</p>
      )}
    </section>
  );
}

export function Dashboard() {
  return (
    <>
      <BannerExemplo />
      <Filtros />
      {filtroVazio.value ? <FiltroVazio /> : <ConteudoDashboard />}
    </>
  );
}

function ConteudoDashboard() {
  const mes = mesReferencia.value;
  const kpis = kpisAtuais.value;
  if (mes === null || kpis === null) return null;

  const kpisAnterior = kpisMesAnterior.value;
  const variacaoEntrou =
    kpisAnterior !== null && kpisAnterior.entrouCentavos !== 0
      ? Math.round(
          ((kpis.entrouCentavos - kpisAnterior.entrouCentavos) /
            Math.abs(kpisAnterior.entrouCentavos)) *
            100,
        )
      : null;
  const variacaoSaiu =
    kpisAnterior !== null && kpisAnterior.saiuCentavos !== 0
      ? Math.round(
          ((kpis.saiuCentavos - kpisAnterior.saiuCentavos) / Math.abs(kpisAnterior.saiuCentavos)) *
            100,
        )
      : null;

  const insights = insightsAtuais.value.insights;
  const manchete = insights[0];
  const resto = insights.slice(1);

  return (
    <div class="dash">
      <section class="hero-kpi">
        <span class="label">{t('indicadores.quantoSobrou')}</span>
        <p class={`big${kpis.sobrouCentavos < 0 ? ' neg' : ''}`}>
          {formatarMoeda(kpis.sobrouCentavos, idioma.value)}
        </p>
        {manchete !== undefined && (
          <p class="headline">{textoInsight(manchete, idioma.value, categorias.value)}</p>
        )}
      </section>

      <section class="side-kpis">
        <div class="row in">
          <span class="t">{t('indicadores.quantoEntrou')}</span>
          <span class="v">{formatarMoeda(kpis.entrouCentavos, idioma.value)}</span>
          {variacaoEntrou !== null && (
            <Variacao percentual={Math.abs(variacaoEntrou)} direcao={variacaoEntrou >= 0 ? 'up' : 'down'} />
          )}
        </div>
        <div class="row out">
          <span class="t">{t('indicadores.quantoSaiu')}</span>
          <span class="v">{formatarMoeda(kpis.saiuCentavos, idioma.value)}</span>
          {variacaoSaiu !== null && (
            <Variacao percentual={Math.abs(variacaoSaiu)} direcao={variacaoSaiu >= 0 ? 'down' : 'up'} />
          )}
        </div>
        <div class="row margin">
          <span class="stamp">
            {kpis.margemPercentual === null
              ? t('indicadores.margemTraco')
              : t('indicadores.margem', { p: kpis.margemPercentual })}
          </span>
          <p>
            {kpis.margemPercentual === null
              ? t('indicadores.margemSemEntrada')
              : t('indicadores.margemFrase', {
                  cem: formatarMoeda(10000, idioma.value),
                  x: formatarMoeda(Math.round(kpis.margemPercentual * 100), idioma.value),
                })}
          </p>
        </div>
      </section>

      <section class="insights">
        <div class="sec-title">
          <h2>{t('secoes.oQueNotei')}</h2>
        </div>
        {resto.length === 0 ? null : (
          <ol>
            {resto.map((insight, i) => (
              <li
                key={insight.chave}
                class={i === 0 ? 'main' : insight.prioridade >= 80 ? 'alert' : undefined}
              >
                {textoInsight(insight, idioma.value, categorias.value)}
              </li>
            ))}
          </ol>
        )}
      </section>

      <FluxoCaixa />

      <section class="categories">
        <div class="sec-title">
          <h2>{t('secoes.paraOndeFoi')}</h2>
          <span class="hand">{t('secoes.saidasDoMes', { mes: formatarMesPorExtenso(mes, idioma.value) })}</span>
        </div>
        <ul class="cat-list">
          {categoriasDoMesAtual.value.map((c) => {
            const nome = categorias.value.find((cat) => cat.id === c.categoria)?.nome ?? c.categoria;
            return (
              <li key={c.categoria}>
                <div class="line">
                  <span class="name">{nome}</span>
                  <span class="dots" />
                  <span class="val">{formatarMoeda(c.valorCentavos, idioma.value)}</span>
                  <span class="pct">{c.percentual}%</span>
                </div>
                <div class="track">
                  <div class="fill" style={{ width: `${c.percentual}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Projecao />
    </div>
  );
}
