import { ArrowDown, ArrowUp, Plus } from 'lucide-preact';
import { useRef } from 'preact/hooks';
import {
  contar,
  crescerBarras,
  crossfade,
  desenharLinha,
  DURACOES,
  juntar,
  marcaTexto,
  NADA,
  rabiscar,
  revelarSecoes,
  riscarALapis,
  type Handle,
} from '../motion/index.js';
import { formatarMesPorExtenso } from '../domain/dates.js';
import { formatarMoeda } from '../domain/money.js';
import { t } from '../i18n/index.js';
import {
  categoriasDoMesAtual,
  filtroVazio,
  insightsAtuais,
  kpisAtuais,
  kpisMesAnterior,
  lancamentosDoMesAtual,
  mesReferencia,
} from '../state/derivados.js';
import { abrirNovoLancamento } from '../state/painelLancamento.js';
import { categorias, filtros, idioma } from '../state/signals.js';
import { navegar } from '../router.js';
import { BannerExemplo } from '../ui/BannerExemplo.js';
import { FluxoCaixa } from '../ui/charts/FluxoCaixa.js';
import { Projecao } from '../ui/charts/Projecao.js';
import { Filtros } from '../ui/Filtros.js';
import { textoInsight } from '../ui/insightTexto.js';
import { Ledger } from '../ui/Ledger.js';
import { useMovimento } from '../ui/useMovimento.js';

function Variacao({ percentual, direcao }: { percentual: number; direcao: 'up' | 'down' }) {
  const Icone = direcao === 'up' ? ArrowUp : ArrowDown;
  return (
    <span class={`delta ${direcao}`}>
      <Icone class="icon" strokeWidth={2.25} aria-hidden="true" />
      {t(direcao === 'up' ? 'indicadores.aMaisQue' : 'indicadores.aMenosQue', { p: percentual })}
    </span>
  );
}

/**
 * CA05.6 — valor que conta até o final (anime.js). O final legível por leitor
 * de tela fica no `.sr-only`; o número animado é `aria-hidden`. O texto final
 * já vem renderizado (pintado de imediato, LCP); o "from" é posto pelo JS
 * antes da pintura. Mudou o valor (filtro, lançamento) → conta do anterior.
 */
function Contador({ centavos, atrasoMs = 0 }: { centavos: number; atrasoMs?: number }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const anteriorRef = useRef(0);
  const lang = idioma.value;
  const texto = formatarMoeda(centavos, lang);
  useMovimento(() => {
    const el = numRef.current;
    const de = anteriorRef.current;
    anteriorRef.current = centavos;
    return el ? contar(el, de, centavos, (c) => formatarMoeda(c, lang), atrasoMs) : NADA;
  }, [centavos, lang]);
  return (
    <>
      <span class="sr-only">{texto}</span>
      <span ref={numRef} aria-hidden="true">
        {texto}
      </span>
    </>
  );
}

/** Desenhos que acompanham uma seção quando ela entra na tela (gráficos). */
function desenharSecao(secao: HTMLElement): Handle {
  if (secao.matches('.cashflow')) {
    return crescerBarras(
      Array.from(secao.querySelectorAll<SVGElement>('rect.bar-in, rect.bar-out')),
    );
  }
  if (secao.matches('.projection')) {
    return juntar([
      desenharLinha(secao.querySelector<SVGPathElement>('path.real')),
      riscarALapis(secao.querySelector<SVGPathElement>('path.proj'), DURACOES.linhaReal),
    ]);
  }
  return NADA;
}

