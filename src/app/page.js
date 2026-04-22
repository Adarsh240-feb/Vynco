"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Download, QrCode } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex items-stretch sm:items-center justify-center p-0 sm:p-6 bg-sapphire-950 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-neon/[0.08] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d7dcf3]/60 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full min-h-[100dvh] sm:min-h-0 max-w-none sm:max-w-md p-6 sm:p-8 text-center relative z-10"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-dark to-cyan-neon rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#131626] mb-3">
          Vynco <span className="text-gradient">Connect</span>
        </h1>
        <p className="text-sapphire-500 mb-8 text-sm">
          A seamless middleware for the Vynco App ecosystem. To connect with a professional, please scan their unique QR card.
        </p>

        <Link 
          href="/download"
          className="w-full py-3.5 px-4 bg-white hover:bg-sapphire-800 border border-sapphire-700 rounded-xl text-[#1b1f30] font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-5 h-5 text-cyan-neon" />
          Download Vynco App
        </Link>
      </motion.div>
    </div>
  );
}
