import type { ComponentType } from 'preact';
import { rotaAtual, type Rota } from './router.js';
import { Dashboard } from './screens/Dashboard.js';
import { Inicio } from './screens/Inicio.js';
import { LivroCaixa } from './screens/LivroCaixa.js';
import { Mapeamento } from './screens/Mapeamento.js';
import { SeusDados } from './screens/SeusDados.js';
import { DialogoSomarSubstituir } from './ui/DialogoSomarSubstituir.js';
import { Footer } from './ui/Footer.js';
import { Header } from './ui/Header.js';
import { LiveRegion } from './ui/LiveRegion.js';
import { PainelLancamento } from './ui/PainelLancamento.js';
import { Toasts } from './ui/Toasts.js';

const TELAS: Record<Rota, ComponentType> = {
  '/': Inicio,
  '/mapeamento': Mapeamento,
  '/caderno': Dashboard,
  '/livro-caixa': LivroCaixa,
  '/seus-dados': SeusDados,
};

/** T6 — shell do app: cabeçalho, rota atual, rodapé, toasts e live region. */
export function App() {
  const Tela = TELAS[rotaAtual.value];
  return (
    <div class="page">
      <Header />
      <main id="conteudo">
        <Tela />
      </main>
      <Footer />
      <Toasts />
      <LiveRegion />
      <DialogoSomarSubstituir />
      <PainelLancamento />
    </div>
  );
}
