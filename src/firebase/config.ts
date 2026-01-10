
import { FirebaseOptions } from "firebase/app";

export const getFirebaseConfig = (): FirebaseOptions => {
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: "G-VELXQSRWCW"
  };

  const requiredKeys: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId', 'appId', 'storageBucket', 'messagingSenderId'];
  
  const missingKeys = requiredKeys.filter(key => {
    const value = firebaseConfig[key];
    return !value;
  });

  if (missingKeys.length > 0) {
    const message = `Missing Firebase config variables: ${missingKeys.join(', ')}. Please check your .env file and Vercel environment variables.`;
    // This error is thrown to prevent the app from running with an incomplete config.
    // The most common cause is needing to restart the Next.js development server after editing the .env file.
    throw new Error(message);
  }
  
  return firebaseConfig;
};
