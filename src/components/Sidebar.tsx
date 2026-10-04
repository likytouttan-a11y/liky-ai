import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Pin, 
  Trash2, 
  Edit2, 
  Compass, 
  PenTool, 
  GraduationCap, 
  Layers, 
  Bot, 
  Check, 
  X, 
  Download, 
  Sparkles, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Conversation, UserProfile, ViewMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  userProfile: UserProfile;
  onOpenUpgradeModal: () => void;
  onOpenAdminModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  userProfile,
  onOpenUpgradeModal,
  onOpenAdminModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConvs = filtered.filter((c) => c.isPinned);
  const unpinnedConvs = filtered.filter((c) => !c.isPinned);

  // Group chronologically
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const today = unpinnedConvs.filter((c) => now - c.updatedAt < oneDay);
  const yesterday = unpinnedConvs.filter(
    (c) => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay
  );
  const previousDays = unpinnedConvs.filter(
    (c) => now - c.updatedAt >= 2 * oneDay
  );

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const exportConversation = (conv: Conversation) => {
    const text = conv.messages
      .map((m) => `### ${m.role.toUpperCase()} (${new Date(m.timestamp).toLocaleTimeString()}):\n${m.content}\n`)
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 w-72 bg-neutral-950 border-r border-white/[0.08] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: New Chat Button */}
        <div className="p-3 border-b border-white/[0.06] space-y-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-black/20 rounded text-cyan-100">⌘K</kbd>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Feature Hub Navigation */}
        <div className="p-2 border-b border-white/[0.06] space-y-0.5">
          <button
            onClick={() => {
              onSelectView('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'chat'
                ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat Streams</span>
          </button>

          <button
            onClick={() => {
              onSelectView('research');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'research'
                ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Deep Research</span>
          </button>

          <button
            onClick={() => {
              onSelectView('canvas');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'canvas'
                ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Creative Canvas</span>
          </button>

          <button
            onClick={() => {
              onSelectView('assistants');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'assistants'
                ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Custom Assistants</span>
          </button>

          <button
            onClick={() => {
              onSelectView('learning');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'learning'
                ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Learning Studio</span>
          </button>

          <button
            onClick={() => {
              onSelectView('studio');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'studio'
                ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Media Studio (Images/Video)</span>
          </button>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Pinned Section */}
          {pinnedConvs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3 text-cyan-400" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {pinnedConvs.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Today */}
          {today.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Today
              </div>
              <div className="space-y-0.5 mt-1">
                {today.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {yesterday.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Yesterday
              </div>
              <div className="space-y-0.5 mt-1">
                {yesterday.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Previous Days */}
          {previousDays.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Previous Days
              </div>
              <div className="space-y-0.5 mt-1">
                {previousDays.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-6 text-neutral-500">
              No conversations found
            </div>
          )}
        </div>

        {/* Bottom: User Quota & Pro Upgrade */}
        <div className="p-3 border-t border-white/[0.08] bg-neutral-900/40">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium capitalize">{userProfile.tier} Plan</span>
              <button
                onClick={onOpenUpgradeModal}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              >
                <span>Upgrade</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Token Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (userProfile.monthlyTokensUsed / userProfile.monthlyLimit) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>{(userProfile.monthlyTokensUsed / 1000).toFixed(1)}k tokens</span>
                <span>{(userProfile.monthlyLimit / 1000).toFixed(0)}k limit</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  function renderConversationItem(conv: Conversation) {
    const isActive = activeConversationId === conv.id && currentView === 'chat';
    const isEditing = editingId === conv.id;

    if (isEditing) {
      return (
        <div
          key={conv.id}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neutral-800 border border-cyan-500/40"
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename(conv.id);
              if (e.key === 'Escape') setEditingId(null);
            }}
          />
          <button
            onClick={() => saveRename(conv.id)}
            className="p-1 text-emerald-400 hover:text-emerald-300"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="p-1 text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={conv.id}
        onClick={() => {
          onSelectConversation(conv.id);
          onSelectView('chat');
          if (window.innerWidth < 1024) onClose();
        }}
        className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors relative ${
          isActive
            ? 'bg-cyan-500/10 text-cyan-300 font-medium'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-neutral-500'}`} />
          <span className="truncate text-xs">{conv.title}</span>
        </div>

        {/* Action icons on hover */}
        <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinConversation(conv.id);
            }}
            title={conv.isPinned ? 'Unpin' : 'Pin'}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.08]"
          >
            <Pin className={`w-3 h-3 ${conv.isPinned ? 'text-cyan-400 fill-cyan-400' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              startRename(conv);
            }}
            title="Rename"
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.08]"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              exportConversation(conv);
            }}
            title="Export as Markdown"
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.08]"
          >
            <Download className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(conv.id);
            }}
            title="Delete"
            className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-white/[0.08]"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
