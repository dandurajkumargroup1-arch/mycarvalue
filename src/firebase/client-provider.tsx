'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseInstances {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseInstances, setFirebaseInstances] = useState<FirebaseInstances | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    if (typeof window !== 'undefined' && !getApps().length) {
      const effectiveConfig = {
        ...firebaseConfig,
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      };
      
      const app = initializeApp(effectiveConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setFirebaseInstances({ firebaseApp: app, firestore, auth });
    } else if (getApps().length) {
      const app = getApp();
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setFirebaseInstances({ firebaseApp: app, firestore, auth });
    }
  }, []);

  // While Firebase is initializing on the client, we render the children
  // but pass null values to the provider. The hooks within the provider
  // are designed to handle this gracefully and will report a loading state.
  // This prevents a server-client mismatch and hydration errors.
  return (
    <FirebaseProvider
      firebaseApp={firebaseInstances?.firebaseApp || null}
      auth={firebaseInstances?.auth || null}
      firestore={firebaseInstances?.firestore || null}
    >
      {children}
    </FirebaseProvider>
  );
}