/** CA08.5 — há lançamentos no app, mas o filtro atual (período + categoria) não deixa nenhum. Reaproveitado pelo livro-caixa (T11). */
export function FiltroVazio() {
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

const LIMITE_LEDGER_PREVIEW = 4;

function ConteudoDashboard() {
  const mes = mesReferencia.value;
  const kpis = kpisAtuais.value;
  const novoBtnRef = useRef<HTMLButtonElement>(null);
  const raizRef = useRef<HTMLDivElement>(null);
  const sublinhadoRef = useRef<SVGSVGElement>(null);
  const marcaRef = useRef<HTMLSpanElement>(null);
  const primeiroFiltroRef = useRef(true);
  const filtrosAtuais = filtros.value;
  const chaveInsightPrincipal = insightsAtuais.value.insights[1]?.chave ?? '';

  // CA14.2 — seções surgem no scroll (GSAP + ScrollTrigger lazy); os gráficos
  // se desenham quando a seção entra (CA06.5). Manchete e indicadores ficam
  // de fora: são o LCP e já nascem pintados.
  useMovimento(() => {
    const raiz = raizRef.current;
    if (!raiz) return NADA;
    const secoes = Array.from(raiz.querySelectorAll<HTMLElement>(':scope > section')).filter(
      (s) => !s.matches('.hero-kpi, .side-kpis'),
    );
    const desenhos: Handle[] = [];
    const revelar = revelarSecoes(secoes, (secao) => desenhos.push(desenharSecao(secao)));
    return { kill: () => juntar([revelar, ...desenhos]).kill() };
  }, []);

  // UX §7 — filtro aplicado: crossfade dos blocos (não no 1º render)
  useMovimento(() => {
    if (primeiroFiltroRef.current) {
      primeiroFiltroRef.current = false;
      return NADA;
    }
    const raiz = raizRef.current;
    return raiz ? crossfade(Array.from(raiz.querySelectorAll(':scope > section'))) : NADA;
  }, [filtrosAtuais]);

  // sublinhado à mão depois do contador; marca-texto no insight principal (CA07.3)
  useMovimento(
    () =>
      juntar([
        rabiscar(Array.from(sublinhadoRef.current?.querySelectorAll('path') ?? [])),
        marcaTexto(marcaRef.current),
      ]),
    [mes, chaveInsightPrincipal],
  );

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
    <div class="dash" ref={raizRef}>
      <section class="hero-kpi" aria-labelledby="titulo-mes">
        {/* alvo do foco depois de virar a página (CA14.2) */}
        <h1 class="kicker" id="titulo-mes" tabIndex={-1}>
          {t('indicadores.tituloMes', { mes: formatarMesPorExtenso(mes, idioma.value) })}
        </h1>
        <p class={`big${kpis.sobrouCentavos < 0 ? ' neg' : ''}`}>
          <Contador centavos={kpis.sobrouCentavos} />
          <svg
            ref={sublinhadoRef}
            class="underline"
            viewBox="0 0 300 22"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M4 9 C 60 3, 140 13, 210 6 S 282 9, 296 4" />
            <path d="M28 17 C 90 12, 170 20, 262 13" />
          </svg>
        </p>
        {manchete !== undefined && (
          <p class="headline">{textoInsight(manchete, idioma.value, categorias.value)}</p>
        )}
      </section>

      <section class="side-kpis">
        <div class="row in">
          <span class="t">{t('indicadores.quantoEntrou')}</span>
          <span class="v">
            <Contador centavos={kpis.entrouCentavos} atrasoMs={DURACOES.contadorAtrasoSecundario} />
          </span>
          {variacaoEntrou !== null && (
            <Variacao
              percentual={Math.abs(variacaoEntrou)}
              direcao={variacaoEntrou >= 0 ? 'up' : 'down'}
            />
          )}
        </div>
        <div class="row out">
          <span class="t">{t('indicadores.quantoSaiu')}</span>
          <span class="v">
            <Contador centavos={kpis.saiuCentavos} atrasoMs={DURACOES.contadorAtrasoSecundario} />
          </span>
          {variacaoSaiu !== null && (
            <Variacao
              percentual={Math.abs(variacaoSaiu)}
              direcao={variacaoSaiu >= 0 ? 'down' : 'up'}
            />
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
                {i === 0 ? (
                  <span class="hl" ref={marcaRef}>
                    {textoInsight(insight, idioma.value, categorias.value)}
                  </span>
                ) : (
                  textoInsight(insight, idioma.value, categorias.value)
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <FluxoCaixa />

      <section class="categories">
        <div class="sec-title">
          <h2>{t('secoes.paraOndeFoi')}</h2>
          <span class="hand">
            {t('secoes.saidasDoMes', { mes: formatarMesPorExtenso(mes, idioma.value) })}
          </span>
        </div>
        <ul class="cat-list">
          {categoriasDoMesAtual.value.map((c) => {
            const nome =
              categorias.value.find((cat) => cat.id === c.categoria)?.nome ?? c.categoria;
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

      <section class="ledger">
        <div class="sec-title">
          <h2>{t('secoes.livroCaixa')}</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              class="btn btn-ink"
              ref={novoBtnRef}
              onClick={abrirNovoLancamento}
            >
              <Plus class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
              {t('secoes.novoLancamento')}
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => navegar('/livro-caixa')}>
              {t('secoes.verTodos', { n: lancamentosDoMesAtual.value.length })}
            </button>
          </div>
        </div>
        <Ledger
          lancamentos={lancamentosDoMesAtual.value.slice(0, LIMITE_LEDGER_PREVIEW)}
          categorias={categorias.value}
          novoBtnRef={novoBtnRef}
          legendaSrOnly={t('secoes.saidasDoMes', { mes: formatarMesPorExtenso(mes, idioma.value) })}
        />
      </section>
    </div>
  );
}
