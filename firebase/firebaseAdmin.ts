// lib/firebaseAdmin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Load service account credentials from environment variable or file
const serviceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || "{}"
);

// Initialize Firebase Admin SDK
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
    });

export const db = getFirestore(app);