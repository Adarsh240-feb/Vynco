"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Link as LinkIcon, Download, Copy, Check } from 'lucide-react';

function ShareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showBack = searchParams.get('from') === 'preview';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sapphire-950 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-cyan-neon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/card/${user.uid}` : `https://m.vynco.app/card/${user.uid}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-sapphire-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] bg-cyan-neon/[0.08] rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center glow-border"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Share Your QR</h1>
        <p className="text-sapphire-400 text-sm mb-8">
          Let others scan this code to instantly connect with you on Vynco.
        </p>

        <div className="bg-white p-4 rounded-3xl inline-block mb-8 shadow-[0_0_40px_rgba(0,229,255,0.2)] border-4 border-cyan-neon/30">
          <QRCode 
            value={profileUrl}
            size={200}
            level="H"
            className="rounded-xl"
            fgColor="#0a0f1c"
          />
        </div>

        <div className="flex items-center gap-2 bg-sapphire-900/50 border border-sapphire-700 rounded-xl p-1 mb-6">
          <div className="flex-1 overflow-hidden px-3">
            <p className="text-sapphire-300 text-xs truncate max-w-[200px]">{profileUrl}</p>
          </div>
          <button 
            onClick={copyToClipboard}
            className="p-2.5 bg-sapphire-800 hover:bg-cyan-neon hover:text-sapphire-900 text-sapphire-300 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {showBack ? (
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => router.push('/preview')}
              className="flex-1 py-3.5 px-4 bg-transparent border border-sapphire-600 text-white font-medium rounded-xl hover:bg-white/5 transition-all"
            >
              Back
            </button>
            <button 
              onClick={() => router.push('/download')}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.2)]"
            >
               Get App
            </button>
          </div>
        ) : (
          <div className="flex w-full">
            <button 
              onClick={() => router.push('/download')}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.2)]"
            >
               <Download className="w-5 h-5" />
               Get Vynco App
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function Share() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sapphire-950 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-cyan-neon border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
