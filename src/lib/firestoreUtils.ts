import { auth } from './firebase';
import { OperationType, FirestoreErrorInfo } from '../types';

export function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  
  const clean: any = Array.isArray(data) ? [] : {};
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const val = data[key];
      // Firestore refuses undefined, but null is okay for some fields. 
      // Most of the time we just want to skip undefined.
      if (val === undefined) continue;
      
      if (val && typeof val === 'object' && !(val instanceof Date)) {
        // Recursively clean
        clean[key] = sanitizeData(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

export function getCurrentUserId(): string {
  try {
    if (auth && auth.currentUser && auth.currentUser.uid) {
      return auth.currentUser.uid;
    }
  } catch (e) {
    console.warn("Auth check failed:", e);
  }
  return 'guest-user';
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let authInfo = {};
  try {
    if (auth && auth.currentUser) {
      authInfo = {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
      };
    }
  } catch (e) {
    // Ignore auth inspection errors
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo,
    operationType,
    path
  };
  const errorJson = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorJson);
  throw new Error(errorJson);
}
