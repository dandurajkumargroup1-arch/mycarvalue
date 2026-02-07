'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

// Data structure for creating/updating an auction car
export interface AuctionCarData {
  id?: string; // ID is optional for creation
  title: string;
  images: string[];
  odometer: string;
  fuelType: string;
  transmission: string;
  ownership: string;
  registration: string;
  conditionSummary: { item: string; status: string }[];
  inspectionReportUrl?: string;
  sellerName: string;
  sellerRating: number;
  sellerLocation: string;
  startTime: Date;
  endTime: Date;
  startPrice: number;
  reservePrice: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

/**
 * Creates or updates an auction car document.
 */
export async function upsertAuctionCar(
  firestore: Firestore,
  data: AuctionCarData
): Promise<void> {
  const { id, ...carData } = data;
  const collectionRef = collection(firestore, 'auctionCars');

  const payload = {
    ...carData,
    updatedAt: serverTimestamp(),
  };

  if (id) {
    // Update existing document
    const docRef = doc(firestore, 'auctionCars', id);
    await updateDoc(docRef, payload);
  } else {
    // Create new document
    await addDoc(collectionRef, {
      ...payload,
      createdAt: serverTimestamp(),
      currentBid: data.startPrice, // Initial bid is start price
      highestBidderId: null,
    });
  }
}

/**
 * Deletes an auction car document.
 */
export async function deleteAuctionCar(
  firestore: Firestore,
  auctionCarId: string
): Promise<void> {
  const docRef = doc(firestore, 'auctionCars', auctionCarId);
  await deleteDoc(docRef);
}
