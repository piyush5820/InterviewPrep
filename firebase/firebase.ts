import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp, orderBy } from "firebase/firestore";
import { signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getApp, getApps } from "firebase/app";
import { JobApplication, ApplicationStatus } from "@/types";

// Delivery summary generated after a live voice interview (0-10 each).
export interface InterviewSummary {
    confidence: number;
    communication: number;
    language: number;
    overall: number;
    text: string;
}

// Define the Interview interface to match the data structure
export interface Interview {
    id: string;
    userId: string;
    questions: string[];
    answers: { [key: number]: string };
    feedbacks: { [key: number]: string };
    scores: { [key: number]: number };
    interviewType: string;
    interviewRole: string;
    skills: string;
    createdAt: string | Timestamp;
    summary?: InterviewSummary;
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth =
  typeof window !== "undefined" ? getAuth(app) : ({} as Auth);
export const db = getFirestore(app);
  
export async function saveInterview(userId: string, interviewData: {
    questions: string[];
    answers: { [key: number]: string };
    feedbacks: { [key: number]: string };
    scores: { [key: number]: number };
    timestamp?: string;
    interviewType: string;
    interviewRole: string;
    skills: string;
    createdAt: string | Timestamp;
    summary?: InterviewSummary;
  }) {
    try {
      const docRef = await addDoc(collection(db, "users", userId, "interviews"), {
        userId,
        ...interviewData,
        createdAt: Timestamp.fromDate(new Date()),
        timestamp: interviewData.timestamp || new Date().toISOString(), 
      });
      console.log("Interview saved with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error saving interview:", error);
      throw error;
    }
}

export async function getInterviewHistory(userId: string): Promise<Interview[]> {
  try {
    const q = query(collection(db, "users", userId, "interviews"));
    const querySnapshot = await getDocs(q);
    const interviews: Interview[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId: userId,
      questions: doc.data().questions || [],
      answers: doc.data().answers || {},
      feedbacks: doc.data().feedbacks || {},
      scores: doc.data().scores || {},
      interviewType: doc.data().interviewType,
      interviewRole: doc.data().interviewRole,
      skills: doc.data().skills,
      summary: doc.data().summary,
      createdAt: doc.data().createdAt ? 
        (doc.data().createdAt instanceof Timestamp
            ? doc.data().createdAt.toDate().toISOString()
            : doc.data().createdAt)
        : "",
      timestamp: doc.data().timestamp || "",
    }));
    console.log("Fetched interviews:", interviews);
    return interviews;
  } catch (error) {
    console.error("Error fetching interview history:", error);
    throw error;
  }
}


export{signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword};

const applicationsCollection = (userId: string) => collection(db, "users", userId, "applications");

export async function saveApplication(userId: string, data: Omit<JobApplication, "id" | "userId" | "createdAt">): Promise<string> {
  const docRef = await addDoc(applicationsCollection(userId), {
    ...data,
    userId,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getApplications(userId: string): Promise<JobApplication[]> {
  const q = query(applicationsCollection(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, userId, ...d.data() } as JobApplication));
}

export async function updateApplication(userId: string, appId: string, data: Partial<JobApplication>): Promise<void> {
  const ref = doc(db, "users", userId, "applications", appId);
  await updateDoc(ref, { ...data, lastUpdated: new Date().toISOString() });
}

export async function deleteApplication(userId: string, appId: string): Promise<void> {
  const ref = doc(db, "users", userId, "applications", appId);
  await deleteDoc(ref);
}

export async function updateApplicationStatus(userId: string, appId: string, status: ApplicationStatus): Promise<void> {
  const ref = doc(db, "users", userId, "applications", appId);
  await updateDoc(ref, { status, lastUpdated: new Date().toISOString() });
}
