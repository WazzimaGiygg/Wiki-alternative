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
   * Ex: "WikiZero Produção", "WikiZero Staging", "Banco de Testes Local"
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
  };
}

/**
 * CONFIGURAÇÃO ATIVA DO BANCO DE DADOS E FIREBASE
 * Altere os valores abaixo sempre que desejar trocar de projeto ou banco de dados Firestore.
 */
export const ACTIVE_FIREBASE_CONFIG: FirebaseCustomSettings = {
  environmentLabel: "WikiZero - wzzm-ce3fc (Produção Principal)",
  
  // ID do banco de dados Firestore específico (ou '(default)')
  firestoreDatabaseId: baseAppletConfig.firestoreDatabaseId || "(default)",

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
    developerNotes: "Configuração do Firebase ativa configurada para o projeto wzzm-ce3fc com armazenamento wzzm-ce3fc.appspot.com",
  },
};

/**
 * Retorna a configuração consolidada do Firebase para inicialização
 */
export function getActiveFirebaseConfig() {
  return {
    ...ACTIVE_FIREBASE_CONFIG.firebaseConfig,
    firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
  };
}

export default ACTIVE_FIREBASE_CONFIG;
