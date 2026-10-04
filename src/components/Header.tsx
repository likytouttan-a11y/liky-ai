import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Mic, 
  Brain, 
  Sun, 
  Moon, 
  Settings, 
  ShieldCheck, 
  Globe, 
  Compass, 
  PenTool, 
  GraduationCap, 
  Layers, 
  Menu
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding';
import { AIModelId, CustomAssistant, UserProfile, UserSettings, ViewMode } from '../types';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/translations';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  selectedModel: AIModelId;
  onSelectModel: (model: AIModelId) => void;
  activeAssistant: CustomAssistant | null;
  onClearAssistant: () => void;
  onOpenVoiceModal: () => void;
  onOpenMemoryModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAdminModal: () => void;
  onOpenAuthModal: () => void;
  onToggleSidebar: () => void;
  userProfile: UserProfile;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

const MODELS = [
  { id: 'gemini-3.8-flash', name: 'Liky Flash 3.8', tag: 'Fast & Versatile' },
  { id: 'gemini-3.1-pro-preview', name: 'Liky Pro 3.1', tag: 'Deep Reasoning & Code' },
  { id: 'gemini-3.1-flash-lite', name: 'Liky Ultra-Lite', tag: 'Ultra Low Latency' },
];

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  selectedModel,
  onSelectModel,
  activeAssistant,
  onClearAssistant,
  onOpenVoiceModal,
  onOpenMemoryModal,
  onOpenSettingsModal,
  onOpenAdminModal,
  onOpenAuthModal,
  onToggleSidebar,
  userProfile,
  settings,
  onUpdateSettings,
}) => {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  const currentModelObj = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <header className="h-14 border-b border-white/[0.08] dark:border-white/[0.08] bg-neutral-900/60 dark:bg-neutral-950/70 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button 
          onClick={() => onSelectView('chat')}
          className="flex items-center gap-2 group text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="hidden xs:flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5 font-['Syne',sans-serif]">
              {BRAND_CONFIG.name}
              <span className="text-[10px] font-normal tracking-wide text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">v1.0</span>
            </span>
          </div>
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative ml-1 sm:ml-2">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
          >
            <span>{currentModelObj.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {showModelDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowModelDropdown(false)} 
              />
              <div className="absolute top-full left-0 mt-1 w-64 p-1.5 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Available AI Models
                </div>
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id as AIModelId);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex flex-col gap-0.5 ${
                      selectedModel === m.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'hover:bg-white/[0.06] text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">{m.name}</span>
                      {selectedModel === m.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </div>
                    <span className="text-[11px] text-neutral-400">{m.tag}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Active Assistant Tag */}
        {activeAssistant && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
            <span>{activeAssistant.name}</span>
            <button
              onClick={onClearAssistant}
              className="text-neutral-400 hover:text-white text-xs ml-0.5"
              title="Reset to default assistant"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Center: View Switcher (Desktop) */}
      <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
        <button
          onClick={() => onSelectView('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            currentView === 'chat' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => onSelectView('research')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            currentView === 'research' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Deep Research</span>
        </button>

        <button
          onClick={() => onSelectView('canvas')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            currentView === 'canvas' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Canvas</span>
        </button>

        <button
          onClick={() => onSelectView('studio')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            currentView === 'studio' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>

        <button
          onClick={() => onSelectView('learning')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            currentView === 'learning' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Learning</span>
        </button>
      </nav>

      {/* Right: Quick Tools & Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Voice Mode Button */}
        <button
          onClick={onOpenVoiceModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Start voice conversation"
        >
          <Mic className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span className="hidden sm:inline">Voice</span>
        </button>

        {/* Memory Button */}
        <button
          onClick={onOpenMemoryModal}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Memory & User Preferences"
        >
          <Brain className="w-4 h-4" />
        </button>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Language"
          >
            <Globe className="w-4 h-4" />
          </button>

          {showLangDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLangDropdown(false)} />
              <div className="absolute right-0 mt-1 w-44 p-1 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl z-50 max-h-72 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onUpdateSettings({ ...settings, language: lang.code });
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      settings.language === lang.code ? 'bg-cyan-500/10 text-cyan-400 font-medium' : 'text-neutral-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-neutral-500 uppercase">{lang.code}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Admin Dashboard */}
        <button
          onClick={onOpenAdminModal}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Admin Console"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettingsModal}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Avatar / Auth */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-1.5 ml-1 p-0.5 rounded-full hover:ring-2 hover:ring-cyan-500/40 transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white uppercase shadow-sm">
            {userProfile.name.slice(0, 1)}
          </div>
        </button>
      </div>
    </header>
  );
};
