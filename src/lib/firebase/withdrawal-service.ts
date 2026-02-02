
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
  type FieldValue,
} from 'firebase/firestore';
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
  requestedAt: FieldValue;
}

export async function requestWithdrawal(
  firestore: Firestore,
  user: User,
  payload: WithdrawalRequestPayload
): Promise<void> {
  if (!user || !user.uid) {
    throw new Error('User is required to request a withdrawal.');
  }

  const withdrawalCollectionRef = collection(firestore, `users/${user.uid}/withdrawalRequests`);

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
    // Let the calling UI component handle the error via toast.
    throw error;
  }
}

export async function approveWithdrawal(
  firestore: Firestore,
  userId: string,
  requestId: string,
  transactionId: string,
): Promise<void> {
  try {
    await runTransaction(firestore, async (transaction) => {
      const requestRef = doc(firestore, 'users', userId, 'withdrawalRequests', requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists()) {
        throw new Error("Withdrawal request not found!");
      }

      const requestData = requestDoc.data();
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
    // Let the calling UI component handle the error.
    throw error;
  }
}


export async function rejectWithdrawal(
  firestore: Firestore,
  userId: string,
  requestId: string,
  rejectionReason: string,
): Promise<void> {
   try {
    const requestRef = doc(firestore, 'users', userId, 'withdrawalRequests', requestId);
    await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: serverTimestamp(),
        rejectionReason: rejectionReason,
    });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    // Let the calling UI component handle the error.
    throw error;
  }
}

    