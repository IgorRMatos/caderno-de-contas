import { ArrowRight, Download, Lock } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { carregarExemplo } from '../state/importacao.js';
import { Dropzone } from '../ui/Dropzone.js';

/**
 * UX §4.1 — tela "antes do upload": proposta em uma frase, duas portas (ver
 * exemplo / dropzone), ficha "assim já funciona" e privacidade junto ao upload.
 * CA03.1 (CTA de exemplo visível sem rolar em 360×640) é responsabilidade do
 * CSS (`.intro` em `screens.css`, já ajustado para mobile no T0).
 */
export function Inicio() {
  return (
    <div class="sheet with-margin intro">
      <p class="margin-note">{t('inicio.notaMargem1')}</p>
      <div>
        <h1>{t('inicio.h1')}</h1>
        <p class="lead">{t('inicio.apoio')}</p>
        <div class="cta">
          <button type="button" class="btn btn-ink" onClick={carregarExemplo}>
            {t('inicio.ctaExemplo')}
            <ArrowRight class="icon" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <a class="btn btn-ghost" href="/exemplo.csv" download>
            <Download class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
            {t('inicio.ctaModelo')}
          </a>
        </div>
        <p class="privacy-tag">
          <Lock class="icon" strokeWidth={1.75} aria-hidden="true" />
          <span>{t('privacidade.curta')}</span>
        </p>
      </div>
      <div class="aside-note">
        <Dropzone />
        <table class="mini-ledger">
          <caption>{t('inicio.assimJaFunciona')}</caption>
          <thead>
            <tr>
              <th>{t('mapeamento.campoData')}</th>
              <th>{t('mapeamento.campoDescricao')}</th>
              <th>{t('mapeamento.campoValor')}</th>
              <th>{t('mapeamento.campoTipo')}</th>
              <th>{t('mapeamento.campoCategoria')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>02/10/2026</td>
              <td>Vendas do balcão</td>
              <td class="v">1.240,00</td>
              <td>{t('lancamento.entrada')}</td>
              <td>Vendas</td>
            </tr>
            <tr>
              <td>03/10/2026</td>
              <td>Farinha, Moinho Sul</td>
              <td class="v">450,00</td>
              <td>{t('lancamento.saida')}</td>
              <td>Fornecedores</td>
            </tr>
            <tr>
              <td>05/10/2026</td>
              <td>Conta de luz</td>
              <td class="v">380,00</td>
              <td>{t('lancamento.saida')}</td>
              <td>Energia e gás</td>
            </tr>
          </tbody>
        </table>
        <p class="hand" style={{ marginTop: '8px' }}>
          {t('inicio.notaMargem2')}
        </p>
      </div>
    </div>
  );
}
