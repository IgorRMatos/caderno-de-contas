import type { ComponentChildren, RefObject } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { abrirDialogo, type Handle } from '../motion/index.js';

export interface DialogProps {
  aberto: boolean;
  titulo: string;
  tituloId: string;
  /** id do texto que explica o diálogo (`aria-describedby`), obrigatório na prática para `alertdialog`. */
  descricaoId?: string;
  /** `alertdialog` para confirmações destrutivas (ex.: apagar dados). */
  tipo?: 'dialog' | 'alertdialog';
  /** `drawer` — painel lateral de 440px (UX §4.6: "Anotar no caderno"/"Corrigir lançamento"), em vez da folha centralizada padrão. */
  variante?: 'dialog' | 'drawer';
  onFechar: () => void;
  /** Elemento a focar ao abrir (D15: foco inicial configurável). Padrão: o próprio `<dialog>`. */
  focoInicialRef?: RefObject<HTMLElement>;
  children: ComponentChildren;
}

/**
 * D15 — componente único de diálogo: `<dialog>` nativo com `showModal()`
 * (foco preso e Esc nativos), `role` configurável, devolve o foco à origem
 * ao fechar. Nada de `window.confirm/alert/prompt` (CA01.11/CA04.2/CA12.3).
 */
export function Dialog({
  aberto,
  titulo,
  tituloId,
  descricaoId,
  tipo = 'dialog',
  variante = 'dialog',
  onFechar,
  focoInicialRef,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const origemRef = useRef<HTMLElement | null>(null);
  const animRef = useRef<Handle | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (aberto && !el.open) {
      origemRef.current = document.activeElement as HTMLElement | null;
      el.showModal();
      (focoInicialRef?.current ?? el).focus();
      // UX §7 — painel desliza (x 100% → 0), diálogo cresce (.96 → 1) + fade
      animRef.current = abrirDialogo(el, variante);
    } else if (!aberto && el.open) {
      animRef.current?.kill();
      el.close();
    }
  }, [aberto, focoInicialRef]);

  function aoFecharNativo() {
    onFechar();
    origemRef.current?.focus();
  }

  return (
    <dialog
      ref={dialogRef}
      class={variante}
      role={tipo}
      aria-labelledby={tituloId}
      aria-describedby={descricaoId}
      onClose={aoFecharNativo}
      onCancel={aoFecharNativo}
    >
      <h2 id={tituloId}>{titulo}</h2>
      {children}
    </dialog>
  );
}
