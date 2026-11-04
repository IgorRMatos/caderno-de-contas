import { useRef, useState } from 'preact/hooks';
import type { CampoPlanilha } from '../domain/import/headers.js';
import { t } from '../i18n/index.js';
import {
  cancelarMapeamento,
  confirmarMapeamento,
  mapeamentoPendente,
} from '../state/importacao.js';

const CAMPOS: readonly CampoPlanilha[] = ['data', 'descricao', 'valor', 'tipo', 'categoria'];
const OBRIGATORIOS = new Set<CampoPlanilha>(['data', 'valor']);

function chaveRotulo(campo: CampoPlanilha): string {
  return `mapeamento.campo${campo.charAt(0).toUpperCase()}${campo.slice(1)}`;
}

/** CA02.1-CA02.4 — mapeamento manual de colunas, prévia ao vivo, foco no 1º obrigatório vazio. */
export function Mapeamento() {
  const relatorio = mapeamentoPendente.value;
  const [mapa, setMapa] = useState<Partial<Record<CampoPlanilha, number>>>(() => ({
    ...relatorio?.palpite,
  }));
  const [erro, setErro] = useState<string | null>(null);
  const refsPorCampo = useRef<Partial<Record<CampoPlanilha, HTMLSelectElement>>>({});

  if (relatorio === null) {
    return null;
  }

  const faltamObrigatorios = mapa.data === undefined || mapa.valor === undefined;

  function aoMudarCampo(campo: CampoPlanilha, valorBruto: string): void {
    setMapa((m) => {
      const novo = { ...m };
      if (valorBruto === '') delete novo[campo];
      else novo[campo] = Number(valorBruto);
      return novo;
    });
    setErro(null);
  }

  function aoSubmeter(ev: Event): void {
    ev.preventDefault();
    if (mapa.data === undefined) {
      setErro(t('mapeamento.faltaCampo', { campo: t('mapeamento.campoData') }));
      refsPorCampo.current.data?.focus();
      return;
    }
    if (mapa.valor === undefined) {
      setErro(t('mapeamento.faltaCampo', { campo: t('mapeamento.campoValor') }));
      refsPorCampo.current.valor?.focus();
      return;
    }
    confirmarMapeamento(mapa);
  }

  return (
    <section class="card">
      <h2>{t('mapeamento.titulo')}</h2>
      <p>{t('mapeamento.apoio')}</p>
      <form onSubmit={aoSubmeter}>
        <div class="map-grid">
          {CAMPOS.map((campo) => (
            <div class="field" key={campo}>
              <label for={`map-${campo}`}>
                {t(chaveRotulo(campo))}
                {OBRIGATORIOS.has(campo) && (
                  <span class="req" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
              <select
                id={`map-${campo}`}
                class="select"
                ref={(el) => {
                  if (el) refsPorCampo.current[campo] = el;
                }}
                value={mapa[campo] ?? ''}
                onChange={(ev) => aoMudarCampo(campo, (ev.target as HTMLSelectElement).value)}
              >
                <option value="">{t('mapeamento.naoTenhoColuna')}</option>
                {relatorio.colunas.map((coluna, i) => (
                  <option key={i} value={i}>
                    {coluna}
                  </option>
                ))}
              </select>
              {relatorio.palpite[campo] !== undefined &&
                relatorio.palpite[campo] === mapa[campo] && (
                  <p class="guess">✓ {t('mapeamento.palpiteMeu')}</p>
                )}
            </div>
          ))}
        </div>

        {erro !== null && (
          <div class="missing">
            <p role="alert">{erro}</p>
          </div>
        )}

        <div class="preview-wrap">
          <table class="preview">
            <thead>
              <tr>
                {relatorio.colunas.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relatorio.previa5.map((linha, li) => (
                <tr key={li}>
                  {linha.map((celula, ci) => (
                    <td key={ci}>{String(celula)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button type="submit" class="btn btn-ink" aria-disabled={faltamObrigatorios}>
            {t('mapeamento.montar')}
          </button>
          <button type="button" class="btn btn-ghost" onClick={cancelarMapeamento}>
            {t('lancamento.cancelar')}
          </button>
        </div>
      </form>
    </section>
  );
}
