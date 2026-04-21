"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent body scroll when mobile menu is open (disabled for dropdown style)
  useEffect(() => {
    // if (mobileOpen) {
    //   document.body.style.overflow = 'hidden';
    // } else {
    //   document.body.style.overflow = '';
    // }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-sapphire-700 shadow-[0_8px_24px_rgba(20,24,45,0.06)]">
      <div className="section-container">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-neon to-cyan-dark flex items-center justify-center shadow-[0_10px_25px_rgba(91,76,230,0.2)] group-hover:shadow-[0_12px_30px_rgba(91,76,230,0.28)] transition-all" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#151826]">Vynco</span>
          </Link>

          <div className="hidden md:block" />

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/download"
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-white shadow-[0_10px_24px_rgba(91,76,230,0.26)] hover:shadow-[0_12px_30px_rgba(91,76,230,0.33)] transition-all"
            >
              Download
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 -mr-2 text-[#1f2333] bg-sapphire-800 border border-sapphire-700 rounded-xl shadow-sm transition-all active:scale-95"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown — dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 sm:top-16 left-0 right-0 bg-white border-b border-sapphire-700 z-40 animate-slide-down shadow-lg">
          <div className="section-container py-6 flex flex-col gap-2">
            <Link
              href="/download"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-3 px-5 text-base font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-white"
            >
              Download
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
