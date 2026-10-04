import React from 'react';
import { MessageSquare, Compass, PenTool, Bot, Layers, Sparkles } from 'lucide-react';
import { ViewMode } from '../types';

interface MobileNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenVoiceModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onSelectView,
  onOpenVoiceModal,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-neutral-950/90 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-around px-2 z-40">
      <button
        onClick={() => onSelectView('chat')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
          currentView === 'chat' ? 'text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span>Chat</span>
      </button>

      <button
        onClick={() => onSelectView('research')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
          currentView === 'research' ? 'text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span>Research</span>
      </button>

      {/* Floating Center Voice Button */}
      <button
        onClick={onOpenVoiceModal}
        className="-top-5 relative w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30 border-2 border-neutral-950 hover:scale-105 active:scale-95 transition-transform"
        aria-label="Start Voice Mode"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      <button
        onClick={() => onSelectView('canvas')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
          currentView === 'canvas' ? 'text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <PenTool className="w-5 h-5" />
        <span>Canvas</span>
      </button>

      <button
        onClick={() => onSelectView('studio')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
          currentView === 'studio' ? 'text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <Layers className="w-5 h-5" />
        <span>Studio</span>
      </button>
    </nav>
  );
};
