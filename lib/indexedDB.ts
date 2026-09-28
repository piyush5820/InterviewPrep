const DB_NAME = "InterviewResultsDB";
const STORE_NAME = "results";
let db: IDBDatabase | null = null;

interface Result {
  id: number;
  question: string;
  answer: string;
  score: number;
}

export const initIndexedDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onerror = () => {
      reject("Failed to initialize IndexedDB");
    };
  });
};

export const saveResultToIndexedDB = async (result: any): Promise<void> => {
  if (!db) await initIndexedDB();

  const transaction = db!.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.add(result);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject("Failed to save result");
  });
};

export const getAllResultsFromIndexedDB = (): Promise<Result[]> => {
  return new Promise((resolve, reject) => {
    if (!db) return reject("DB not initialized");

    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as Result[]);
    request.onerror = () => reject("Failed to fetch results");
  });
};
