import { Calendar, ChevronDown, Filter } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { formatarMesPorExtenso } from '../domain/dates.js';
import { mesesComDados } from '../domain/filters.js';
import type { TipoPeriodo } from '../domain/types.js';
import { t } from '../i18n/index.js';
import { mesReferencia } from '../state/derivados.js';
import { categorias, filtros, idioma, lancamentos } from '../state/signals.js';

const ATALHOS: ReadonlyArray<{ tipo: TipoPeriodo; chave: string }> = [
  { tipo: 'ultimo-mes', chave: 'filtros.ultimoMes' },
  { tipo: 'ultimos-3', chave: 'filtros.ultimos3' },
  { tipo: 'este-ano', chave: 'filtros.esteAno' },
  { tipo: 'tudo', chave: 'filtros.tudo' },
];

function SeletorMes() {
  const [aberto, setAberto] = useState(false);
  const meses = mesesComDados(lancamentos.value);
  const atual = mesReferencia.value;

  return (
    <div class="dropdown">
      <button type="button" class="dd" aria-haspopup="listbox" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
        <Calendar class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
        {atual !== null ? formatarMesPorExtenso(atual, idioma.value) : t('filtros.periodo')}
        <ChevronDown class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {aberto && (
        <ul class="dropdown-painel" role="listbox" aria-label={t('filtros.periodo')}>
          {meses.map((m) => (
            <li
              key={m}
              class="opcao"
              role="option"
              aria-selected={filtros.value.periodo.tipo === 'mes' && filtros.value.periodo.de === m}
              onClick={() => {
                filtros.value = { ...filtros.value, periodo: { tipo: 'mes', de: m } };
                setAberto(false);
              }}
            >
              {formatarMesPorExtenso(m, idioma.value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeletorCategorias() {
  const [aberto, setAberto] = useState(false);
  const [selecao, setSelecao] = useState<string[]>(filtros.value.categorias);

  function abrir(): void {
    setSelecao(filtros.value.categorias);
    setAberto(true);
  }

  function alternar(id: string): void {
    setSelecao((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function aplicar(): void {
    filtros.value = { ...filtros.value, categorias: selecao };
    setAberto(false);
  }

  const rotulo = filtros.value.categorias.length === 0 ? t('filtros.todas') : String(filtros.value.categorias.length);

  return (
    <div class="dropdown">
      <button type="button" class="dd" aria-haspopup="listbox" aria-expanded={aberto} onClick={() => (aberto ? setAberto(false) : abrir())}>
        <Filter class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
        {rotulo}
        <ChevronDown class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {aberto && (
        <div class="dropdown-painel">
          {categorias.value.map((c) => (
            <label class="opcao" key={c.id}>
              <input type="checkbox" checked={selecao.includes(c.id)} onChange={() => alternar(c.id)} />
              {c.nome}
            </label>
          ))}
          <button type="button" class="btn btn-ink" style={{ marginTop: 'var(--s2)', minHeight: '40px' }} onClick={aplicar}>
            {t('filtros.aplicar')}
          </button>
        </div>
      )}
    </div>
  );
}

/** CA08.1-CA08.5 — período + categoria, chips "Olhando:", Limpar, estado vazio é tratado por quem renderiza o conteúdo. */
export function Filtros() {
  const periodoAtual = filtros.value.periodo.tipo;
  const mesAtual = mesReferencia.value;
  const categoriasAtivas = filtros.value.categorias;

  function limpar(): void {
    filtros.value = { periodo: { tipo: 'ultimo-mes' }, categorias: [] };
  }

  function removerCategoria(id: string): void {
    filtros.value = { ...filtros.value, categorias: filtros.value.categorias.filter((c) => c !== id) };
  }

  const temFiltroAtivo = periodoAtual !== 'ultimo-mes' || categoriasAtivas.length > 0;

  return (
    <section class="filters" aria-label={t('filtros.periodo')}>
      <span class="label">{t('filtros.periodo')}</span>
      <SeletorMes />
      <div class="shortcuts" role="group" aria-label={t('filtros.periodo')}>
        {ATALHOS.map(({ tipo, chave }) => (
          <button
            key={tipo}
            type="button"
            class={`chip${periodoAtual === tipo ? ' on' : ''}`}
            aria-pressed={periodoAtual === tipo}
            onClick={() => (filtros.value = { ...filtros.value, periodo: { tipo } })}
          >
            {t(chave)}
          </button>
        ))}
      </div>
      <span class="label">{t('filtros.categorias')}</span>
      <SeletorCategorias />

      {temFiltroAtivo && (
        <div class="active-row">
          <span>{t('filtros.olhando')}</span>
          {mesAtual !== null && periodoAtual !== 'tudo' && (
            <span class="chip">{formatarMesPorExtenso(mesAtual, idioma.value)}</span>
          )}
          {categoriasAtivas.map((id) => {
            const nome = categorias.value.find((c) => c.id === id)?.nome ?? id;
            return (
              <span class="chip" key={id}>
                {nome}
                <button type="button" aria-label={t('filtros.removerFiltro', { nome })} onClick={() => removerCategoria(id)}>
                  ×
                </button>
              </span>
            );
          })}
          <button type="button" class="btn btn-ghost" style={{ minHeight: '36px' }} onClick={limpar}>
            {t('filtros.limpar')}
          </button>
        </div>
      )}
    </section>
  );
}
