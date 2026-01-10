'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This function should only be called on the client side.
export function initializeFirebase(): { firebaseApp: FirebaseApp, firestore: Firestore } {
  if (typeof window === 'undefined') {
    // This is a server-side environment, return a dummy object or throw.
    // For this case, we'll throw to make it clear it's a client-only function.
    throw new Error("Firebase should only be initialized on the client.");
  }
  
  const effectiveConfig = {
    ...firebaseConfig,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  };

  if (!getApps().length) {
    const firebaseApp = initializeApp(effectiveConfig);
    return {
      firebaseApp,
      firestore: getFirestore(firebaseApp)
    };
  }

  const app = getApp();
  return {
    firebaseApp: app,
    firestore: getFirestore(app)
  };
}

export function getSdks(firebaseApp: FirebaseApp): { auth: Auth, firestore: Firestore } {
  return {
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
