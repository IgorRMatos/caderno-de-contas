import { t } from '../i18n/index.js';
import { BannerExemplo } from '../ui/BannerExemplo.js';

/** T8: banner de dados de exemplo. O dashboard editorial de verdade chega no T9. */
export function Dashboard() {
  return (
    <>
      <BannerExemplo />
      <section class="card">
        <h2>{t('secoes.oQueNotei')}</h2>
      </section>
    </>
  );
}
