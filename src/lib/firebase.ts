import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

const databaseId = (firebaseConfig as any).firestoreDatabaseId || "ai-studio-19b671ce-0125-49ca-9800-de239bbfa7d7";

export const db = getFirestore(app, databaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const errStr = String(error?.code || error?.message || error || '');
    if (
      errStr.includes('popup-blocked') ||
      errStr.includes('cancelled-popup-request') ||
      errStr.includes('popup-closed-by-user') ||
      errStr.includes('popup_closed')
    ) {
      console.warn("Pop-up blocked or closed by user, falling back to signInWithRedirect...");
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (rErr) {
        console.warn("Redirect fallback notice:", rErr);
      }
      return null;
    }
    console.error("Google login error:", error);
    throw error;
  }
};

// Connectivity Test
async function testConnection() {
  try {
    const testDoc = doc(db, 'settings', 'global');
    await getDocFromServer(testDoc);
    console.log("Firestore connected successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check: Client operating in offline mode or database initializing.");
    }
  }
}
testConnection();

// Error Handling Utility
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
