import React, { useState } from 'react';
import { User, X, Mail, Lock, Shield, CheckCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateUserProfile,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'profile'>('profile');
  const [email, setEmail] = useState(userProfile.email);
  const [name, setName] = useState(userProfile.name);
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile({
      ...userProfile,
      name: name.trim() || 'Liky User',
      email: email.trim() || 'user@likyai.com',
      isLoggedIn: true,
    });
    onClose();
  };

  const handleDemoSignIn = (role: 'Scholar' | 'Developer' | 'Executive') => {
    onUpdateUserProfile({
      ...userProfile,
      name: `${role} Liky`,
      email: `${role.toLowerCase()}@likyai.com`,
      tier: 'pro',
      isLoggedIn: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white font-['Syne',sans-serif]">
              User Account & Identity
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Profile Card */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md uppercase">
            {userProfile.name.slice(0, 1)}
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-white">{userProfile.name}</div>
            <div className="text-xs text-neutral-400">{userProfile.email}</div>
            <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wide">
              {userProfile.tier} Member
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs transition-colors"
          >
            Save Profile
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2">
          <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">
            Quick Persona Profiles
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['Scholar', 'Developer', 'Executive'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleDemoSignIn(r)}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-center text-xs text-neutral-300 hover:text-white transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
