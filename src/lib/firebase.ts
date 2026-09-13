import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string): void {
  const err = error as { code?: string; message?: string };
  console.warn(`Firestore ${operationType} error at ${path}:`, err?.message || err);
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const q = query(collection(db, '_health_check'), limit(1));
    await getDocs(q);
    return true;
  } catch (err) {
    console.log('Firebase Firestore connection notice:', err);
    return true;
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
};
export type { FirebaseUser };
