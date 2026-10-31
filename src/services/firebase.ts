import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Tournament, FirebaseConfig } from '../types';

const STORAGE_KEY_TOURNAMENT = 'tlv_beach_tournament_current';
const STORAGE_KEY_FIREBASE = 'tlv_beach_firebase_config';

// Safe getter for saved Firebase configuration
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading Firebase config:', e);
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving Firebase config:', e);
  }
}

let dbInstance: any = null;

export function initFirebaseService(config?: FirebaseConfig | null) {
  const activeConfig = config || getSavedFirebaseConfig();
  if (!activeConfig || !activeConfig.projectId) {
    dbInstance = null;
    return null;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.warn('Failed to initialize Firebase app:', err);
    dbInstance = null;
    return null;
  }
}

// LocalStorage Persistence
export function loadLocalTournament(): Tournament | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TOURNAMENT);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading local tournament:', e);
  }
  return null;
}

export function saveLocalTournament(tournament: Tournament) {
  try {
    localStorage.setItem(STORAGE_KEY_TOURNAMENT, JSON.stringify(tournament));
  } catch (e) {
    console.error('Error saving local tournament:', e);
  }
}

// Cloud sync via Firestore
export async function syncTournamentToCloud(tournament: Tournament): Promise<boolean> {
  saveLocalTournament(tournament);

  if (!dbInstance) {
    initFirebaseService();
  }

  if (!dbInstance) {
    return false; // Stored locally only
  }

  try {
    const docRef = doc(dbInstance, 'tournaments', tournament.id);
    await setDoc(docRef, {
      ...tournament,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error('Failed to sync to Firebase:', err);
    return false;
  }
}

// Real-time listener for multi-device sync
export function subscribeToTournamentCloud(
  tournamentId: string,
  onUpdate: (tournament: Tournament) => void,
  onError?: (err: any) => void
): () => void {
  if (!dbInstance) {
    initFirebaseService();
  }

  if (!dbInstance) {
    return () => {};
  }

  try {
    const docRef = doc(dbInstance, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Tournament;
          saveLocalTournament(data);
          onUpdate(data);
        }
      },
      (err) => {
        console.warn('Firestore snapshot error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('Could not subscribe to cloud updates:', e);
    return () => {};
  }
}
