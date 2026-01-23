
'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { User } from 'firebase/auth';

export interface WithdrawalRequestData {
  userId: string;
  amount: number;
  upiId: string;
  status: 'requested';
  requestedAt: any;
}

export async function requestWithdrawal(
  firestore: Firestore,
  user: User,
  amount: number,
  upiId: string
): Promise<void> {
  if (!user || !user.uid) {
    throw new Error('User is required to request a withdrawal.');
  }

  const withdrawalCollectionRef = collection(firestore, `users/${user.uid}/withdrawalRequests`);

  const withdrawalData: WithdrawalRequestData = {
    userId: user.uid,
    amount,
    upiId,
    status: 'requested',
    requestedAt: serverTimestamp(),
  };

  try {
    await addDoc(withdrawalCollectionRef, withdrawalData);
  } catch (error) {
    console.error('Error creating withdrawal request:', error);

    const permissionError = new FirestorePermissionError({
      path: withdrawalCollectionRef.path,
      operation: 'create',
      requestResourceData: withdrawalData,
    });
    
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}
