"use client";

import React from 'react';
import { Plus } from 'lucide-react';

export const FAB = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 p-4 rounded-2xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all duration-300 z-50"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
};
