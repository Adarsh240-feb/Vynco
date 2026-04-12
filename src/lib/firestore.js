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
  setDoc,
  where,
  serverTimestamp,
  getDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  writeBatch,
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
  // Username search is prefix-based and case-insensitive due to normalization.
  const normalized = (searchTerm || '').trim().toLowerCase().replace(/^@/, '');
  if (!normalized) return [];

  const q = query(
    collection(db, 'users'),
    where('username', '>=', normalized),
    where('username', '<=', normalized + '\uf8ff'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchUserByUsername(username) {
  const normalized = (username || '').trim().toLowerCase();
  if (!normalized) return null;

  const q = query(
    collection(db, 'users'),
    where('username', '==', normalized),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
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

export async function fetchSentPendingRequests(userId) {
  const q = query(
    collection(db, 'connection_requests'),
    where('senderId', '==', userId),
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

export async function fetchGroups(userId, legacyMemberId = null) {
  const memberIds = [userId];
  if (legacyMemberId && legacyMemberId !== userId) {
    memberIds.push(legacyMemberId);
  }

  const groupsQuery = memberIds.length > 1
    ? query(collection(db, 'groups'), where('members', 'array-contains-any', memberIds))
    : query(collection(db, 'groups'), where('members', 'array-contains', userId));

  const snapshot = await getDocs(groupsQuery);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createGroup({ name, createdBy, members = [] }) {
  return addDoc(collection(db, 'groups'), {
    name,
    createdBy,
    members: [createdBy, ...members],
    lastMessage: null,
    lastMessageTime: null,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToGroupMessages(groupId, callback) {
  const q = query(
    collection(db, 'groups', groupId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendGroupMessage(groupId, { senderId, senderName, text }) {
  const messageRef = await addDoc(collection(db, 'groups', groupId, 'messages'), {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'groups', groupId), {
    lastMessage: text,
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return messageRef.id;
}

export async function addMembersToGroup(groupId, memberIds = []) {
  if (!memberIds.length) return;

  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayUnion(...memberIds),
    updatedAt: serverTimestamp(),
  });
}

export async function removeMemberFromGroup(groupId, memberId) {
  if (!groupId || !memberId) return;

  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayRemove(memberId),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGroup(groupId) {
  if (!groupId) return;

  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const messagesSnapshot = await getDocs(messagesRef);

  // Firestore batches are limited; chunk deletes to stay within limits.
  const docs = messagesSnapshot.docs;
  const chunkSize = 400;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + chunkSize);
    chunk.forEach((messageDoc) => batch.delete(messageDoc.ref));
    await batch.commit();
  }

  await deleteDoc(doc(db, 'groups', groupId));
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

// ─── Chats & Messages ─────────────────────────────────────

export function subscribeToChats(userId, callback) {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function getOrCreateChat(user1Id, user2Id, user1Info, user2Info) {
  // Query for existing chat where both users are participants
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', user1Id)
  );
  const snapshot = await getDocs(q);
  
  let existingChat = null;
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.participants && data.participants.includes(user2Id)) {
      existingChat = { id: docSnap.id, ...data };
    }
  });

  if (existingChat) return existingChat;

  // Create new chat
  const chatRef = await addDoc(collection(db, 'chats'), {
    participants: [user1Id, user2Id],
    participantInfo: {
      [user1Id]: user1Info,
      [user2Id]: user2Info,
    },
    lastMessage: null,
    lastMessageTime: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCount: {
      [user1Id]: 0,
      [user2Id]: 0
    }
  });

  return { id: chatRef.id, participants: [user1Id, user2Id] };
}

export function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendMessage(chatId, senderId, targetUserId, text) {
  const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text,
    createdAt: serverTimestamp(),
    isRead: false
  });

  // Update parent chat document
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    const data = chatSnap.data();
    const currentUnread = data.unreadCount?.[targetUserId] || 0;
    
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCount.${targetUserId}`]: currentUnread + 1,
    });
  }

  return messageRef.id;
}

export async function markChatAsRead(chatId, userId) {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`unreadCount.${userId}`]: 0
  });
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
  const timeText = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (diffMins < 1) return timeText;
  if (diffMins < 60) return `${diffMins}m ago • ${timeText}`;
  if (diffHours < 24) return `${diffHours}h ago • ${timeText}`;
  if (diffDays < 7) return `${diffDays}d ago • ${timeText}`;
  return `${date.toLocaleDateString()} • ${timeText}`;
}

function normalizeUsername(username) {
  return username.trim().toLowerCase().replace(/\s+/g, '');
}

export async function updateUserProfile(uid, updates, previousUsername = null) {
  const userRef = doc(db, 'users', uid);
  const nextUsername = updates.username ? normalizeUsername(updates.username) : previousUsername;
  const profilePayload = {
    ...updates,
    ...(updates.username ? { username: nextUsername } : {}),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, profilePayload, { merge: true });

  if (nextUsername) {
    await setDoc(doc(db, 'digital_cards', nextUsername), {
      uid,
      name: updates.fullName ?? updates.name ?? '',
      username: nextUsername,
      phone: updates.phone ?? null,
      email: updates.email ?? null,
      organization: updates.company ?? updates.organization ?? null,
      photoURL: updates.photoURL ?? null,
      bio: updates.bio ?? '',
      socialLinks: updates.socialLinks ?? {},
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (previousUsername && previousUsername !== nextUsername) {
      await deleteDoc(doc(db, 'digital_cards', previousUsername)).catch(() => {});
    }
  }

  return nextUsername;
}
