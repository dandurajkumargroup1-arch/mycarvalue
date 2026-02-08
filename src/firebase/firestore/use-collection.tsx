
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useUser } from '@/firebase/auth/use-user';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted targetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { isUserLoading, user } = useUser(); // Get user object

  useEffect(() => {
    // Primary guard: wait for auth to finish loading.
    if (isUserLoading) {
      setIsLoading(true);
      setData(null);
      setError(null);
      return;
    }
    
    // Secondary guard: If there's no query, we have nothing to fetch.
    if (!targetRefOrQuery) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }
    
    // **Crucial Guard**: If a query is provided but we have no authenticated user,
    // it's an invalid state that would lead to a permission error. Do not proceed.
    // This assumes all collection queries in this app require authentication.
    if (targetRefOrQuery && !user) {
        setIsLoading(false);
        setData(null);
        setError(null); // Not an error, just no data to fetch.
        return;
    }

    // At this point, auth is ready, we have a query, AND we have a user.
    // It's now safe to subscribe.
    setIsLoading(true); 
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const path: string =
          targetRefOrQuery.type === 'collection'
            ? (targetRefOrQuery as CollectionReference).path
            : "A database query (details unavailable)";

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });
        
        errorEmitter.emit('permission-error', contextualError);

        setError(contextualError);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery, isUserLoading, user]); // Re-run if the query, auth status, or user changes.

  return { data, isLoading, error };
}
