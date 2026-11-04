/**
 * Lê um arquivo texto (CSV) tentando UTF-8 primeiro (modo estrito); se o
 * arquivo não for UTF-8 válido, cai para windows-1252 (Latin-1 do Excel/BR).
 * Remove o BOM se presente. Nunca lança — chamador trata string vazia como
 * "não consegui ler" junto com outras checagens de formato.
 */
export async function lerTextoArquivo(arquivo: File): Promise<string> {
  const buffer = await arquivo.arrayBuffer();
  let texto: string;
  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    texto = new TextDecoder('windows-1252').decode(buffer);
  }
  return texto.replace(/^\uFEFF/, '');
}

export async function lerBytesArquivo(arquivo: File): Promise<ArrayBuffer> {
  return arquivo.arrayBuffer();
}
