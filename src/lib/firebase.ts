
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

let app: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;

if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "mock-key-if-missing" && firebaseConfig.projectId && firebaseConfig.projectId !== "mock-project-if-missing") {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e: any) {
      console.error("Firebase initialization failed even with detected config:", e);
      // Fallback to a dummy app for the rest of the service initializations to not throw undefined errors.
      // This allows the app to load and display warnings/errors clearly.
      app = initializeApp({ apiKey: "mock-key-if-missing", projectId: "mock-project-if-missing", authDomain:"mock.firebaseapp.com" });
    }
  } else {
    console.warn(
      "Firebase configuration is missing or incomplete. " +
      "Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env file. " +
      "Firebase features will not work correctly. Attempting to initialize with mock values to allow app to load."
    );
    // Attempt a minimal initialization with mock values to prevent app from crashing immediately on module load
    // if other parts of the code expect `app` to be defined. Firebase services will still fail to connect.
    app = initializeApp({ apiKey: "mock-key-if-missing", projectId: "mock-project-if-missing", authDomain:"mock.firebaseapp.com" });
  }
} else {
  app = getApp();
}

try {
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app);
} catch (e: any) {
    console.error(
        "Failed to initialize Firebase services (auth, db, storage). " +
        "This usually means the Firebase app instance itself is not correctly configured due to missing or invalid environment variables. " +
        "Please check your .env file and ensure all NEXT_PUBLIC_FIREBASE_... variables are set correctly.",
        e
    );
    // Assign placeholder objects to prevent crashes if these are imported and used before full error handling.
    // Firebase operations will fail.
    authInstance = {} as Auth;
    dbInstance = {} as Firestore;
    storageInstance = {} as FirebaseStorage;
}

export { app, authInstance as auth, dbInstance as db, storageInstance as storage };
