import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  enableMultiTabIndexedDbPersistence,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Enable IndexedDB persistence so the board replays from local cache on
// reloads and Firestore syncs only changed documents with the backend.
// Must be called before any Firestore reads/writes/listeners.
if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((error) => {
    if (error.code !== "already-exists") {
      console.error("Error enabling Firestore persistence:", error);
    }
  });
}

// Initialize Storage
export const storage: FirebaseStorage = getStorage(app);

// Initialize Auth
export const auth: Auth = getAuth(app);

export default app;
