import type { ComponentChildren, RefObject } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

export interface DialogProps {
  aberto: boolean;
  titulo: string;
  tituloId: string;
  /** `alertdialog` para confirmações destrutivas (ex.: apagar dados). */
  tipo?: 'dialog' | 'alertdialog';
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
  tipo = 'dialog',
  onFechar,
  focoInicialRef,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const origemRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (aberto && !el.open) {
      origemRef.current = document.activeElement as HTMLElement | null;
      el.showModal();
      (focoInicialRef?.current ?? el).focus();
    } else if (!aberto && el.open) {
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
      class="dialog"
      role={tipo}
      aria-labelledby={tituloId}
      onClose={aoFecharNativo}
      onCancel={aoFecharNativo}
    >
      <h2 id={tituloId}>{titulo}</h2>
      {children}
    </dialog>
  );
}
