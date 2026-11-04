import { useEffect, useRef, useState } from 'preact/hooks';
import type { Idioma } from '../config.js';
import { inferirSeparadorDecimal, parseValorPlanilha, simboloMoeda } from '../domain/money.js';
import type { Tipo } from '../domain/types.js';
import { t } from '../i18n/index.js';
import {
  adicionarLancamento,
  criarCategoriaSePreciso,
  editarLancamento,
} from '../state/lancamentos.js';
import { fecharPainelLancamento, painelLancamento } from '../state/painelLancamento.js';
import { categorias, idioma } from '../state/signals.js';
import { Dialog } from './Dialog.js';

const NOVA_CATEGORIA = '__nova__';

function hojeISO(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Centavos → texto editável (sem símbolo de moeda), no separador decimal do idioma ativo. */
function centavosParaTexto(centavos: number, idiomaAtual: Idioma): string {
  const abs = Math.abs(centavos);
  const reais = Math.floor(abs / 100);
  const parteCentavos = String(abs % 100).padStart(2, '0');
  const separador = idiomaAtual === 'en' ? '.' : ',';
  return `${reais}${separador}${parteCentavos}`;
}

type CampoComErro = 'valor' | 'data' | 'novaCategoria';

/** T11 — painel único "Anotar no caderno"/"Corrigir lançamento" (UX §4.6, CA04.1/CA04.2/CA04.3). */
export function PainelLancamento() {
  const painel = painelLancamento.value;
  const chaveAbertura =
    painel === null ? null : painel.modo === 'editar' ? painel.lancamento.id : 'novo';

  const [tipo, setTipo] = useState<Tipo>('saida');
  const [valorTexto, setValorTexto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(hojeISO());
  const [categoriaId, setCategoriaId] = useState('');
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [erro, setErro] = useState<{ campo: CampoComErro; mensagem: string } | null>(null);

  const valorRef = useRef<HTMLInputElement>(null);
  const dataRef = useRef<HTMLInputElement>(null);
  const novaCategoriaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (painel === null) return;
    if (painel.modo === 'editar') {
      const l = painel.lancamento;
      setTipo(l.tipo);
      setValorTexto(centavosParaTexto(l.valorCentavos, idioma.value));
      setDescricao(l.descricao);
      setData(l.data);
      setCategoriaId(l.categoria);
    } else {
      setTipo('saida');
      setValorTexto('');
      setDescricao('');
      setData(hojeISO());
      setCategoriaId(categorias.value[0]?.id ?? 'outros');
    }
    setNovaCategoriaNome('');
    setErro(null);
    // Reabre do zero só quando o alvo muda de fato (id editado, ou "novo" após ter fechado).
  }, [chaveAbertura]);

  if (painel === null) return null;
  const alvo = painel;

  function aoSubmeter(ev: Event): void {
    ev.preventDefault();

    if (valorTexto.trim() === '') {
      setErro({ campo: 'valor', mensagem: t('erros.valorFaltando') });
      valorRef.current?.focus();
      return;
    }
    const separador = inferirSeparadorDecimal([valorTexto]);
    const resultado = parseValorPlanilha(valorTexto, separador);
    if (!resultado.ok) {
      setErro({ campo: 'valor', mensagem: t('erros.valorApenasNumeros') });
      valorRef.current?.focus();
      return;
    }
    const valorCentavos = Math.abs(resultado.centavos);
    if (valorCentavos === 0) {
      setErro({ campo: 'valor', mensagem: t('erros.valorMaiorQueZero') });
      valorRef.current?.focus();
      return;
    }

    if (data === '') {
      setErro({ campo: 'data', mensagem: t('erros.dataFaltando') });
      dataRef.current?.focus();
      return;
    }

    let categoriaFinal = categoriaId;
    if (categoriaId === NOVA_CATEGORIA) {
      if (novaCategoriaNome.trim() === '') {
        setErro({ campo: 'novaCategoria', mensagem: t('erros.categoriaNome') });
        novaCategoriaRef.current?.focus();
        return;
      }
      categoriaFinal = criarCategoriaSePreciso(novaCategoriaNome);
    }

    const dados = {
      tipo,
      valorCentavos,
      descricao: descricao.trim(),
      data,
      categoria: categoriaFinal,
    };
    if (alvo.modo === 'editar') {
      editarLancamento(alvo.lancamento.id, dados);
    } else {
      adicionarLancamento(dados);
    }
    fecharPainelLancamento();
  }

  const ehEdicao = painel.modo === 'editar';
  const tituloId = 'painel-lancamento-titulo';

  return (
    <Dialog
      aberto
      titulo={ehEdicao ? t('lancamento.corrigirTitulo') : t('lancamento.anotarNoCaderno')}
      tituloId={tituloId}
      variante="drawer"
      onFechar={fecharPainelLancamento}
      focoInicialRef={valorRef}
    >
      <form onSubmit={aoSubmeter} noValidate>
        <fieldset class="field" style={{ border: 0, padding: 0, margin: '0 0 16px' }}>
          <legend class="label">{t('lancamento.issoFoi')}</legend>
          <div class="seg">
            <input
              type="radio"
              name="tipo-lancamento"
              id="pl-entrada"
              checked={tipo === 'entrada'}
              onChange={() => setTipo('entrada')}
            />
            <label for="pl-entrada">{t('lancamento.entrada')}</label>
            <input
              type="radio"
              name="tipo-lancamento"
              id="pl-saida"
              checked={tipo === 'saida'}
              onChange={() => setTipo('saida')}
            />
            <label for="pl-saida">{t('lancamento.saida')}</label>
          </div>
        </fieldset>

        <div class={`field${erro?.campo === 'valor' ? ' error' : ''}`}>
          <label for="pl-valor">{t('lancamento.valor')}</label>
          <div class="money-in">
            <span aria-hidden="true">{simboloMoeda(idioma.value)}</span>
            <input
              class="input"
              id="pl-valor"
              ref={valorRef}
              inputMode="decimal"
              placeholder={idioma.value === 'en' ? '0.00' : '0,00'}
              value={valorTexto}
              aria-invalid={erro?.campo === 'valor'}
              aria-describedby={erro?.campo === 'valor' ? 'pl-valor-erro' : undefined}
              onInput={(ev) => {
                setValorTexto((ev.target as HTMLInputElement).value);
                if (erro?.campo === 'valor') setErro(null);
              }}
            />
          </div>
          {erro?.campo === 'valor' && (
            <p class="field-msg" id="pl-valor-erro">
              {erro.mensagem}
            </p>
          )}
        </div>

        <div class="field">
          <label for="pl-descricao">{t('lancamento.descricao')}</label>
          <input
            class="input"
            id="pl-descricao"
            placeholder={t('lancamento.descricaoPlaceholder')}
            value={descricao}
            onInput={(ev) => setDescricao((ev.target as HTMLInputElement).value)}
          />
        </div>

        <div class="two">
          <div class={`field${erro?.campo === 'data' ? ' error' : ''}`}>
            <label for="pl-data">{t('lancamento.data')}</label>
            <input
              class="input"
              id="pl-data"
              type="date"
              ref={dataRef}
              value={data}
              aria-invalid={erro?.campo === 'data'}
              aria-describedby={erro?.campo === 'data' ? 'pl-data-erro' : undefined}
              onInput={(ev) => {
                setData((ev.target as HTMLInputElement).value);
                if (erro?.campo === 'data') setErro(null);
              }}
            />
            {erro?.campo === 'data' && (
              <p class="field-msg" id="pl-data-erro">
                {erro.mensagem}
              </p>
            )}
          </div>
          <div class="field">
            <label for="pl-categoria">{t('lancamento.categoria')}</label>
            <select
              class="select"
              id="pl-categoria"
              value={categoriaId}
              onChange={(ev) => setCategoriaId((ev.target as HTMLSelectElement).value)}
            >
              {categorias.value.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
              <option value={NOVA_CATEGORIA}>{t('lancamento.criarCategoria')}</option>
            </select>
          </div>
        </div>

        {categoriaId === NOVA_CATEGORIA && (
          <div class={`field${erro?.campo === 'novaCategoria' ? ' error' : ''}`}>
            <label for="pl-nova-categoria">{t('lancamento.nomeDaCategoria')}</label>
            <input
              class="input"
              id="pl-nova-categoria"
              ref={novaCategoriaRef}
              value={novaCategoriaNome}
              aria-invalid={erro?.campo === 'novaCategoria'}
              aria-describedby={
                erro?.campo === 'novaCategoria' ? 'pl-nova-categoria-erro' : undefined
              }
              onInput={(ev) => {
                setNovaCategoriaNome((ev.target as HTMLInputElement).value);
                if (erro?.campo === 'novaCategoria') setErro(null);
              }}
            />
            {erro?.campo === 'novaCategoria' && (
              <p class="field-msg" id="pl-nova-categoria-erro">
                {erro.mensagem}
              </p>
            )}
          </div>
        )}

        <div class="actions">
          <button type="submit" class="btn btn-ink">
            {ehEdicao ? t('lancamento.salvarCorrecao') : t('lancamento.anotar')}
          </button>
          <button type="button" class="btn btn-ghost" onClick={fecharPainelLancamento}>
            {t('lancamento.cancelar')}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
