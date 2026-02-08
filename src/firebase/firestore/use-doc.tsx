
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useUser } from '@/firebase/auth/use-user';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { isUserLoading, user } = useUser(); // Get user object as well

  useEffect(() => {
    // Primary guard: wait for auth to finish loading.
    if (isUserLoading) {
      setIsLoading(true);
      setData(null);
      setError(null);
      return;
    }

    // Secondary guard: If there's no doc ref, we have nothing to fetch.
    if (!memoizedDocRef) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }

    // **Crucial Guard**: If a document reference is provided, but we don't have an
    // authenticated user, it's an invalid state that would lead to a permission
    // error. We must not proceed.
    if (memoizedDocRef && !user) {
        // This can happen in the brief moment between isUserLoading=false and the user object being cleared on sign-out,
        // or if a component creates a docRef without ensuring a user is logged in.
        setIsLoading(false);
        setData(null);
        setError(null); // Not an error, just no data to fetch.
        return;
    }

    // At this point, auth is ready, we have a doc ref, AND we have a user.
    // It's now safe to subscribe.
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        })

        errorEmitter.emit('permission-error', contextualError);
        
        setError(contextualError)
        setData(null)
        setIsLoading(false)
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, isUserLoading, user]); // Re-run if the doc ref, auth status, or user object changes.

  return { data, isLoading, error };
}
