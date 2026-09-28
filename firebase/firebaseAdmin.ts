// lib/firebaseAdmin.ts
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function hasServiceAccount(value: unknown): value is Record<string, string> {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).project_id === "string" &&
    (value as Record<string, string>).project_id.length > 0
  );
}

function parseServiceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return hasServiceAccount(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Lazily initialized on purpose: a missing/invalid service account must fail
// at request time (HTTP 500), never at module load (which breaks `next build`
// page-data collection for every route importing this file).
let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb;
  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT is missing or invalid. Set it to your Firebase service account JSON."
    );
  }
  cachedApp = getApps().length ? getApps()[0]! : initializeApp({ credential: cert(serviceAccount) });
  cachedDb = getFirestore(cachedApp);
  return cachedDb;
}
