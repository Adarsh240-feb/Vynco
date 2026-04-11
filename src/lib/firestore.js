import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  where,
  serverTimestamp,
  getDoc,
  onSnapshot,
  arrayUnion,
} from 'firebase/firestore';

// ─── Posts ──────────────────────────────────────────────

export async function fetchPosts(limitCount = 20) {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeToPosts(limitCount = 20, callback) {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(posts);
  });
}

export async function createPost({ authorId, authorName, authorPhoto, content, imageUrl = null, visibility = 'public' }) {
  return addDoc(collection(db, 'posts'), {
    authorId,
    authorName,
    authorPhoto,
    content,
    imageUrl,
    likes: 0,
    comments: 0,
    visibility,
    createdAt: serverTimestamp(),
  });
}

export async function deletePost(postId) {
  return deleteDoc(doc(db, 'posts', postId));
}

export async function toggleLike(postId, userId) {
  const likeRef = doc(db, 'posts', postId, 'likes', userId);
  const likeSnap = await getDoc(likeRef);

  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  const currentLikes = postSnap.data()?.likes || 0;

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(postRef, { likes: Math.max(0, currentLikes - 1) });
    return false;
  } else {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(likeRef, { userId, createdAt: serverTimestamp() });
    await updateDoc(postRef, { likes: currentLikes + 1 });
    return true;
  }
}

// ─── Users / Discover ───────────────────────────────────

export async function fetchUsers(limitCount = 20) {
  const q = query(collection(db, 'users'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function searchUsers(searchTerm) {
  // Firestore doesn't support native full-text search, so we query by name prefix
  const q = query(
    collection(db, 'users'),
    where('name', '>=', searchTerm),
    where('name', '<=', searchTerm + '\uf8ff'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Connection Requests ────────────────────────────────

export async function sendConnectionRequest({ senderId, senderName, senderProfileImageUrl, receiverId, receiverName, receiverProfileImageUrl, message }) {
  const docRef = await addDoc(collection(db, 'connection_requests'), {
    senderId,
    senderName,
    senderProfileImageUrl: senderProfileImageUrl || null,
    receiverId,
    receiverName,
    receiverProfileImageUrl: receiverProfileImageUrl || null,
    message: message || "Hi! I'd like to connect with you.",
    responseMessage: null,
    status: 'pending',
    respondedAt: null,
    createdAt: serverTimestamp(),
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function fetchPendingRequests(userId) {
  const q = query(
    collection(db, 'connection_requests'),
    where('receiverId', '==', userId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function respondToRequest(req, status) {
  // If accepted, also create the connection document using raw data from `req`
  if (status === 'accepted') {
    await addDoc(collection(db, 'connections'), {
      users: [req.senderId, req.receiverId],
      createdAt: serverTimestamp(),
    });
  }

  return updateDoc(doc(db, 'connection_requests', req.id), {
    status,
    respondedAt: serverTimestamp(),
  });
}

// ─── Groups ─────────────────────────────────────────────

export async function fetchGroups(userId) {
  const q = query(
    collection(db, 'groups'),
    where('members', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createGroup({ name, createdBy, members = [] }) {
  return addDoc(collection(db, 'groups'), {
    name,
    createdBy,
    members: [createdBy, ...members],
    createdAt: serverTimestamp(),
  });
}

// ─── Connections ────────────────────────────────────────

export async function fetchConnections(userId) {
  const q = query(
    collection(db, 'connections'),
    where('users', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchPopulatedConnections(userId) {
  const connections = await fetchConnections(userId);
  const ids = new Set();
  connections.forEach(conn => {
    conn.users?.forEach(uid => {
      if (uid !== userId) ids.add(uid);
    });
  });

  const idsArray = Array.from(ids);
  if (idsArray.length === 0) return [];

  const profiles = [];
  for (let i = 0; i < idsArray.length; i += 10) {
    const chunk = idsArray.slice(i, i + 10);
    const qDoc = query(collection(db, 'users'), where('uid', 'in', chunk));
    const snapshot = await getDocs(qDoc);
    snapshot.docs.forEach(d => profiles.push({ id: d.id, ...d.data() }));
  }
  return profiles;
}

// ─── Helpers ────────────────────────────────────────────

export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp._seconds * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
