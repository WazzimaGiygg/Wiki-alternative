import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ACTIVE_FIREBASE_CONFIG } from '../config/firebaseCustomConfig';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = getAuthSafe();
  const currentUser = currentAuth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  console.error('[Firestore Error]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

let appInstance: ReturnType<typeof initializeApp> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

export function getFirebaseApp() {
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(ACTIVE_FIREBASE_CONFIG.firebaseConfig);
  }
  return appInstance;
}

export function getDb() {
  if (!dbInstance) {
    const app = getFirebaseApp();
    const dbId = ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId;
    dbInstance = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
  }
  return dbInstance;
}

export function getAuthSafe() {
  if (!authInstance) {
    try {
      const app = getFirebaseApp();
      authInstance = getAuth(app);
    } catch {
      return null;
    }
  }
  return authInstance;
}

