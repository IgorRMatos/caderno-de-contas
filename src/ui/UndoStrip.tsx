import { Undo2 } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { formatarMoeda } from '../domain/money.js';
import { t } from '../i18n/index.js';
import { confirmarExclusao, desfazerExclusao, exclusaoPendente } from '../state/exclusao.js';
import { idioma } from '../state/signals.js';

const DURACAO_MS = 6000;

export interface UndoStripProps {
  /** Devolve o foco à lixeira do item restaurado. */
  aoDesfazer: (idRestaurado: string) => void;
  /** Chamado só quando o foco estava DENTRO da faixa no momento em que o tempo expirou (D17). */
  aoExpirarComFoco: () => void;
}

/**
 * D17 — faixa inline de "Desfazer" (não é toast): 6s, pausa em hover/foco
 * (mesmo mecanismo de `Toasts.tsx`/D16), some ao expirar ou ao desfazer.
 */
export function UndoStrip({ aoDesfazer, aoExpirarComFoco }: UndoStripProps) {
  const pendente = exclusaoPendente.value;
  const restanteRef = useRef(DURACAO_MS);
  const inicioRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const raizRef = useRef<HTMLDivElement>(null);
  const desfazerBtnRef = useRef<HTMLButtonElement>(null);
  const [pausado, setPausado] = useState(false);

  function iniciarTimer(ms: number): void {
    inicioRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      const focoEstavaNaFaixa = raizRef.current?.contains(document.activeElement) ?? false;
      confirmarExclusao();
      if (focoEstavaNaFaixa) aoExpirarComFoco();
    }, ms);
  }

  const idPendente = pendente?.lancamento.id ?? null;
  useEffect(() => {
    if (idPendente === null) return;
    restanteRef.current = DURACAO_MS;
    setPausado(false);
    iniciarTimer(DURACAO_MS);
    desfazerBtnRef.current?.focus();
    return () => clearTimeout(timerRef.current);
  }, [idPendente]);

  function pausar(): void {
    if (pausado) return;
    clearTimeout(timerRef.current);
    restanteRef.current = Math.max(0, restanteRef.current - (Date.now() - inicioRef.current));
    setPausado(true);
  }

  function retomar(): void {
    if (!pausado) return;
    setPausado(false);
    iniciarTimer(restanteRef.current);
  }

  if (pendente === null) return null;

  function clicarDesfazer(): void {
    clearTimeout(timerRef.current);
    const idRestaurado = desfazerExclusao();
    if (idRestaurado !== null) aoDesfazer(idRestaurado);
  }

  return (
    <div
      class="undo-strip"
      role="status"
      ref={raizRef}
      onPointerEnter={pausar}
      onPointerDown={pausar}
      onPointerLeave={retomar}
      onPointerUp={retomar}
      onFocusIn={pausar}
      onFocusOut={retomar}
    >
      <p>
        {t('exclusao.faixa', {
          descricao: pendente.lancamento.descricao || t('lancamento.descricao'),
          valor: formatarMoeda(pendente.lancamento.valorCentavos, idioma.value),
        })}
      </p>
      <button type="button" class="btn btn-line" ref={desfazerBtnRef} onClick={clicarDesfazer}>
        <Undo2 class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
        {t('exclusao.desfazer')}
      </button>
    </div>
  );
}
