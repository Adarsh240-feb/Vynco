"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchUserById } from '@/lib/firestore';
import { motion } from 'framer-motion';
import { UserPlus, QrCode, MapPin, Globe, Mail } from 'lucide-react';

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
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sapphire-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-neon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sapphire-950 flex items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 rounded-3xl w-full max-w-sm">
          <p className="text-white mb-4">Profile not found.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-white/10 rounded-xl text-white font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleSaveContact = () => {
    router.push(`/verify?connectWith=${userId}`);
  };

  const handleCreateCard = () => {
    router.push(`/verify?action=create`);
  };

  const getSocials = () => {
    const list = [];
    const addIfValid = (key, url) => {
      if (url && typeof url === 'string' && url.length > 3) {
        list.push({ key: key.toLowerCase(), url });
      }
    };

    if (profile.socialLinks && typeof profile.socialLinks === 'object') {
      Object.entries(profile.socialLinks).forEach(([k, v]) => addIfValid(k, v));
    }

    addIfValid('linkedinProfile', profile.linkedinProfile || profile.linkedin || profile.linkedIn);
    addIfValid('email', profile.email);

    const unique = [];
    const seenUrls = new Set();
    list.forEach(s => {
      if (!seenUrls.has(s.url)) {
        unique.push(s);
        seenUrls.add(s.url);
      }
    });
    return unique;
  };
  const socialsList = getSocials();

  return (
    <div className="min-h-screen bg-sapphire-950 flex md:items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-neon/[0.05] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sapphire-700/[0.1] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 glass-panel overflow-hidden flex flex-col glow-border rounded-[2rem] shadow-2xl mt-10 md:mt-0"
      >
        {/* Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-tr from-sapphire-800 to-cyan-dark relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Content */}
        <div className="px-6 pb-8 text-center relative mt-[-50px]">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full border-4 border-sapphire-900 bg-sapphire-800 overflow-hidden mb-4 relative shadow-[0_0_20px_rgba(0,229,255,0.15)] flex items-center justify-center">
            {profile.photoURL || profile.profileImageUrl ? (
              <img
                src={profile.photoURL || profile.profileImageUrl}
                alt={profile.fullName || profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-sapphire-400 font-bold">
                {(profile.fullName || profile.name || "U")[0].toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {profile.fullName || profile.name || "Unknown User"}
          </h1>

          {(profile.designation || profile.title || profile.organization || profile.company) && (
            <p className="text-cyan-neon text-sm font-medium mb-4">
              {profile.designation || profile.title}
              {(profile.designation || profile.title) && (profile.organization || profile.company) && " @ "}
              {profile.organization || profile.company}
            </p>
          )}

          {profile.location && (
            <div className="flex items-center justify-center gap-1.5 text-sapphire-300 text-sm mb-6">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}

          {profile.bio && (
            <p className="text-sapphire-300 text-sm leading-relaxed mb-6 px-2">
              {profile.bio}
            </p>
          )}

          {/* Socials & Contact */}
          {socialsList.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              {socialsList.map(({ key, url }) => {
                let finalUrl = url;
                if (key.includes('email') && !url.startsWith('mailto:')) {
                  finalUrl = `mailto:${url}`;
                } else if (!url.startsWith('http') && !key.includes('email')) {
                  finalUrl = `https://${url}`;
                }

                const isLinkedin = key.includes('linkedinProfile');
                const isEmail = key.includes('email');

                // Raw SVG for Linkedin to cleanly bypass lucide-react@1.8.0 limits
                const LinkedinIcon = () => (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                );

                // Conditional brand color injection
                let colorClass = "bg-sapphire-800/50 text-sapphire-300 border-transparent hover:bg-cyan-neon/10 hover:border-cyan-neon/30 hover:text-cyan-neon";
                if (isLinkedin) {
                  colorClass = "bg-[#0A66C2]/15 text-[#66b2ff] border-[#0A66C2]/30 hover:bg-[#0A66C2]/25 hover:border-[#0A66C2]/50 hover:text-white";
                } else if (isEmail) {
                  colorClass = "bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/30";
                }

                return (
                  <a
                    key={url}
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all shadow-sm font-medium text-sm ${colorClass}`}
                  >
                    {isLinkedin ? <LinkedinIcon /> : isEmail ? <Mail className="w-[18px] h-[18px]" /> : <Globe className="w-[18px] h-[18px]" />}
                    {isLinkedin ? "LinkedIn" : isEmail ? "Email" : "LinkedIn"}
                  </a>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSaveContact}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-dark to-cyan-neon hover:to-cyan-400 text-sapphire-950 font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Save Contact
            </button>

            <button
              onClick={handleCreateCard}
              className="w-full py-3.5 px-4 bg-transparent border border-sapphire-600 hover:border-cyan-neon/50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5 text-cyan-neon" />
              Create My Card
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
