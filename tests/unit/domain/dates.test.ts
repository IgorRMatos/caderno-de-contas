import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  anoMesDeISO,
  dataNativaParaISO,
  formatarMesAbreviado,
  formatarMesPorExtenso,
  inferirOrdemData,
  parseDataPlanilha,
  serialExcelParaISO,
} from '../../../src/domain/dates';

describe('parseDataPlanilha — AAAA-MM-DD direto', () => {
  it('aceita ISO direto e rejeita data inválida', () => {
    expect(parseDataPlanilha('2026-10-15', 'dmy')).toEqual({ ok: true, iso: '2026-10-15' });
    expect(parseDataPlanilha('2026-02-30', 'dmy')).toEqual({ ok: false }); // 30/fev não existe
  });
});

describe('inferirOrdemData (D4 — por coluna)', () => {
  it('1º campo > 12 em alguma célula → dmy para a coluna toda', () => {
    expect(inferirOrdemData(['25/12/2026', '03/04/2026'], 'en')).toBe('dmy');
  });

  it('2º campo > 12 em alguma célula (e nenhum 1º > 12) → mdy para a coluna toda', () => {
    expect(inferirOrdemData(['12/25/2026', '03/04/2026'], 'pt-BR')).toBe('mdy');
  });

  it('ambíguo (nunca passa de 12) → mdy só se idioma ativo for en', () => {
    expect(inferirOrdemData(['05/06/2026'], 'en')).toBe('mdy');
    expect(inferirOrdemData(['05/06/2026'], 'pt-BR')).toBe('dmy');
    expect(inferirOrdemData(['05/06/2026'], 'es')).toBe('dmy');
  });
});

describe('parseDataPlanilha — dd/mm × mm/dd (coluna pt e en)', () => {
  it('coluna dmy: 03/04/2026 → 2026-04-03', () => {
    expect(parseDataPlanilha('03/04/2026', 'dmy')).toEqual({ ok: true, iso: '2026-04-03' });
  });

  it('coluna mdy: 03/04/2026 → 2026-03-04', () => {
    expect(parseDataPlanilha('03/04/2026', 'mdy')).toEqual({ ok: true, iso: '2026-03-04' });
  });

  it('ano com 2 dígitos vira 20XX', () => {
    expect(parseDataPlanilha('15/01/26', 'dmy')).toEqual({ ok: true, iso: '2026-01-15' });
  });

  it('rejeita data impossível (31/02)', () => {
    expect(parseDataPlanilha('31/02/2026', 'dmy')).toEqual({ ok: false });
  });

  it('rejeita texto que não é data', () => {
    expect(parseDataPlanilha('não é data', 'dmy')).toEqual({ ok: false });
  });
});

describe('serialExcelParaISO — serial do Excel, inclusive 29/02 e virada de fuso (D4)', () => {
  function serialParaData(ano: number, mes1a12: number, dia: number): number {
    const epoca = Date.UTC(1899, 11, 30);
    const alvo = Date.UTC(ano, mes1a12 - 1, dia);
    return (alvo - epoca) / 86400000;
  }

  it('converte um serial comum corretamente', () => {
    const serial = serialParaData(2026, 10, 15);
    expect(serialExcelParaISO(serial)).toBe('2026-10-15');
  });

  it('29/02 de um ano bissexto real (2024) é lido corretamente', () => {
    const serial = serialParaData(2024, 2, 29);
    expect(serialExcelParaISO(serial)).toBe('2024-02-29');
  });

  const tzOriginal = process.env.TZ;
  beforeEach(() => {
    process.env.TZ = 'America/Los_Angeles'; // UTC-8, testa a "virada de fuso"
  });
  afterEach(() => {
    process.env.TZ = tzOriginal;
  });

  it('não passa pelo fuso local: mesmo com TZ=America/Los_Angeles, a data não desloca', () => {
    const serial = serialParaData(2026, 10, 15);
    expect(serialExcelParaISO(serial)).toBe('2026-10-15');
  });
});

describe('dataNativaParaISO — Date nativo do SheetJS, lido em UTC', () => {
  it('lê os campos em UTC, não local', () => {
    const data = new Date(Date.UTC(2026, 9, 15));
    expect(dataNativaParaISO(data)).toBe('2026-10-15');
  });
});

describe('anoMesDeISO', () => {
  it('extrai AAAA-MM de AAAA-MM-DD', () => {
    expect(anoMesDeISO('2026-10-15')).toBe('2026-10');
  });
});

describe('formatarMesPorExtenso', () => {
  it('formata mês por extenso no idioma ativo', () => {
    expect(formatarMesPorExtenso('2026-10', 'pt-BR').toLowerCase()).toContain('outubro');
    expect(formatarMesPorExtenso('2026-10', 'en').toLowerCase()).toContain('october');
    expect(formatarMesPorExtenso('2026-10', 'es').toLowerCase()).toContain('octubre');
  });
});

describe('formatarMesAbreviado (T10 — rótulo de eixo de gráfico)', () => {
  it('mês curto, sem ponto final (pt-BR tem "out." por padrão do Intl)', () => {
    expect(formatarMesAbreviado('2026-10', 'pt-BR')).toBe('out');
    expect(formatarMesAbreviado('2026-10', 'en').toLowerCase()).toBe('oct');
    expect(formatarMesAbreviado('2026-10', 'es').toLowerCase()).toBe('oct');
  });
});
