import { FirebaseOptions } from "firebase/app";

export const getFirebaseConfig = (): FirebaseOptions => {
  const firebaseConfig = {
    projectId: "studio-675497400-6064f",
    appId: "1:171392327548:web:81f992000b6f2632044ef9",
    storageBucket: "studio-675497400-6064f.appspot.com",
    authDomain: "studio-675497400-6064f.firebaseapp.com",
    messagingSenderId: "171392327548",
    measurementId: "G-VELXQSRWCW",
    // The API key is injected directly from environment variables.
    // This is crucial for security and build correctness.
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  };

  if (!firebaseConfig.apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not defined in your environment. Please check your .env file.");
  }
  
  return firebaseConfig;
};
