// lib/cleanup.ts
import { db } from "./firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export async function deleteOldDocuments(collectionName: string, days: number = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const snapshot = await db
    .collection(collectionName)
    .where("createdAt", "<", Timestamp.fromDate(cutoffDate))
    .get();

  if (snapshot.empty) {
    console.log(`No documents older than ${days} days found in ${collectionName}.`);
    return 0;
  }

  let deletedCount = 0;
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    deletedCount += 1;
  });

  await batch.commit();
  console.log(`Deleted ${deletedCount} documents older than ${days} days from ${collectionName}.`);
  return deletedCount;
}