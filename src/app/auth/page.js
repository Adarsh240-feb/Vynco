"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, Globe, Zap, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const checkProfileAndRedirect = async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists() && snap.data().isOnboarded) {
      router.push('/dashboard');
    } else {
      router.push('/setup');
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await checkProfileAndRedirect(cred.user.uid);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push('/setup');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await checkProfileAndRedirect(cred.user.uid);
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 overflow-hidden rounded-3xl glass-panel glow-border">

        {/* Left — Branding Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-sapphire-800/80 to-sapphire-900/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-neon/[0.06] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-dark/[0.08] rounded-full blur-[80px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-12">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-neon to-cyan-dark flex items-center justify-center">
                <Zap className="w-5 h-5 text-sapphire-900" />
              </div>
              <span className="text-2xl font-bold text-white">Vynco</span>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              {isLogin ? 'Welcome back to your network.' : 'Start building your digital identity.'}
            </h2>
            <p className="text-sapphire-400 text-lg leading-relaxed">
              {isLogin
                ? 'Sign in to manage your connections, share updates, and grow your professional network.'
                : 'Create your account in seconds. Your digital business card and professional network await.'}
            </p>
          </div>

          {!isLogin && (
            <div className="relative z-10 mt-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-cyan-neon shadow-[0_0_10px_rgba(0,229,255,0.6)]" />
                  <div className="w-8 h-1.5 rounded-full bg-sapphire-700" />
                </div>
                <span className="text-sapphire-500 text-sm">Step 1 of 2 &mdash; Create Account</span>
              </div>
            </div>
          )}
        </div>

        {/* Right — Form Panel */}
        <div className="p-8 sm:p-12">
          {/* Mobile step indicator for signup */}
          {!isLogin && (
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-1.5 rounded-full bg-cyan-neon shadow-[0_0_10px_rgba(0,229,255,0.6)]" />
                <div className="w-8 h-1.5 rounded-full bg-sapphire-700" />
              </div>
              <span className="text-sapphire-500 text-sm">Step 1 of 2</span>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-sapphire-400">
              {isLogin ? 'Enter your credentials to continue' : 'Fill in your email and password to get started'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="text-sapphire-400 text-sm font-medium mb-2 block">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sapphire-400 text-sm font-medium mb-2 block">Password</label>
              <Input
                type="password"
                placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isLogin && (
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm text-sapphire-500 cursor-pointer">
                  <input type="checkbox" className="rounded bg-sapphire-900 border-sapphire-700 text-cyan-neon focus:ring-cyan-neon w-4 h-4" />
                  Remember me
                </label>
                <a href="#" className="text-sm text-cyan-dark hover:text-cyan-neon transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Continue'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-sapphire-500 uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3 rounded-2xl glass-input text-white font-medium flex items-center justify-center gap-3 hover:border-white/20 transition-all"
          >
            <Globe className="w-5 h-5 text-cyan-dark" />
            Google
          </button>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-sapphire-500 hover:text-white transition-colors text-sm"
            >
              {isLogin ? "Don\u0027t have an account? " : "Already have an account? "}
              <span className="text-cyan-neon font-semibold">
                {isLogin ? 'Create one' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
