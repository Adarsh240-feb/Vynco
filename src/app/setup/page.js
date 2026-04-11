"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, AtSign, Phone, Building2, ArrowLeft, Check, Zap } from 'lucide-react';

export default function SetupPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    company: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!user) return;
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.fullName,
        fullName: formData.fullName,
        username: formData.username.toLowerCase().replace(/\s/g, ''),
        email: user.email,
        phone: formData.phone,
        organization: formData.company,
        company: formData.company,
        photoURL: user.photoURL || null,
        bio: '',
        connectionsCount: 0,
        postsCount: 0,
        isOnboarded: true,
        theme: 'sapphire',
        createdAt: serverTimestamp(),
      }, { merge: true });

      // Also create their digital card
      await setDoc(doc(db, 'digital_cards', formData.username.toLowerCase().replace(/\s/g, '')), {
        uid: user.uid,
        name: formData.fullName,
        username: formData.username.toLowerCase().replace(/\s/g, ''),
        phone: formData.phone,
        email: user.email,
        organization: formData.company,
        photoURL: user.photoURL || null,
        socialLinks: {},
      });

      // Mark onboarding complete
      await setDoc(doc(db, 'onboarding', user.uid), {
        completed: true,
        step: 2,
        updatedAt: serverTimestamp(),
      });

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.fullName.trim() && formData.username.trim();

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
              Almost there! Tell us about yourself.
            </h2>
            <p className="text-sapphire-400 text-lg leading-relaxed">
              Complete your profile so others can find and connect with you. This information will appear on your digital business card.
            </p>
          </div>

          <div className="relative z-10 mt-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-1.5 rounded-full bg-cyan-neon shadow-[0_0_10px_rgba(0,229,255,0.6)]" />
                <div className="w-8 h-1.5 rounded-full bg-cyan-neon shadow-[0_0_10px_rgba(0,229,255,0.6)]" />
              </div>
              <span className="text-sapphire-500 text-sm">Step 2 of 2 &mdash; Personal Information</span>
            </div>
          </div>
        </div>

        {/* Right — Form Panel */}
        <div className="p-8 sm:p-12">
          {/* Mobile step indicator */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-1.5 rounded-full bg-cyan-neon shadow-[0_0_10px_rgba(0,229,255,0.6)]" />
              <div className="w-8 h-1.5 rounded-full bg-cyan-neon shadow-[0_0_10px_rgba(0,229,255,0.6)]" />
            </div>
            <span className="text-sapphire-500 text-sm">Step 2 of 2</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Personal Information</h2>
            <p className="text-sapphire-400">Tell us a bit about yourself so we can set up your profile.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="text-sapphire-400 text-sm font-medium mb-2 block">Full Name <span className="text-red-400">*</span></label>
              <Input
                placeholder="Enter your full name"
                icon={User}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sapphire-400 text-sm font-medium mb-2 block">Username <span className="text-red-400">*</span></label>
              <Input
                placeholder="Choose a unique username"
                icon={AtSign}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sapphire-400 text-sm font-medium mb-2 block">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                icon={Phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sapphire-400 text-sm font-medium mb-2 block">Company / College</label>
              <Input
                placeholder="Enter your company or college name"
                icon={Building2}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded bg-sapphire-900 border-sapphire-700 text-cyan-neon focus:ring-cyan-neon"
              />
              <span className="text-sapphire-500 text-sm leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-cyan-neon hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-cyan-neon hover:underline">Privacy Policy</a>
              </span>
            </label>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="secondary"
                onClick={() => router.push('/auth')}
                className="flex-shrink-0 !w-auto px-6"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !isFormValid || !agreed}
                className="flex-1"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                {!loading && <Check className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
