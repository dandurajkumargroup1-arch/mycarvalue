'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseConfig } from './config';

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
    if (typeof window !== 'undefined') {
      const app = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp();
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setFirebaseInstances({ firebaseApp: app, firestore, auth });
    }
  }, []);

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
