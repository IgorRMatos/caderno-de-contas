import { BookOpen, Upload } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { navegar } from '../router.js';
import { lancamentos } from '../state/signals.js';

/** CA03.4 — deixa claro que são dados de exemplo, com ação para trocar pela planilha real. */
export function BannerExemplo() {
  const doExemplo = lancamentos.value.filter((l) => l.origem === 'exemplo');
  if (doExemplo.length === 0) return null;

  const meses = new Set(doExemplo.map((l) => l.data.slice(0, 7))).size;

  return (
    <div class="sample-banner" role="note">
      <p>
        <BookOpen class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />{' '}
        {t('banner.texto', { nome: 'Padaria Dona Lurdes', n: meses })}
      </p>
      <button
        type="button"
        class="btn btn-line"
        style={{ minHeight: '40px' }}
        onClick={() => navegar('/')}
      >
        <Upload class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
        {t('banner.trocar')}
      </button>
    </div>
  );
}
