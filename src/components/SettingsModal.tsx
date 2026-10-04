import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Globe, 
  Moon, 
  Sun, 
  Sparkles, 
  Volume2, 
  CreditCard, 
  Check, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';
import { UserProfile, UserSettings, AIModelId } from '../types';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  userProfile,
  onUpdateUserProfile,
  onClearAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'plans' | 'audio'>('general');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      features: [
        'Liky Flash 3.8 unlimited basic chat',
        'Standard context window (1M tokens)',
        'Basic web search grounding',
        '3 document analyses per day',
        '5 image generations per month',
      ],
      current: userProfile.tier === 'free',
    },
    {
      id: 'pro',
      name: 'Liky Pro',
      price: '$20',
      period: 'per month',
      popular: true,
      features: [
        'Access to Liky Pro 3.1 deep reasoning',
        'Unlimited Deep Research investigations',
        'Full Multimodal Canvas & Code Runner',
        'High-priority generation throughput',
        '100 image generations per month',
        'Full custom assistants creator',
      ],
      current: userProfile.tier === 'pro',
    },
    {
      id: 'premium',
      name: 'Liky Enterprise',
      price: '$60',
      period: 'per month',
      features: [
        'Veo video generation integrations',
        'Maximum tokens & multimodal uploads',
        'Dedicated server queue priority',
        'Extended audio synthesis & podcast TTS',
        'Custom team workspace sharing',
      ],
      current: userProfile.tier === 'premium',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-['Syne',sans-serif]">
              Preferences & Configuration
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="px-5 pt-3 border-b border-white/[0.06] flex gap-4 text-xs font-semibold text-neutral-400">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'general' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-white'
            }`}
          >
            General & Models
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'plans' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-white'
            }`}
          >
            Subscription & Quota
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'audio' ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-white'
            }`}
          >
            Voice & Speech
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Language Selector */}
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Interface Language</span>
                </label>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, language: e.target.value as SupportedLanguage })
                  }
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme Mode */}
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-medium">Color Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                    className={`p-3 rounded-xl border flex items-center gap-2 justify-center transition-colors ${
                      settings.theme === 'dark'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-neutral-950 text-neutral-400 border-white/10'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark Matrix</span>
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                    className={`p-3 rounded-xl border flex items-center gap-2 justify-center transition-colors ${
                      settings.theme === 'light'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-neutral-950 text-neutral-400 border-white/10'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Pure Light</span>
                  </button>
                </div>
              </div>

              {/* Default Model */}
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-medium">Default Chat Model</label>
                <select
                  value={settings.defaultModel}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, defaultModel: e.target.value as AIModelId })
                  }
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none"
                >
                  <option value="gemini-3.8-flash">Liky Flash 3.8 (Default - Fast & Multimodal)</option>
                  <option value="gemini-3.1-pro-preview">Liky Pro 3.1 (Deep STEM Reasoning)</option>
                  <option value="gemini-3.1-flash-lite">Liky Ultra-Lite (Instant Latency)</option>
                </select>
              </div>

              {/* Danger Zone: Clear Data */}
              <div className="pt-4 border-t border-white/[0.08] space-y-2">
                <div className="text-neutral-300 font-semibold">Data & Privacy Management</div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all conversations and local cache?')) {
                      onClearAllData();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Conversations & Data</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 relative ${
                      p.popular
                        ? 'bg-gradient-to-b from-cyan-950/40 to-neutral-950 border-cyan-500/50 shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-black uppercase">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{p.price}</span>
                        <span className="text-[10px] text-neutral-400">/{p.period}</span>
                      </div>
                      <ul className="space-y-1.5 pt-2">
                        {p.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-1.5 text-[11px] text-neutral-300">
                            <Check className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        onUpdateUserProfile({ ...userProfile, tier: p.id as any });
                        alert(`Switched to ${p.name}!`);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                        p.current
                          ? 'bg-white/10 text-neutral-300 cursor-default'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md hover:scale-[1.02]'
                      }`}
                    >
                      {p.current ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Voice Persona</span>
                </label>
                <select
                  value={settings.voiceName}
                  onChange={(e) => onUpdateSettings({ ...settings, voiceName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none"
                >
                  <option value="Kore">Kore (Clear, Professional, Articulate)</option>
                  <option value="Puck">Puck (Enthusiastic, Bright)</option>
                  <option value="Fenrir">Fenrir (Authoritative, Deep)</option>
                  <option value="Zephyr">Zephyr (Gentle, Meditative)</option>
                  <option value="Charon">Charon (Academic, Measured)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Text-to-Speech Autoplay</div>
                  <div className="text-[11px] text-neutral-400">
                    Automatically read assistant answers in Voice Mode.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, soundEffects: e.target.checked })
                  }
                  className="w-4 h-4 accent-cyan-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
