"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Share2, Download, UserCircle, CheckCircle2 } from 'lucide-react';
import { subscribeToPopulatedConnections } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Preview() {
  const router = useRouter();
  const [user, setUser] = useState(null);
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
    const unsub = subscribeToPopulatedConnections(user.uid, (data) => {
      setConnections(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-sapphire-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-neon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sapphire-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-cyan-neon/[0.05] rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-neon/10 text-cyan-neon mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Connected!</h1>
          <p className="text-sapphire-400 text-sm">
            Your connection details are now saved securely. If you don't have the application, we've sent a link to download it!
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl mb-6">
          <h3 className="text-sm font-semibold text-sapphire-300 uppercase tracking-widest mb-4">Recent Connections</h3>
          <div className="space-y-4">
            {connections.length === 0 ? (
              <p className="text-center text-sapphire-500 py-4 text-sm font-medium">No recent connections yet.</p>
            ) : (
              connections.map((conn) => {
                const displayName = conn.otherUser?.fullName || conn.otherUser?.name;
                const displayImg = conn.otherUser?.photoURL || conn.otherUser?.profileImageUrl;

                return (
                  <div key={conn.id} className="flex items-center gap-4 p-3 rounded-xl bg-sapphire-900/40 border border-sapphire-800">
                    <div className="w-10 h-10 rounded-full bg-sapphire-800 flex items-center justify-center overflow-hidden shrink-0">
                      {displayImg ? (
                        <img src={displayImg} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-6 h-6 text-sapphire-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{displayName || "Unknown User"}</p>
                      <p className="text-cyan-neon text-xs">Connected</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/share?from=preview')}
            className="py-3.5 px-4 bg-sapphire-800 hover:bg-sapphire-700 text-white font-medium rounded-xl border border-sapphire-600 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share My QR
          </button>
          <button 
            onClick={() => router.push('/download')}
            className="py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download App
          </button>
        </div>
      </motion.div>
    </div>
  );
}
