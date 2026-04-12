"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Zap, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How it Works', href: '/#how-it-works' },
  ];

  const authLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Connections', href: '/connections' },
    { label: 'Messages', href: '/messages' },
    { label: 'Settings', href: '/settings' },
  ];

  const links = user ? authLinks : publicLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-t-0 border-x-0 rounded-none">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-neon to-cyan-dark flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all" />
            <span className="text-xl font-bold tracking-tight text-white">Vynco</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${pathname === link.href
                  ? 'text-cyan-neon'
                  : 'text-sapphire-400 hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && !user && (
              <>
                <Link
                  href="/auth"
                  className="text-sm font-medium text-sapphire-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
            {!loading && user && (
              <Link
                href="/dashboard"
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-sapphire-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden glass-panel border-t border-white/5 px-6 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm font-medium py-2 ${pathname === link.href ? 'text-cyan-neon' : 'text-sapphire-400 hover:text-white'
                }`}
            >
              {link.label}
            </Link>
          ))}
          {!loading && !user && (
            <Link
              href="/auth"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center mt-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900"
            >
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
