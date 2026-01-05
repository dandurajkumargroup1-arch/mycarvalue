
'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
  type FieldValue,
  Timestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface Feedback {
  id?: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  feedback: string;
  createdAt?: FieldValue | Timestamp;
}

/**
 * Adds a new feedback document to the 'feedback' collection in Firestore.
 * This function is non-blocking and handles errors via the global error emitter.
 *
 * @param firestore - The Firestore instance.
 * @param feedbackData - An object containing the feedback details.
 */
export function addFeedback(
  firestore: Firestore,
  feedbackData: Omit<Feedback, 'id' | 'createdAt'>
): void {
  const feedbackCollection = collection(firestore, 'feedback');
  
  const dataToSave = {
    ...feedbackData,
    createdAt: serverTimestamp(),
  };

  addDoc(feedbackCollection, dataToSave)
    .catch((error) => {
      console.error('Error adding feedback to Firestore:', error);
      
      const permissionError = new FirestorePermissionError({
        path: feedbackCollection.path,
        operation: 'create',
        requestResourceData: dataToSave,
      });
      
      // Emit a permission error to be caught by the global error listener.
      errorEmitter.emit('permission-error', permissionError);
    });
}
