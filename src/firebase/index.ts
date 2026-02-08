
'use client';

import { getFirebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This function should only be called on the client side.
export function initializeFirebase(): { firebaseApp: FirebaseApp, firestore: Firestore, auth: Auth } {
  if (typeof window === 'undefined') {
    // This is a server-side environment, throw to make it clear it's a client-only function.
    throw new Error("Firebase should only be initialized on the client.");
  }
  
  const firebaseConfig = getFirebaseConfig();

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  return {
    firebaseApp: app,
    firestore: getFirestore(app),
    auth: getAuth(app)
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './auth/use-user';
