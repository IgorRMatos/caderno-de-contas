import { CircleCheck, CircleX, TriangleAlert, X } from 'lucide-preact';
import type { LucideIcon } from 'lucide-preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { t } from '../i18n/index.js';
import {
  entrarToast,
  sairToast,
  toastBarra,
  type Handle,
  type HandleBarra,
} from '../motion/index.js';
import { removerToast, toasts, type Toast, type TipoToast } from '../state/toasts.js';

const ICONE: Record<TipoToast, LucideIcon> = {
  ok: CircleCheck,
  warn: TriangleAlert,
  err: CircleX,
};

/** CA11.7 — role="status" para sucesso/atenção, role="alert" para erro. */
const PAPEL: Record<TipoToast, 'status' | 'alert'> = { ok: 'status', warn: 'status', err: 'alert' };

function ItemToast({ toast }: { toast: Toast }) {
  const elRef = useRef<HTMLDivElement>(null);
  const barraRef = useRef<HTMLSpanElement>(null);
  const restanteRef = useRef(toast.duracaoMs);
  const inicioRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const barraAnimRef = useRef<HandleBarra | null>(null);
  const saidaRef = useRef<Handle | null>(null);
  const pausadoRef = useRef(false);

  /** D16 — sai com animação (GSAP) e só então some da fila. */
  function fechar() {
    if (saidaRef.current) return;
    clearTimeout(timerRef.current);
    const el = elRef.current;
    if (!el) {
      removerToast(toast.id);
      return;
    }
    saidaRef.current = sairToast(el, () => removerToast(toast.id));
  }

  function iniciarTimer(ms: number) {
    inicioRef.current = Date.now();
    timerRef.current = setTimeout(fechar, ms);
  }

  useLayoutEffect(() => {
    const entrada = elRef.current ? entrarToast(elRef.current) : null;
    // a barra é timer (informação de tempo): roda mesmo com reduced-motion
    if (barraRef.current) barraAnimRef.current = toastBarra(barraRef.current, toast.duracaoMs);
    iniciarTimer(restanteRef.current);
    return () => {
      clearTimeout(timerRef.current);
      entrada?.kill();
      barraAnimRef.current?.kill();
      saidaRef.current?.kill();
    };
  }, []);

  function pausar() {
    if (pausadoRef.current || saidaRef.current) return;
    pausadoRef.current = true;
    clearTimeout(timerRef.current);
    restanteRef.current = Math.max(0, restanteRef.current - (Date.now() - inicioRef.current));
    barraAnimRef.current?.pausar();
  }

  function retomar() {
    if (!pausadoRef.current || saidaRef.current) return;
    pausadoRef.current = false;
    barraAnimRef.current?.retomar();
    iniciarTimer(restanteRef.current);
  }

  const Icone = ICONE[toast.tipo];

  return (
    <div
      ref={elRef}
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
      <button type="button" class="icon-btn" aria-label={t('toasts.fecharAviso')} onClick={fechar}>
        <X class="icon icon-sm" strokeWidth={1.75} aria-hidden="true" />
      </button>
      <span ref={barraRef} class="bar" aria-hidden="true" />
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
