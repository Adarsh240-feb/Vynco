import { Suspense } from 'react';
import VerifyClient from './VerifyClient';

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-sapphire-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-neon border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
