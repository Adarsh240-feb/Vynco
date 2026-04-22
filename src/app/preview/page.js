"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Share2, UserCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { subscribeToPopulatedConnections, fetchUserById } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Preview() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/');
      }
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    fetchUserById(user.uid)
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));

    const unsub = subscribeToPopulatedConnections(user.uid, (data) => {
      setConnections(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-[100dvh] bg-sapphire-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-neon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const ownerName = profile?.fullName || profile?.name || user.displayName || 'Your profile';
  const ownerTitle =
    profile?.designation ||
    profile?.title ||
    profile?.organization ||
    profile?.company ||
    user.email ||
    'Your Vynco identity is now active';
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/card/${user.uid}` : `https://m.vynco.app/card/${user.uid}`;

  const visibleConnections = connections.slice(0, 4);

  return (
    <div className="min-h-[100dvh] bg-sapphire-950 flex flex-col items-stretch sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full min-h-[100dvh] sm:min-h-0 max-w-none sm:max-w-[430px] bg-white border-0 sm:border border-sapphire-700 rounded-none sm:rounded-[2.2rem] px-5 sm:px-6 py-6 shadow-none sm:shadow-[0_28px_70px_rgba(16,18,35,0.14)]"
      >
        <div className="text-center">
          <p className="text-[16px] font-semibold text-cyan-neon">Your Vynco card is ready</p>

          <div className="mt-4 mx-auto h-[120px] w-[130px] rounded-3xl bg-[#efedf7] border border-sapphire-700 flex items-center justify-center">
            <div className="bg-white p-2.5 rounded-xl shadow-sm">
              <QRCode value={profileUrl} size={74} fgColor="#5b4ce6" bgColor="#ffffff" />
            </div>
          </div>

          <h1 className="mt-3 text-[28px] sm:text-[33px] leading-none tracking-[-0.03em] font-semibold text-[#151826]">{ownerName}</h1>
          <p className="mt-1 text-[13px] sm:text-[14px] text-sapphire-500">{ownerTitle}</p>

          <button 
            onClick={() => router.push('/share?from=preview')}
            className="w-full mt-4 py-4 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:brightness-105 text-white font-bold rounded-2xl shadow-[0_10px_24px_rgba(91,76,230,0.3)] transition-all flex items-center justify-center gap-2 text-[14px] leading-none"
          >
            <Share2 className="w-5 h-5" />
            Share my card now
          </button>

          <div className="mt-4 pt-4 border-t border-sapphire-700 text-left">
            <p className="text-sapphire-500 text-[14px] font-semibold uppercase tracking-[0.08em]">Connected Tonight</p>

            <div className="mt-5 space-y-4">
              {visibleConnections.length === 0 ? (
                <p className="text-center text-sapphire-500 py-4 text-sm font-medium">No connections yet.</p>
              ) : (
                visibleConnections.map((conn) => {
                  const displayName = conn.otherUser?.fullName || conn.otherUser?.name || 'Unknown User';
                  const displayImg = conn.otherUser?.photoURL || conn.otherUser?.profileImageUrl;
                  const initials = displayName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(part => part[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <div key={conn.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#efedf7] flex items-center justify-center overflow-hidden shrink-0 text-cyan-neon font-semibold text-sm">
                        {displayImg ? (
                          <img src={displayImg} alt="avatar" className="w-full h-full object-cover" />
                        ) : initials ? (
                          initials
                        ) : (
                          <UserCircle className="w-5 h-5 text-sapphire-400" />
                        )}
                      </div>
                      <p className="flex-1 min-w-0 truncate text-[#151826] text-[16px] font-medium">{displayName}</p>
                      <span className="text-[14px] font-semibold text-[#5ca18a]">Saved</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
