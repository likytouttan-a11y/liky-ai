import React, { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Sparkles, 
  Trash2, 
  MessageSquare, 
  Code2, 
  GraduationCap, 
  Feather, 
  Languages, 
  Sliders, 
  X, 
  Check 
} from 'lucide-react';
import { AIModelId, CustomAssistant } from '../types';

interface CustomAssistantsViewProps {
  assistants: CustomAssistant[];
  onSelectAssistant: (assistant: CustomAssistant) => void;
  onAddAssistant: (assistant: CustomAssistant) => void;
  onDeleteAssistant: (id: string) => void;
}

export const CustomAssistantsView: React.FC<CustomAssistantsViewProps> = ({
  assistants,
  onSelectAssistant,
  onAddAssistant,
  onDeleteAssistant,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [preferredModel, setPreferredModel] = useState<AIModelId>('gemini-3.8-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [samplePrompt, setSamplePrompt] = useState('');
  const [color, setColor] = useState('#0ea5e9');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemInstruction.trim()) return;

    const newAssistant: CustomAssistant = {
      id: `asst-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom AI Assistant',
      avatarIcon: 'Bot',
      color,
      systemInstruction: systemInstruction.trim(),
      preferredModel,
      temperature,
      samplePrompts: samplePrompt.trim() ? [samplePrompt.trim()] : ['How can you help me today?'],
      isBuiltIn: false,
      tags: ['Custom'],
    };

    onAddAssistant(newAssistant);
    setShowCreateModal(false);
    setName('');
    setDescription('');
    setSystemInstruction('');
    setSamplePrompt('');
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return Code2;
      case 'GraduationCap':
        return GraduationCap;
      case 'Feather':
        return Feather;
      case 'Languages':
        return Languages;
      default:
        return Bot;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>Specialized Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Syne',sans-serif]">
            Custom AI Assistants & Personas
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Activate domain-tailored intelligence tuned with specialized prompts, models, and reasoning personas.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assistant</span>
        </button>
      </div>

      {/* Grid of Assistants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assistants.map((asst) => {
          const Icon = getIcon(asst.avatarIcon);

          return (
            <div
              key={asst.id}
              className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-cyan-500/30 transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: `${asst.color}25`, border: `1px solid ${asst.color}50` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: asst.color }} />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {asst.isBuiltIn ? (
                      <span className="text-[10px] font-medium text-neutral-400 bg-white/[0.06] px-2 py-0.5 rounded-md">
                        Built-in
                      </span>
                    ) : (
                      <button
                        onClick={() => onDeleteAssistant(asst.id)}
                        className="p-1 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-white/[0.06]"
                        title="Delete Assistant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {asst.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {asst.description}
                  </p>
                </div>

                {/* Sample Prompt Quick Chip */}
                {asst.samplePrompts.length > 0 && (
                  <div className="text-[11px] text-neutral-500 italic bg-black/20 p-2 rounded-lg border border-white/[0.04]">
                    "{asst.samplePrompts[0]}"
                  </div>
                )}
              </div>

              {/* Start Chat Button */}
              <button
                onClick={() => onSelectAssistant(asst)}
                className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 text-neutral-200 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat with {asst.name.split(' ')[0]}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span>Build Custom Assistant</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Assistant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal Contract Reviewer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Analyzes commercial agreements and highlights liability clauses."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">System Instructions & Persona Directive</label>
                <textarea
                  required
                  rows={4}
                  placeholder="You are an expert commercial attorney. When reviewing contracts, strictly evaluate indemnification, governing law, and payment terms..."
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 resize-none font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">Preferred Model</label>
                  <select
                    value={preferredModel}
                    onChange={(e) => setPreferredModel(e.target.value as AIModelId)}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="gemini-3.8-flash">Liky Flash 3.8 (Fast)</option>
                    <option value="gemini-3.1-pro-preview">Liky Pro 3.1 (Complex)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">Temperature: {temperature}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Sample Starter Prompt</label>
                <input
                  type="text"
                  placeholder="e.g. Audit this SaaS service level agreement for liability caps."
                  value={samplePrompt}
                  onChange={(e) => setSamplePrompt(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold shadow-md shadow-cyan-500/20"
                >
                  Create Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
