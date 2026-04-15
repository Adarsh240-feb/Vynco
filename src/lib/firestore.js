import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  doc,
  where,
  serverTimestamp,
  getDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';

// ─── Users / Discover ───────────────────────────────────

export async function fetchUserById(userId) {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    fullName: data.fullName || data.name || 'Unknown User',
  };
}

export async function ensureUserExists({ uid, fullName, name, phoneNumber }) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    // Standard schema fallback for new users
    const { setDoc } = await import('firebase/firestore');
    await setDoc(userRef, {
      uid,
      fullName: fullName || name || "Unknown User",
      phoneNumber: phoneNumber || null,
      createdAt: serverTimestamp(),
    });
  }
}

// ─── Direct Connections ──────────────────────────────────

export async function createDirectConnection(user1Id, user2Id) {
  if (!user1Id || !user2Id) return null;

  const connectionId = `${user1Id}_${user2Id}`;
  const connectionRef = doc(db, 'connections', connectionId);

  const existing = await getDoc(connectionRef);
  if (existing.exists()) return connectionId;

  // Prevent duplicates
  const existingQ = query(
    collection(db, 'connections'),
    where('userId', '==', user1Id)
  );
  const snap = await getDocs(existingQ);
  const exists = snap.docs.some((d) => {
    const data = d.data();
    const legacyUsers = data.users || [];
    return data.contactUserId === user2Id || legacyUsers.includes(user2Id);
  });
  
  if (exists) {
    return snap.docs.find((d) => {
      const data = d.data();
      const legacyUsers = data.users || [];
      return data.contactUserId === user2Id || legacyUsers.includes(user2Id);
    }).id;
  }

  const contactUser = await fetchUserById(user2Id);
  await setDoc(connectionRef, {
    id: connectionId,
    userId: user1Id,
    contactUserId: user2Id,
    connectionMethod: 'QR Scan',
    connectionNote: 'Added via QR scan',
    contactName: contactUser?.fullName || contactUser?.name || 'Unknown User',
    contactEmail: contactUser?.email || null,
    contactPhone: contactUser?.phoneNumber || contactUser?.phone || null,
    contactCompany: contactUser?.organization || contactUser?.company || null,
    isNewConnection: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return connectionId;
}

export function subscribeToPopulatedConnections(userId, callback) {
  const q = query(
    collection(db, 'connections'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, async (snap) => {
    const connections = [];
    const userCache = new Map(); // cache to minimize duplicate reads

    for (const d of snap.docs) {
      const data = d.data();
      const otherUserId = data.contactUserId || data.users?.find((id) => id !== userId);
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
