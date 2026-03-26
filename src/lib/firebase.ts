import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export const initializeFirebase = () => {
  if (!firebaseApp) {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    if (!config.apiKey || !config.projectId) {
      throw new Error('Firebase configuration is missing');
    }

    firebaseApp = initializeApp(config);
    firestoreDb = getFirestore(firebaseApp);
  }
  return { app: firebaseApp, db: firestoreDb };
};

export const getFirestoreInstance = (): Firestore | null => {
  return firestoreDb;
};

export const isFirebaseConfigured = (): boolean => {
  return !!(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);
};
