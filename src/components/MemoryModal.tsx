import React, { useState } from 'react';
import { Brain, Plus, Trash2, X, Check, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  enableMemory: boolean;
  onToggleGlobalMemory: (enabled: boolean) => void;
  onAddMemory: (content: string, category: MemoryItem['category']) => void;
  onDeleteMemory: (id: string) => void;
  onToggleMemory: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  enableMemory,
  onToggleGlobalMemory,
  onAddMemory,
  onDeleteMemory,
  onToggleMemory,
}) => {
  const [newContent, setNewContent] = useState('');
  const [category, setCategory] = useState<MemoryItem['category']>('preference');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddMemory(newContent.trim(), category);
    setNewContent('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Syne',sans-serif]">
                Memory & Privacy Controls
              </h2>
              <p className="text-[11px] text-neutral-400">
                Manage what information Liky AI retains to personalize answers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Memory Switch */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-white">Enable Assistant Memory</div>
            <div className="text-[11px] text-neutral-400">
              When disabled, Liky will not recall or use your saved preferences.
            </div>
          </div>

          <button
            onClick={() => onToggleGlobalMemory(!enableMemory)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {enableMemory ? (
              <ToggleRight className="w-8 h-8 text-cyan-400" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-neutral-600" />
            )}
          </button>
        </div>

        {/* Add New Memory Fact Form */}
        <form onSubmit={handleAdd} className="space-y-2">
          <label className="text-xs font-medium text-neutral-300">Add New Memory</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Always respond in concise bullet points with TypeScript snippets..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="preference">Preference</option>
              <option value="work">Work/Project</option>
              <option value="personal">Personal</option>
            </select>
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>

        {/* Memories List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Stored Memories ({memories.length})
          </div>

          {memories.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-500">
              No memories saved. Liky AI remembers nothing about you yet.
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="text-neutral-200">{mem.content}</div>
                  <div className="text-[10px] text-neutral-500 capitalize">
                    {mem.category} · {new Date(mem.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleMemory(mem.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      mem.isEnabled
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-white/[0.06] text-neutral-500'
                    }`}
                  >
                    {mem.isEnabled ? 'Active' : 'Muted'}
                  </button>
                  <button
                    onClick={() => onDeleteMemory(mem.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Zero-Retention Privacy Note */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-neutral-500">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>
            You retain 100% ownership of your memory bank. Items can be edited or deleted anytime.
          </span>
        </div>
      </div>
    </div>
  );
};
