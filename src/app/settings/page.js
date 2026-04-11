"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, Bell, Palette, LogOut, ChevronRight, Shield, Globe, Moon } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (err) {
      console.error(err);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', subtitle: 'Name, username, phone, organization', action: 'navigate' },
        { icon: Shield, label: 'Privacy & Security', subtitle: 'Password, two-factor, data management', action: 'navigate' },
        { icon: Globe, label: 'Digital Card Settings', subtitle: 'Public profile, QR customization', action: 'navigate' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', subtitle: 'Push, email, and in-app alerts', action: 'toggle', value: notificationsEnabled, onToggle: () => setNotificationsEnabled(!notificationsEnabled) },
        { icon: Palette, label: 'Appearance', subtitle: 'Sapphire Night (Active)', action: 'navigate' },
        { icon: Moon, label: 'Display', subtitle: 'Dark mode is always on', action: 'info' },
      ],
    },
  ];

  return (
    <div className="section-container py-10">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Settings</h1>
        <p className="text-sapphire-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-8 text-center sticky top-24">
            <div className="w-20 h-20 bg-gradient-to-br from-sapphire-600 to-sapphire-800 rounded-full mx-auto mb-5 flex items-center justify-center text-white font-bold text-2xl border-2 border-cyan-neon/30 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{profile?.fullName || 'User Name'}</h2>
            <p className="text-sapphire-500 text-sm mb-1">@{profile?.username || 'username'}</p>
            <p className="text-sapphire-600 text-xs mb-5">{profile?.company || 'Add your organization'}</p>

            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/[0.06]">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{profile?.connectionsCount || 0}</div>
                <div className="text-xs text-sapphire-500">Connections</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{profile?.postsCount || 0}</div>
                <div className="text-xs text-sapphire-500">Posts</div>
              </div>
            </div>

            <button className="w-full mt-6 py-2.5 rounded-xl text-sm font-semibold border border-cyan-neon/20 text-cyan-neon hover:bg-cyan-neon/10 transition-all">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-sapphire-500 uppercase tracking-wider mb-4">{section.title}</h3>
              <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-sapphire-700/50 flex items-center justify-center border border-white/[0.04]">
                          <Icon className="w-5 h-5 text-cyan-dark" />
                        </div>
                        <div>
                          <span className="text-white font-medium block text-sm">{item.label}</span>
                          <span className="text-sapphire-500 text-xs">{item.subtitle}</span>
                        </div>
                      </div>

                      {item.action === 'toggle' ? (
                        <button
                          className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                            item.value ? 'bg-cyan-neon' : 'bg-sapphire-700'
                          }`}
                          onClick={(e) => { e.stopPropagation(); item.onToggle(); }}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                            item.value ? 'translate-x-[22px]' : 'translate-x-0.5'
                          }`} />
                        </button>
                      ) : item.action === 'navigate' ? (
                        <ChevronRight className="w-5 h-5 text-sapphire-600 flex-shrink-0" />
                      ) : (
                        <span className="text-xs text-sapphire-600 bg-sapphire-800/50 px-3 py-1 rounded-lg">Active</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Danger Zone */}
          <div>
            <h3 className="text-sm font-semibold text-sapphire-500 uppercase tracking-wider mb-4">Session</h3>
            <button
              onClick={handleSignOut}
              className="w-full glass-panel rounded-2xl p-5 flex items-center justify-center gap-3 text-red-400 font-semibold hover:bg-red-500/[0.05] hover:border-red-500/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
