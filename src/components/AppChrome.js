"use client";

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const showFooter = pathname === '/';

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-14 sm:pt-16">
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  );
}