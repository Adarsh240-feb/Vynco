"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchUserById } from '@/lib/firestore';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, MapPin } from 'lucide-react';

export default function CardPreview() {
  const { userId } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;
      try {
        const data = await fetchUserById(userId);
        if (data) {
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-sapphire-950 flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-[#5b4ce6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  

  if (!profile) {
    return (
      <div className="min-h-[100dvh] bg-sapphire-950 flex items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm rounded-[2.2rem] bg-white p-8 shadow-[0_35px_80px_rgba(6,10,30,0.45)]">
          <p className="text-[#121326] font-medium mb-4">Profile not found.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-[#5b4ce6] rounded-xl text-white font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleSaveContact = () => {
    const displayName = encodeURIComponent(primaryName);
    router.push(`/verify?connectWith=${userId}&connectWithName=${displayName}`);
  };

  const handleCreateCard = () => {
    router.push(`/verify?action=create`);
  };

  const getSocialButtons = () => {
    const collected = [];
    const addIfValid = (rawKey, rawUrl) => {
      if (!rawUrl || typeof rawUrl !== 'string') return;
      const trimmed = rawUrl.trim();
      if (trimmed.length < 4) return;

      const key = rawKey.toLowerCase();
      const lowerUrl = trimmed.toLowerCase();

      let kind = 'link';
      let label = 'Website';
      if (key.includes('linkedin') || lowerUrl.includes('linkedin.com')) {
        kind = 'linkedin';
        label = 'LinkedIn';
      } else if (
        key.includes('whatsapp') ||
        key === 'wa' ||
        lowerUrl.includes('wa.me') ||
        lowerUrl.includes('whatsapp')
      ) {
        kind = 'whatsapp';
        label = 'WhatsApp';
      } else if (
        key.includes('twitter') ||
        key === 'x' ||
        lowerUrl.includes('twitter.com') ||
        lowerUrl.includes('x.com')
      ) {
        kind = 'twitter';
        label = 'Twitter';
      } else if (key.includes('email') || trimmed.includes('@')) {
        kind = 'email';
        label = 'Email';
      }

      let url = trimmed;
      if (kind === 'email' && !url.startsWith('mailto:')) {
        url = `mailto:${url}`;
      } else if (kind !== 'email' && !/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }

      collected.push({ kind, label, url });
    };

    if (profile.socialLinks && typeof profile.socialLinks === 'object') {
      Object.entries(profile.socialLinks).forEach(([k, v]) => addIfValid(k, v));
    }

    addIfValid('linkedin', profile.linkedinProfile || profile.linkedin || profile.linkedIn);
    addIfValid('whatsapp', profile.whatsapp || profile.whatsApp || profile.wa);
    addIfValid('twitter', profile.twitter || profile.x);
    addIfValid('email', profile.email);

    const unique = [];
    const seenKinds = new Set();
    const seenUrls = new Set();
    collected.forEach(item => {
      if (!seenKinds.has(item.kind) && !seenUrls.has(item.url)) {
        unique.push(item);
        seenKinds.add(item.kind);
        seenUrls.add(item.url);
      }
    });

    const priority = ['linkedin', 'whatsapp', 'twitter', 'email', 'link'];
    unique.sort((a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind));
    return unique.slice(0, 3);
  };
  const socialsList = getSocialButtons();

  const primaryName = profile.fullName || profile.name || 'Unknown User';
  const firstName = primaryName.split(' ')[0] || 'Contact';
  const role = profile.designation || profile.title;
  const company = profile.organization || profile.company;
  const badge = profile.eventName || profile.event || 'TechFest 2025';
  const initials = primaryName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  const fallbackButtons = [
    { kind: 'linkedin', label: 'LinkedIn' },
    { kind: 'whatsapp', label: 'WhatsApp' },
    { kind: 'twitter', label: 'Twitter' },
  ];

  const buttonToneByKind = {
    linkedin: 'bg-[#f0eef9] text-[#4f4288]',
    whatsapp: 'bg-[#e5f3ee] text-[#2f5b4d]',
    twitter: 'bg-[#efeff4] text-[#595b68]',
    email: 'bg-[#eef0ff] text-[#4b4eb7]',
    link: 'bg-[#efeff4] text-[#595b68]',
  };

  return (
    <div className="min-h-[100dvh] bg-sapphire-950 flex items-stretch sm:items-center justify-center p-0 sm:p-6">
      <div className="w-full min-h-[100dvh] sm:min-h-0 max-w-none sm:max-w-[430px] rounded-none sm:rounded-[2.5rem] bg-white p-5 sm:p-6 shadow-none sm:shadow-[0_38px_90px_rgba(5,7,20,0.55)] border-0 sm:border border-white/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#efecfb] px-3 py-1 text-[13px] font-semibold text-[#4f45b8]">
            <span className="h-2 w-2 rounded-full bg-[#6b5cff]" />
            {badge}
          </span>

          <div className="mt-5 flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-[#eceaf6] text-[#5b4ce6] overflow-hidden flex items-center justify-center shrink-0">
              {profile.photoURL || profile.profileImageUrl ? (
                <img
                  src={profile.photoURL || profile.profileImageUrl}
                  alt={primaryName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold tracking-wide">{initials || 'U'}</span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-[28px] sm:text-[34px] leading-none tracking-[-0.03em] text-[#131426] font-semibold truncate">{primaryName}</h1>
              {(role || company) && (
                <p className="text-[20px] leading-snug text-[#5f6170] font-medium mt-1 truncate">
                  {role || 'Professional'}
                  {role && company ? ' · ' : ''}
                  {company || ''}
                </p>
              )}
              {profile.location && (
                <p className="text-[16px] text-[#8b8d9a] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </p>
              )}
            </div>
          </div>

          <div className="my-6 h-px bg-[#e7e7ef]" />

          <div className="grid grid-cols-3 gap-2.5">
            {(socialsList.length ? socialsList : fallbackButtons).map((item, index) => {
              const tone = buttonToneByKind[item.kind] || buttonToneByKind.link;
              const baseClasses = `rounded-2xl py-3 px-2 text-center text-[15px] font-semibold transition ${tone}`;

              if (!item.url) {
                return (
                  <span key={`${item.kind}-${index}`} className={`${baseClasses} opacity-80`}>
                    {item.label}
                  </span>
                );
              }

              return (
                <a
                  key={`${item.kind}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${baseClasses} hover:brightness-[0.97]`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-[#efedf6] px-4 py-3.5 text-left">
            <p className="text-[15px] font-semibold text-[#666978]">About</p>
            <p className="text-[15px] leading-7 text-[#3b3d4c] mt-1 whitespace-pre-wrap">
              {profile.bio || `${firstName} is open to connecting and sharing details through this digital card.`}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleSaveContact}
              className="w-full rounded-2xl bg-[#5b4ce6] py-4 px-4 text-white font-semibold text-[16px] sm:text-[22px] shadow-[0_9px_24px_rgba(91,76,230,0.35)] hover:bg-[#5143d4] transition flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Save {firstName}&apos;s contact
            </button>

            <button
              onClick={handleCreateCard}
              className="w-full rounded-2xl border border-[#d7d9e4] bg-white py-4 px-4 text-[#151826] font-semibold text-[16px] sm:text-[22px] hover:bg-[#f8f8fd] transition flex items-center justify-center gap-2"
            >
              Get my own card
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {(profile.designation || profile.title || profile.organization || profile.company) && (
            <p className="mt-4 text-center text-[13px] text-[#989aa8]">
              {role || 'Professional'}
              {role && company ? ' at ' : ''}
              {company || ''}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
