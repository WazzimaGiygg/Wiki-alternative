/**
 * ============================================================================
 * WIKIZERO - ARQUIVO DE CONFIGURAÇÃO DO DESENVOLVEDOR / PROGRAMADOR
 * ============================================================================
 * 
 * Este arquivo permite que o desenvolvedor da Wiki altere e personalize facilmente:
 *  1. As credenciais do Firebase (apiKey, authDomain, projectId, storageBucket, etc.)
 *  2. O banco de dados do Firestore a ser utilizado (firestoreDatabaseId ou '(default)')
 *  3. O identificador / apelido amigável do banco de dados (para auditoria e painel)
 *  4. Configurações adicionais de ambiente, cache e sincronização
 * 
 * Para alterar o banco de dados utilizado, basta editar os valores abaixo.
 */

import baseAppletConfig from '../../firebase-applet-config.json';

export interface FirebaseCustomSettings {
  /**
   * Nome ou rótulo amigável para identificar este ambiente/banco de dados
   * Ex: "WikiWorldWeb Produção", "WikiWorldWeb Staging", "Banco de Testes Local"
   */
  environmentLabel: string;

  /**
   * Identificador do banco de dados Firestore no Firebase.
   * Pode ser:
   *  - "(default)" para o banco padrão do projeto Firebase
   *  - Um ID específico de banco de dados nomeado do Firestore
   */
  firestoreDatabaseId: string;

  /**
   * Objeto com as credenciais principais do Firebase
   */
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };

  /**
   * Configurações adicionais opcionais
   */
  options: {
    enableAutoSync: boolean;
    enableOfflinePersistence: boolean;
    pingHealthCheckIntervalMs: number;
    developerNotes?: string;
    /** Plano do Firebase no Google Cloud: 'spark' (gratuito) ou 'blaze' (faturamento ativo) */
    planTier?: 'spark' | 'blaze';
    /** Se backups automáticos agendados no GCS estão habilitados (requer Blaze) */
    autoBackupEnabled?: boolean;
    /** Frequência / Cron para backups automáticos */
    backupScheduleCron?: string;
    /** URI do bucket GCS para onde os backups e snapshots são enviados */
    backupBucketUri?: string;
    /** Habilitar Point-in-Time Recovery contínuo de 7 dias */
    enablePitr?: boolean;
  };
}

export const STORAGE_KEY_CUSTOM_FIREBASE_CONFIG = 'wikiworldweb_custom_firebase_credentials';

export function getCustomStoredConfig(): Partial<FirebaseCustomSettings['firebaseConfig']> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FIREBASE_CONFIG);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.apiKey && parsed.projectId) {
      return parsed;
    }
  } catch {
    // ignora erros de parse
  }
  return null;
}

export function saveCustomStoredConfig(cfg: Partial<FirebaseCustomSettings['firebaseConfig']>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CUSTOM_FIREBASE_CONFIG, JSON.stringify(cfg));
}

export function clearCustomStoredConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_CUSTOM_FIREBASE_CONFIG);
}

export function isUsingCustomStoredConfig(): boolean {
  return !!getCustomStoredConfig();
}

/**
 * CONFIGURAÇÃO ATIVA DO BANCO DE DADOS E FIREBASE
 * Altere os valores abaixo sempre que desejar trocar de projeto ou banco de dados Firestore.
 */
export const ACTIVE_FIREBASE_CONFIG: FirebaseCustomSettings = {
  environmentLabel: "WikiWorldWeb - wzzm-ce3fc (Produção Principal)",
  
  // ID do banco de dados Firestore específico (ou '(default)')
  firestoreDatabaseId: (baseAppletConfig as Record<string, any>).firestoreDatabaseId || "(default)",

  firebaseConfig: {
    apiKey: baseAppletConfig.apiKey,
    authDomain: baseAppletConfig.authDomain,
    projectId: baseAppletConfig.projectId,
    storageBucket: baseAppletConfig.storageBucket,
    messagingSenderId: baseAppletConfig.messagingSenderId,
    appId: baseAppletConfig.appId,
    measurementId: baseAppletConfig.measurementId || undefined,
  },

  options: {
    enableAutoSync: true,
    enableOfflinePersistence: true,
    pingHealthCheckIntervalMs: 60000,
    developerNotes: "Configuração do Firebase ativa com suporte a backups automáticos e faturamento Blaze",
    planTier: 'blaze',
    autoBackupEnabled: true,
    backupScheduleCron: '0 3 * * *',
    backupBucketUri: `gs://${baseAppletConfig.projectId}-firestore-backups`,
    enablePitr: true,
  },
};

/**
 * Retorna a configuração consolidada do Firebase para inicialização
 */
export function getActiveFirebaseConfig() {
  const custom = getCustomStoredConfig();
  if (custom && custom.apiKey && custom.projectId) {
    return {
      apiKey: custom.apiKey,
      authDomain: custom.authDomain || `${custom.projectId}.firebaseapp.com`,
      projectId: custom.projectId,
      storageBucket: custom.storageBucket || `${custom.projectId}.firebasestorage.app`,
      messagingSenderId: custom.messagingSenderId || '',
      appId: custom.appId || '',
      measurementId: custom.measurementId || undefined,
      firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
      isCustom: true,
    };
  }

  return {
    ...ACTIVE_FIREBASE_CONFIG.firebaseConfig,
    firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
    isCustom: false,
  };
}

export default ACTIVE_FIREBASE_CONFIG;
