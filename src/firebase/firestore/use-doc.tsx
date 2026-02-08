
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * It depends entirely on the calling component to provide a valid document reference.
 * If the reference is null or undefined, the hook will wait.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedDocRef or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} memoizedDocRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    // If no document reference is provided, we are not ready to fetch.
    // Set loading to false and clear any previous data/errors.
    if (!memoizedDocRef) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }
    
    // A valid reference has been provided. Set loading state and attach the listener.
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist, which is a valid state.
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error("useDoc Firestore Error:", err);
        setError(err);
        setData(null);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount or when the reference changes.
    return () => unsubscribe();
  }, [memoizedDocRef]); // The hook's logic is now driven solely by the doc ref object.

  if (error) {
    // Surface the error to the nearest error boundary.
    throw error;
  }

  return { data, isLoading, error };
}
