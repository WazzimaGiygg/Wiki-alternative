// src/extensions/notepad/wkwdwz.ts

export const WKWDWZ_MAGIC = "WKWDWZ";
export const WKWDWZ_VERSION = 1;

export interface WkwdwzSync {
  /** ID estável do documento no Firestore (users/{uid}/notepad/{docId}) */
  docId: string;
  /** UID do dono original (para validar permissão no upload) */
  ownerUid: string;
  /** Última versão sincronizada (incrementa a cada push/pull) */
  revision: number;
  /** Timestamp do último estado sincronizado */
  syncedAt: string;
  /** Hash do conteúdo no momento da última sincronização (deteção de conflito) */
  contentHash: string;
}

export interface WkwdwzNote {
  title: string;
  body: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  authorUid?: string;
}

export interface WkwdwzEnvelope {
  magic: typeof WKWDWZ_MAGIC;
  version: number;
  payload: WkwdwzNote;
  sync?: WkwdwzSync;   // ausente se nunca foi feito upload
}
//close



//errorcatch
//jooj
