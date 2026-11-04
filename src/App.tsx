import type { ComponentType } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from './i18n/index.js';
import { virarPagina, type Handle } from './motion/index.js';
import { rotaAtual, type Rota } from './router.js';
import { anunciar } from './state/anuncio.js';
import { temDados } from './state/derivados.js';
import { Dashboard } from './screens/Dashboard.js';
import { Inicio } from './screens/Inicio.js';
import { LivroCaixa } from './screens/LivroCaixa.js';
import { Mapeamento } from './screens/Mapeamento.js';
import { SeusDados } from './screens/SeusDados.js';
import { DialogoApagar } from './ui/DialogoApagar.js';
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

/** Rotas "antes do upload": sair delas para o dashboard vira a página (CA14.2). */
const ROTAS_PRE_UPLOAD: readonly Rota[] = ['/', '/mapeamento'];

function focarTituloDoMes(): void {
  document.getElementById('titulo-mes')?.focus();
}

/**
 * T6 — shell do app: cabeçalho, rota atual, rodapé, toasts e live region.
 * T13 — a tela EXIBIDA segue a rota com um passo de animação: de uma rota
 * pré-upload para `/caderno`, a folha vira (GSAP) e o conteúdo troca no meio
 * da virada. Ao fim (ou na hora, com reduced-motion), o foco vai para o
 * título do mês e a live region anuncia "Seu caderno está pronto".
 */
export function App() {
  const alvo = rotaAtual.value;
  const [exibida, setExibida] = useState<Rota>(alvo);
  const mainRef = useRef<HTMLElement>(null);
  const viradaRef = useRef<Handle | null>(null);
  const exibidaRef = useRef(exibida);
  exibidaRef.current = exibida;

  useLayoutEffect(() => {
    // uma virada em andamento termina na hora (troca de tela) antes da próxima
    viradaRef.current?.kill();
    viradaRef.current = null;
    if (alvo === exibidaRef.current) return;

    function exibir(rota: Rota) {
      // o ref anda junto (síncrono): um kill() seguido de nova rota no mesmo
      // tick compara com a tela que REALMENTE ficou, não com o render velho
      exibidaRef.current = rota;
      setExibida(rota);
    }

    const folha = mainRef.current;
    const viraPagina =
      folha !== null &&
      alvo === '/caderno' &&
      temDados.value && // sem dados a guarda de rota manda de volta ao início: não vira
      ROTAS_PRE_UPLOAD.includes(exibidaRef.current);
    if (!viraPagina) {
      exibir(alvo);
      return;
    }
    viradaRef.current = virarPagina(
      folha,
      () => exibir(alvo),
      () => {
        viradaRef.current = null;
        if (rotaAtual.value !== '/caderno') return; // saiu no meio: não anuncia nem rouba o foco
        // o Preact renderiza a troca numa microtask; o foco vem depois dela
        setTimeout(focarTituloDoMes, 0);
        anunciar(t('anuncios.cadernoPronto'));
      },
    );
  }, [alvo]);

  const Tela = TELAS[exibida];
  return (
    <div class="page">
      <Header />
      <main id="conteudo" ref={mainRef}>
        <Tela />
      </main>
      <Footer />
      <Toasts />
      <LiveRegion />
      <DialogoSomarSubstituir />
      <DialogoApagar />
      <PainelLancamento />
    </div>
  );
}
