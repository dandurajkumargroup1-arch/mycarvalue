import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts various date/time representations to a JS Date object.
 * Handles:
 * - Firestore Timestamps (from live server-side reads)
 * - Serialized Firestore Timestamps (objects with seconds/nanoseconds from SSR)
 * - JavaScript Date objects (if data is already processed)
 * - ISO 8601 date strings (from JSON serialization of Date objects)
 * Returns null if the input is invalid or null/undefined.
 * @param timestamp - The value to convert.
 */
export const toDate = (timestamp: any): Date | null => {
    if (!timestamp) {
        return null;
    }
    if (timestamp instanceof Date) {
        return timestamp;
    }
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    if (timestamp && typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000);
    }
    if (typeof timestamp === 'string') {
        // Attempt to parse ISO string
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return null;
};


/**
 * Formats a number as Indian Rupees (INR) without fractional digits.
 * Returns '...' if the value is undefined.
 * @param value - The number to format.
 */
export const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '...';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Formats a Firestore Timestamp into a readable date and time string (e.g., 27/07/2024, 14:30:15).
 * @param timestamp - The timestamp to format.
 */
export const formatDateTime = (timestamp: any): string => {
    const date = toDate(timestamp);
    return date ? date.toLocaleString('en-GB') : 'N/A';
};

/**
 * Formats a Firestore Timestamp into a readable date-only string (e.g., 27 Jul 2024).
 * @param timestamp - The timestamp to format.
 */
export const formatDateOnly = (timestamp: any): string => {
    const date = toDate(timestamp);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}
