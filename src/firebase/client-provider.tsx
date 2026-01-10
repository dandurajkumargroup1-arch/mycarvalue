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
    // While Firebase is initializing on the client, we render the children
    // but pass null values to the provider. The hooks within the provider
    // are designed to handle this gracefully and will report a loading state.
    // This prevents a server-client mismatch and hydration errors.
    return (
      <FirebaseProvider firebaseApp={null} auth={null} firestore={null}>
        {children}
      </FirebaseProvider>
    );
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
