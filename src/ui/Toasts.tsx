import { CircleCheck, CircleX, TriangleAlert, X } from 'lucide-preact';
import type { LucideIcon } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n/index.js';
import { removerToast, toasts, type Toast, type TipoToast } from '../state/toasts.js';

const ICONE: Record<TipoToast, LucideIcon> = {
  ok: CircleCheck,
  warn: TriangleAlert,
  err: CircleX,
};

/** CA11.7 — role="status" para sucesso/atenção, role="alert" para erro. */
const PAPEL: Record<TipoToast, 'status' | 'alert'> = { ok: 'status', warn: 'status', err: 'alert' };

function ItemToast({ toast }: { toast: Toast }) {
  const restanteRef = useRef(toast.duracaoMs);
  const inicioRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [pausado, setPausado] = useState(false);

  function iniciarTimer(ms: number) {
    inicioRef.current = Date.now();
    timerRef.current = setTimeout(() => removerToast(toast.id), ms);
  }

  useEffect(() => {
    iniciarTimer(restanteRef.current);
    return () => clearTimeout(timerRef.current);
  }, []);

  function pausar() {
    if (pausado) return;
    clearTimeout(timerRef.current);
    restanteRef.current = Math.max(0, restanteRef.current - (Date.now() - inicioRef.current));
    setPausado(true);
  }

  function retomar() {
    if (!pausado) return;
    setPausado(false);
    iniciarTimer(restanteRef.current);
  }

  const Icone = ICONE[toast.tipo];

  return (
    <div
      class={`toast ${toast.tipo}`}
      role={PAPEL[toast.tipo]}
      onPointerEnter={pausar}
      onPointerDown={pausar}
      onPointerLeave={retomar}
      onPointerUp={retomar}
      onFocusIn={pausar}
      onFocusOut={retomar}
    >
      <Icone class="icon" strokeWidth={1.75} aria-hidden="true" />
      <p>
        {toast.titulo !== undefined && <strong>{toast.titulo}</strong>}
        {toast.mensagem}
      </p>
      <button
        type="button"
        class="icon-btn"
        aria-label={t('toasts.fecharAviso')}
        onClick={() => removerToast(toast.id)}
      >
        <X class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
      </button>
      <span
        class={`bar${pausado ? ' is-paused' : ''}`}
        style={{ '--toast-duracao': `${toast.duracaoMs}ms` }}
        aria-hidden="true"
      />
    </div>
  );
}

/** D16 — fila de toasts post-it; desktop abaixo do cabeçalho, mobile no topo (CSS). */
export function Toasts() {
  return (
    <div class="toasts">
      {toasts.value.map((toast) => (
        <ItemToast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
