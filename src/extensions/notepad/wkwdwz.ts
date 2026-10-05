// src/extensions/notepad/wkwdwz.ts

export const WKWDWZ_MAGIC = "WKWDWZ";
export const WKWDWZ_VERSION = 1;

export interface WkwdwzNote {
  title: string;
  body: string;               // markdown ou texto puro
  tags?: string[];
  createdAt: string;          // ISO 8601
  updatedAt: string;
  authorUid?: string;
}

export interface WkwdwzEnvelope {
  magic: typeof WKWDWZ_MAGIC;
  version: number;
  payload: WkwdwzNote;
  checksum?: string;          // opcional: SHA-256 do payload serializado
}

/** Serializa uma nota para o formato .wkwdwz (JSON com cabeçalho) */
export function encodeWkwdwz(note: WkwdwzNote): string {
  const envelope: WkwdwzEnvelope = {
    magic: WKWDWZ_MAGIC,
    version: WKWDWZ_VERSION,
    payload: note,
  };
  return JSON.stringify(envelope, null, 2);
}

/** Valida e desserializa um arquivo .wkwdwz */
export function decodeWkwdwz(raw: string): WkwdwzNote {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Arquivo .wkwdwz inválido: não é JSON.");
  }
  const env = parsed as Partial<WkwdwzEnvelope>;
  if (env.magic !== WKWDWZ_MAGIC) {
    throw new Error("Arquivo .wkwdwz inválido: magic number ausente.");
  }
  if (typeof env.version !== "number" || env.version > WKWDWZ_VERSION) {
    throw new Error(`Versão .wkwdwz não suportada: ${env.version}`);
  }
  if (!env.payload || typeof env.payload.body !== "string") {
    throw new Error("Arquivo .wkwdwz inválido: payload ausente.");
  }
  return env.payload;
}
