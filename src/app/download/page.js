"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { subscribeToPopulatedConnections } from '@/lib/firestore';

export default function DownloadPage() {
  const [totalConnections, setTotalConnections] = useState(0);
  const [connectionUsers, setConnectionUsers] = useState([]);

  useEffect(() => {
    let unsubConnections = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubConnections) {
        unsubConnections();
        unsubConnections = null;
      }

      if (!currentUser) {
        setTotalConnections(0);
        setConnectionUsers([]);
        return;
      }

      unsubConnections = subscribeToPopulatedConnections(currentUser.uid, (data) => {
        const users = data
          .map((item) => ({
            name: item.otherUser?.fullName || item.otherUser?.name,
            image: item.otherUser?.photoURL || item.otherUser?.profileImageUrl || null,
          }))
          .filter((item) => Boolean(item.name));

        setConnectionUsers(users);
        setTotalConnections(data.length);
      });
    });

    return () => {
      if (unsubConnections) unsubConnections();
      unsubAuth();
    };
  }, []);

  const usersToShow = connectionUsers.slice(0, 3);

  const tonightConnections = useMemo(() => {
    const tones = [
      'bg-[#f1eefc] text-[#5b4ce6]',
      'bg-[#eaf5ee] text-[#3f8d69]',
      'bg-[#fff0e8] text-[#bb6a3f]',
    ];

    return usersToShow.map((item, index) => {
      const name = item.name;
      const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

      return {
        name,
        image: item.image,
        initials: initials || 'VC',
        tone: tones[index % tones.length],
      };
    });
  }, [usersToShow]);

  const displayCount = totalConnections;
  const moreCount = Math.max(displayCount - tonightConnections.length, 0);
  const hasConnections = displayCount > 0;

  return (
    <div className="min-h-[100dvh] bg-sapphire-950 flex items-stretch sm:items-center justify-center p-0 sm:p-6">

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full min-h-[100dvh] sm:min-h-0 max-w-none sm:max-w-[430px] bg-white border-0 sm:border border-sapphire-700 rounded-none sm:rounded-[2.2rem] px-5 sm:px-6 py-6 shadow-none sm:shadow-[0_28px_70px_rgba(16,18,35,0.14)]"
      >
        <div className="text-center">
          <p className="text-[42px] sm:text-[54px] leading-none font-semibold tracking-[-0.04em] text-[#151826]">{displayCount}</p>
          <p className="mt-1 text-[16px] text-sapphire-500">{hasConnections ? 'people you met tonight' : 'no connections yet'}</p>
        </div>

        <div className="mt-4 rounded-3xl bg-[#efedf7] border border-sapphire-700 p-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-sapphire-500">Tonight&apos;s Connections</p>

          <div className="mt-4 space-y-4">
            {hasConnections ? (
              tonightConnections.map((person) => (
                <div key={person.name} className="flex items-center gap-3">
                  <span className={`h-8 w-8 rounded-full text-[13px] font-semibold flex items-center justify-center overflow-hidden ${person.tone}`}>
                    {person.image ? (
                      <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      person.initials
                    )}
                  </span>
                  <p className="text-[16px] font-medium text-[#171b2c]">{person.name}</p>
                </div>
              ))
            ) : (
              <p className="text-[15px] text-sapphire-500">No connections</p>
            )}
          </div>

          {moreCount > 0 && <p className="mt-4 text-[14px] text-sapphire-500">+ {moreCount} more</p>}
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-neon/30 bg-[#efedf7] p-4">
          <p className="text-[18px] font-semibold text-[#3f3a7a]">Don&apos;t lose the context</p>
          <p className="text-[14px] text-[#4f4a8f] mt-1 leading-relaxed">
            Tag, add notes, and set follow-ups in the Vynco app before memory fades.
          </p>
        </div>

        <a 
          href="https://play.google.com/store/apps/details?id=com.vynco.app"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-5 py-4 px-6 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:brightness-105 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(91,76,230,0.3)] text-[16px]"
        >
          <Download className="w-5 h-5" />
          Download Vynco app
        </a>

        <button className="w-full mt-3 py-4 px-6 bg-white border border-sapphire-600 text-sapphire-500 font-medium rounded-2xl transition-all cursor-not-allowed opacity-70 flex items-center justify-center gap-3">
          <Smartphone className="w-5 h-5" />
          iOS Beta Coming Soon
        </button>

      </motion.div>
    </div>
  );
}
