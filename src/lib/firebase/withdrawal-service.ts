
'use client';

import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
  runTransaction,
  type Firestore,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { User } from 'firebase/auth';

export interface WithdrawalRequestPayload {
  amount: number;
  upiId?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}

export interface WithdrawalRequestData extends WithdrawalRequestPayload {
  userId: string;
  status: 'requested';
  requestedAt: any;
}

export async function requestWithdrawal(
  firestore: Firestore,
  user: User,
  payload: WithdrawalRequestPayload
): Promise<void> {
  if (!user || !user.uid) {
    throw new Error('User is required to request a withdrawal.');
  }

  const withdrawalCollectionRef = collection(firestore, `withdrawalRequests`);

  const withdrawalData: WithdrawalRequestData = {
    userId: user.uid,
    status: 'requested',
    requestedAt: serverTimestamp(),
    ...payload
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

export async function approveWithdrawal(
  firestore: Firestore,
  requestId: string,
  transactionId: string,
): Promise<void> {
  try {
    await runTransaction(firestore, async (transaction) => {
      const requestRef = doc(firestore, 'withdrawalRequests', requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists()) {
        throw new Error("Withdrawal request not found!");
      }

      const requestData = requestDoc.data();
      const userId = requestData.userId;
      const amount = requestData.amount;
      
      const walletRef = doc(firestore, `users/${userId}/wallet/main`);
      
      // Update the request document
      transaction.update(requestRef, {
        status: 'paid',
        processedAt: serverTimestamp(),
        transactionId: transactionId,
      });
      
      // Update the user's wallet
      transaction.update(walletRef, {
        balance: increment(-amount),
        lastWithdrawalDate: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    const err = error as any;
     const permissionError = new FirestorePermissionError({
        path: `withdrawalRequests/${requestId}`, 
        operation: 'update',
      });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}


export async function rejectWithdrawal(
  firestore: Firestore,
  requestId: string,
  rejectionReason: string,
): Promise<void> {
   try {
    const requestRef = doc(firestore, 'withdrawalRequests', requestId);
    await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: serverTimestamp(),
        rejectionReason: rejectionReason,
    });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    const err = error as any;
    const permissionError = new FirestorePermissionError({
        path: `withdrawalRequests/${requestId}`,
        operation: 'update',
        requestResourceData: { status: 'rejected', rejectionReason: rejectionReason }
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

    