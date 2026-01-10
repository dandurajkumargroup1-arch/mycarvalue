'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, getSdks } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

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
      const { firebaseApp } = initializeFirebase();
      const { auth, firestore } = getSdks(firebaseApp);
      setFirebaseInstances({ firebaseApp, firestore, auth });
    }
  }, []); // Empty dependency array ensures this runs only once.

  if (!firebaseInstances) {
    // While Firebase is initializing, we can show a loader or return null.
    // Returning null prevents children from rendering and trying to access Firebase too early.
    return null; 
  }
  
  return (
    <FirebaseProvider
      firebaseApp={firebaseInstances.firebaseApp}
      auth={firebaseInstances.auth}
      firestore={firebaseInstances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
