import { effect } from '@preact/signals';
import { render } from 'preact';
import { App } from './App.js';
import { carregarIdioma, t } from './i18n/index.js';
import { iniciarGuardaDeRotas } from './router.js';
import { idioma } from './state/signals.js';
import { iniciarPersistencia } from './state/persistencia.js';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/components.css';
import './styles/screens.css';

function aplicarIdiomaNoDocumento(): void {
  document.documentElement.lang = idioma.value;
  document.title = t('meta.titulo');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.descricao'));
}

async function iniciar(): Promise<void> {
  iniciarPersistencia();

  // garante o dicionário certo já carregado antes do 1º render (evita flash
  // em pt-BR quando o navegador/escolha salva aponta para es/en).
  await carregarIdioma(idioma.value);
  aplicarIdiomaNoDocumento();

  effect(() => {
    const alvo = idioma.value;
    void carregarIdioma(alvo).then(() => {
      if (idioma.value === alvo) aplicarIdiomaNoDocumento();
    });
  });

  iniciarGuardaDeRotas();

  render(<App />, document.getElementById('app')!);
}

void iniciar();
