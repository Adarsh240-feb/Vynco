"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Loader2, Phone } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { createDirectConnection, ensureUserExists } from '@/lib/firestore';

const RESEND_COOLDOWN_SECONDS = 300;
const RETRY_COOLDOWN_SECONDS = 5;

const formatCountdown = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export default function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectWithId = searchParams.get('connectWith');

  const [step, setStep] = useState('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.error('Error clearing reCAPTCHA:', e);
        }
      }
      recaptchaVerifierRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0 && retryCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setRetryCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown, retryCooldown]);

  const normalizePhoneNumber = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('+')) {
      const digits = trimmed.replace(/[^\d+]/g, '');
      return /^\+\d{8,15}$/.test(digits) ? digits : null;
    }

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
    return null;
  };

  const getFirebaseErrorMessage = (err) => {
    switch (err?.code) {
      case 'auth/invalid-phone-number':
        return 'Enter a valid phone number in international format, or a 10-digit US number.';
      case 'auth/too-many-requests':
        return 'Too many OTP requests. Please wait a bit and try again.';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded for this project. Try again later.';
      case 'auth/captcha-check-failed':
        return 'reCAPTCHA verification failed. Refresh the page and try again.';
      case 'auth/code-expired':
        return 'The code expired. Please resend a new code.';
      case 'auth/billing-not-enabled':
        return 'Phone authentication is not enabled. Please contact support to enable it.';
      case 'auth/invalid-verification-code':
        return 'The code is incorrect. Please try again.';
      default:
        return 'Failed to send or verify the code. Check the phone number and try again.';
    }
  };

  const getVerifyErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-verification-code':
        return 'The code is incorrect. Please try again.';
      case 'auth/code-expired':
        return 'The code expired. Please resend a new one.';
      case 'auth/invalid-verification-id':
      case 'auth/session-expired':
        return 'Your verification session expired. Please resend a new code.';
      case 'auth/missing-verification-code':
        return 'Please enter the 6-digit OTP code.';
      case 'auth/invalid-app-credential':
        return 'Verification failed due to app credentials. Refresh and try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait before trying again.';
      default:
        return 'Failed to verify the code. Please try again.';
    }
  };

  const getRecaptchaVerifier = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          },
        });
      } catch (err) {
        console.error('Failed to initialize reCAPTCHA:', err);
        return null;
      }
    }

    return recaptchaVerifierRef.current;
  };

  const sendOtp = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in both name and phone number.');
      return;
    }

    const formattedPhone = normalizePhoneNumber(phone);
    if (!formattedPhone) {
      setError('Enter a valid phone number with country code, or a 10-digit US number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const appVerifier = getRecaptchaVerifier();
      if (!appVerifier) {
        throw new Error('reCAPTCHA failed to initialize. Refresh the page and try again.');
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setVerifiedPhone(formattedPhone);
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      console.error(err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    await sendOtp();
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError('');
    setOtp('');
    setConfirmationResult(null);

    try {
      await sendOtp();
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (retryCooldown > 0) {
      setError(`Please wait ${retryCooldown}s before trying again.`);
      return;
    }

    const otpCode = otp.trim();

    if (!otpCode) {
      setError('Please enter the OTP.');
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setError('Enter a valid 6-digit OTP code.');
      return;
    }

    if (!confirmationResult) {
      setError('No verification session found. Please resend the code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;

      if (user.displayName !== name) {
        await updateProfile(user, { displayName: name });
      }

      await ensureUserExists({
        uid: user.uid,
        fullName: name,
        phoneNumber: verifiedPhone || phone,
      });

      if (connectWithId) {
        await createDirectConnection(user.uid, connectWithId);
        router.push('/preview');
      } else {
        router.push('/share');
      }
    } catch (err) {
      const code = err?.code;
      if (
        code !== 'auth/invalid-verification-code' &&
        code !== 'auth/code-expired' &&
        code !== 'auth/invalid-verification-id' &&
        code !== 'auth/session-expired' &&
        code !== 'auth/missing-verification-code'
      ) {
        console.error(err);
      }
      setRetryCooldown(RETRY_COOLDOWN_SECONDS);
      if (code === 'auth/invalid-verification-code') {
        setOtp('');
      }
      setError(getVerifyErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sapphire-950 flex md:items-center justify-center p-4 sm:p-6 lg:p-8">
      <div id="recaptcha-container" style={{ display: 'none' }}></div>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-neon/[0.05] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 glass-panel p-8 rounded-[2rem] glow-border shadow-2xl mt-10 md:mt-0"
      >
        <div className="w-16 h-16 bg-sapphire-800 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner border border-sapphire-700">
          <Shield className="w-8 h-8 text-cyan-neon" />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {step === 'phone' ? 'Verify your Identity' : 'Enter OTP'}
        </h2>
        <p className="text-sapphire-400 text-sm text-center mb-8">
          {step === 'phone'
            ? 'We need to verify your phone number to securely save this connection.'
            : `We sent a code to ${verifiedPhone || phone}`}
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-sapphire-300 mb-1.5 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-sapphire-900/50 border border-sapphire-700 focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white rounded-xl px-4 py-3 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-sapphire-300 mb-1.5 ml-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-sapphire-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-sapphire-900/50 border border-sapphire-700 focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:to-cyan-400 text-sapphire-950 font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-sapphire-300 mb-1.5 ml-1">6-Digit Code</label>
              <input
                type="text"
                value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-sapphire-900/50 border border-sapphire-700 focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white rounded-xl px-4 py-3 outline-none transition-all tracking-widest text-center text-lg font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading || retryCooldown > 0}
              className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:to-cyan-400 text-sapphire-950 font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : retryCooldown > 0
                  ? `Retry in ${retryCooldown}s`
                  : connectWithId
                    ? 'Verify & Connect'
                    : 'Verify & Build Card'}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || loading || resendCooldown > 0}
              className="w-full py-3 px-4 text-sapphire-400 text-sm font-medium hover:text-white transition-all text-center disabled:opacity-60"
            >
              {resendLoading
                ? 'Resending...'
                : resendCooldown > 0
                  ? `Resend in ${formatCountdown(resendCooldown)}`
                  : "Didn't get a code? Resend"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setConfirmationResult(null);
                setVerifiedPhone('');
              }}
              className="w-full mt-2 py-3 px-4 text-sapphire-400 text-sm font-medium hover:text-white transition-all text-center"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}