import { db as firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface OfflineRequest {
  id?: number;
  message: string;
  userId: string;
  location: { lat: number, lng: number };
  timestamp: number;
  category: string;
  priority: string;
}

const DB_NAME = 'ReliefMapOfflineDB';
const STORE_NAME = 'pending_requests';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineQueue = {
  async add(request: Omit<OfflineRequest, 'id'>) {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.add(request);
    return new Promise((res, rej) => {
      transaction.oncomplete = () => res(true);
      transaction.onerror = () => rej(transaction.error);
    });
  },

  async getAll(): Promise<OfflineRequest[]> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((res, rej) => {
      request.onsuccess = () => res(request.result);
      request.onerror = () => rej(request.error);
    });
  },

  async remove(id: number) {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    return new Promise((res, rej) => {
      transaction.oncomplete = () => res(true);
      transaction.onerror = () => rej(transaction.error);
    });
  },

  async syncWithServer() {
    const pending = await this.getAll();
    if (pending.length === 0) return 0;

    let syncCount = 0;
    for (const req of pending) {
      try {
        // Build the payload for Firestore
        const payload = {
            ...req,
            status: 'active',
            urgency: req.priority,
            createdAt: serverTimestamp(),
            offlineMode: true, // Marker for Admin UI
            syncTime: Date.now()
        };
        
        // Push to Firebase
        await addDoc(collection(firestore, 'posts'), payload);
        
        // Remove from local queue
        if (req.id !== undefined) {
          await this.remove(req.id);
          syncCount++;
        }
      } catch (err) {
        console.error("Sync Error for request:", req, err);
      }
    }
    return syncCount;
  }
};
