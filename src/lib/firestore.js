import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  doc,
  where,
  serverTimestamp,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';

// ─── Users / Discover ───────────────────────────────────

export async function fetchUserById(userId) {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function ensureUserExists({ uid, name, phoneNumber, photoURL }) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    // Standard schema fallback for new users
    const { setDoc } = await import('firebase/firestore');
    await setDoc(userRef, {
      uid,
      name: name || "Unknown User",
      fullName: name || "Unknown User",
      phoneNumber: phoneNumber || null,
      photoURL: photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// ─── Direct Connections ──────────────────────────────────

export async function createDirectConnection(user1Id, user2Id) {
  // Prevent duplicates
  const existingQ = query(
    collection(db, 'connections'),
    where('users', 'array-contains', user1Id)
  );
  const snap = await getDocs(existingQ);
  const exists = snap.docs.some(doc => {
    const arr = doc.data().users || [];
    return arr.includes(user2Id);
  });
  
  if (exists) return snap.docs.find(doc => doc.data().users.includes(user2Id)).id;

  const docRef = await addDoc(collection(db, 'connections'), {
    users: [user1Id, user2Id],
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
}

export function subscribeToPopulatedConnections(userId, callback) {
  const q = query(
    collection(db, 'connections'),
    where('users', 'array-contains', userId)
  );

  return onSnapshot(q, async (snap) => {
    const connections = [];
    const userCache = new Map(); // cache to minimize duplicate reads

    for (const d of snap.docs) {
      const data = d.data();
      const otherUserId = data.users?.find(id => id !== userId);
      let otherUser = null;

      if (otherUserId) {
        if (!userCache.has(otherUserId)) {
          // Fetch raw user data
          const uData = await fetchUserById(otherUserId);
          userCache.set(otherUserId, uData);
        }
        otherUser = userCache.get(otherUserId);
      }

      connections.push({
        id: d.id,
        ...data,
        otherUser, // Attached so preview can display name/image seamlessly
      });
    }

    // Sort by createdAt descending
    connections.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    callback(connections.slice(0, 5));
  });
}
