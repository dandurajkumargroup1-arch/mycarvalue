'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): { firebaseApp: FirebaseApp, firestore: Firestore } {
  const effectiveConfig = {
    ...firebaseConfig,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  };

  if (!getApps().length) {
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      // This will fail in local/Vercel build, which is expected.
      firebaseApp = initializeApp();
    } catch (e) {
      // Fallback to using the explicit config, which is necessary for Vercel/local dev.
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(effectiveConfig);
    }

    return {
      firebaseApp,
      firestore: getFirestore(firebaseApp)
    };
  }

  // If already initialized, return the SDKs with the already initialized App
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
// We no longer export from './auth/use-user' to avoid conflicts. The correct useUser is in provider.
