/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigLocal from '../../firebase-applet-config.json';

// Load from environment variables (Vite uses import.meta.env)
// Fallback to local config if environment variables are missing
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLocal?.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal?.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal?.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal?.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal?.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLocal?.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigLocal?.firestoreDatabaseId
};

// Simple check to prevent crash if everything is missing
const isFirebaseValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isFirebaseValid ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)') : (null as any);
export const auth = app ? getAuth(app) : (null as any);
export const googleProvider = new GoogleAuthProvider();

export const login = () => auth ? signInWithPopup(auth, googleProvider) : Promise.reject('Auth not initialized');
export const loginAnonymously = async () => {
  if (!auth) return null;
  try {
    return await signInAnonymously(auth);
  } catch (error: any) {
    if (error.code === 'auth/admin-restricted-operation') {
      console.warn("Anonymous authentication is disabled in your Firebase Console. Since rules are public, the app will continue to function without identity.");
      return null;
    }
    throw error;
  }
};
export const logout = () => auth ? signOut(auth) : Promise.resolve();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
