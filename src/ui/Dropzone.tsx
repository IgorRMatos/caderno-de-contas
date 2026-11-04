import { LoaderCircle, Upload } from 'lucide-preact';
import { useEffect, useRef } from 'preact/hooks';
import { t } from '../i18n/index.js';
import {
  estadoDropzone,
  linhasLendo,
  nomeArquivoLendo,
  processarArquivo,
} from '../state/importacao.js';

/**
 * UX §4.2 — estados parado/arrastando/lendo/erro. "Arrastar um arquivo em
 * qualquer lugar da janela ativa a dropzone" (`dragenter` no `document`).
 */
export function Dropzone() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let profundidade = 0;

    function aoEntrar(ev: DragEvent): void {
      if (!ev.dataTransfer?.types.includes('Files')) return;
      profundidade++;
      if (estadoDropzone.value === 'parado') estadoDropzone.value = 'arrastando';
    }
    function aoSair(): void {
      profundidade = Math.max(0, profundidade - 1);
      if (profundidade === 0 && estadoDropzone.value === 'arrastando')
        estadoDropzone.value = 'parado';
    }
    function aoSoltarNaJanela(): void {
      profundidade = 0;
    }
    function aoArrastarSobre(ev: DragEvent): void {
      ev.preventDefault();
    }

    document.addEventListener('dragenter', aoEntrar);
    document.addEventListener('dragleave', aoSair);
    document.addEventListener('drop', aoSoltarNaJanela);
    document.addEventListener('dragover', aoArrastarSobre);
    return () => {
      document.removeEventListener('dragenter', aoEntrar);
      document.removeEventListener('dragleave', aoSair);
      document.removeEventListener('drop', aoSoltarNaJanela);
      document.removeEventListener('dragover', aoArrastarSobre);
    };
  }, []);

  function aoSoltarNaZona(ev: DragEvent): void {
    ev.preventDefault();
    const arquivo = ev.dataTransfer?.files?.[0];
    if (arquivo) void processarArquivo(arquivo);
  }

  function aoEscolherArquivo(ev: Event): void {
    const arquivo = (ev.target as HTMLInputElement).files?.[0];
    if (arquivo) void processarArquivo(arquivo);
    if (inputRef.current) inputRef.current.value = '';
  }

  const estado = estadoDropzone.value;
  const classeEstado =
    estado === 'arrastando'
      ? 'is-over'
      : estado === 'lendo'
        ? 'is-loading'
        : estado === 'erro'
          ? 'is-error'
          : '';

  return (
    <div
      class={`dropzone ${classeEstado}`.trim()}
      onDragOver={(ev) => ev.preventDefault()}
      onDrop={aoSoltarNaZona}
      aria-busy={estado === 'lendo'}
    >
      {estado === 'lendo' ? (
        <>
          <LoaderCircle class="icon" strokeWidth={1.75} aria-hidden="true" />
          <p>{t('dropzone.lendo')}</p>
          <p class="formats">
            {t('dropzone.lendoDetalhe', { nome: nomeArquivoLendo.value, n: linhasLendo.value })}
          </p>
        </>
      ) : estado === 'erro' ? (
        <>
          <Upload class="icon" strokeWidth={1.75} aria-hidden="true" />
          <h2>{t('dropzone.ilegivelTitulo')}</h2>
          <p class="formats">{t('dropzone.ilegivelApoio')}</p>
        </>
      ) : estado === 'arrastando' ? (
        <>
          <Upload class="icon" strokeWidth={1.75} aria-hidden="true" />
          <p>{t('dropzone.podeSoltar')}</p>
        </>
      ) : (
        <>
          <Upload class="icon" strokeWidth={1.75} aria-hidden="true" />
          <h2>{t('dropzone.titulo')}</h2>
          <p class="formats">{t('dropzone.ou')}</p>
        </>
      )}

      <button type="button" class="btn btn-line" onClick={() => inputRef.current?.click()}>
        {estado === 'erro' ? t('dropzone.tentarOutro') : t('dropzone.escolherArquivo')}
      </button>
      <p class="formats">{t('dropzone.formatos')}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        class="sr-only"
        onChange={aoEscolherArquivo}
      />
    </div>
  );
}
