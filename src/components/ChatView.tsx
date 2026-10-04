import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Copy, 
  Check, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  Sparkles, 
  Compass, 
  Code2, 
  BarChart3, 
  BookOpen, 
  FileText,
  Edit3
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding';
import { Attachment, Citation, Conversation, Message } from '../types';
import { api } from '../services/api';

interface ChatViewProps {
  conversation: Conversation;
  isStreaming: boolean;
  onSendMessage: (content: string, attachments: Attachment[], enableWebSearch: boolean) => void;
  onRegenerateLastResponse: () => void;
  onEditPrompt: (messageIndex: number, newContent: string) => void;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  isStreaming,
  onSendMessage,
  onRegenerateLastResponse,
  onEditPrompt,
  onFeedback,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll on new message or stream chunk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, isStreaming]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = async (text: string, id: string) => {
    // If currently playing, stop it
    if (playingAudioId === id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setPlayingAudioId(null);
      return;
    }

    // Stop existing playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    setPlayingAudioId(id);

    try {
      // Try server-side TTS
      const res = await api.generateSpeech(text.slice(0, 500));
      if (res?.audio) {
        const audio = new Audio(`data:${res.mimeType || 'audio/wav'};base64,${res.audio}`);
        currentAudioRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => fallbackBrowserSpeech(text, id);
        await audio.play();
        return;
      }
    } catch {
      // Fallback to browser Web Speech API
      fallbackBrowserSpeech(text, id);
    }
  };

  const fallbackBrowserSpeech = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/[#*`_~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 600));
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(null);
    }
  };

  const startEditPrompt = (index: number, content: string) => {
    setEditingMessageIndex(index);
    setEditInput(content);
  };

  const saveEditPrompt = (index: number) => {
    if (editInput.trim()) {
      onEditPrompt(index, editInput.trim());
    }
    setEditingMessageIndex(null);
  };

  const starterSuggestions = [
    {
      icon: Compass,
      title: 'Deep Research Report',
      description: 'Conduct exhaustive multi-stage analysis with verified web citations',
      prompt: 'Execute a comprehensive deep research report on next-generation solid-state battery breakthroughs and commercial timelines.',
    },
    {
      icon: Code2,
      title: 'Full-Stack Architecture',
      description: 'Write type-safe code, design algorithms, or build mini-apps',
      prompt: 'Design a high-performance in-memory distributed cache with TTL and LRU eviction in TypeScript.',
    },
    {
      icon: BookOpen,
      title: 'Socratic Academic Tutor',
      description: 'Learn complex concepts with step-by-step reasoning and analogies',
      prompt: 'Explain how Transformers and Self-Attention mechanisms work using intuitive physical analogies and mathematical formulas.',
    },
    {
      icon: BarChart3,
      title: 'Document & Data Analysis',
      description: 'Extract structure, inspect balance sheets, or summarize reports',
      prompt: 'Provide a structured methodology to audit a company balance sheet and diagnose hidden liquidity risks.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Empty State / Welcome Screen */}
      {conversation.messages.length === 0 ? (
        <div className="max-w-3xl mx-auto py-12 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-['Syne',sans-serif]">
              {BRAND_CONFIG.name}
            </h1>
            <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto">
              {BRAND_CONFIG.description}
            </p>
          </div>

          {/* Starter Suggestions Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
            {starterSuggestions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onSendMessage(item.prompt, [], true)}
                  className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/40 transition-all flex flex-col gap-2 group text-left"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white tracking-wide">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Conversation Messages List */
        <div className="max-w-4xl mx-auto space-y-6">
          {conversation.messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLastAssistant =
              !isUser &&
              index === conversation.messages.length - 1 &&
              isStreaming;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex-shrink-0 flex items-center justify-center shadow-md shadow-cyan-500/20 mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Message Bubble Body */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed transition-all ${
                    isUser
                      ? 'bg-neutral-800 text-neutral-100 rounded-br-sm border border-white/[0.08]'
                      : 'bg-white/[0.02] text-neutral-200 rounded-bl-sm border border-white/[0.06]'
                  }`}
                >
                  {/* Attachments preview if present */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-white/10"
                        >
                          {att.type === 'image' && att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="max-h-36 max-w-full rounded-lg object-contain"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                              <FileText className="w-4 h-4 text-cyan-400" />
                              <span className="truncate max-w-[160px]">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User message edit mode */}
                  {isUser && editingMessageIndex === index ? (
                    <div className="space-y-2">
                      <textarea
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="w-full p-2 rounded-lg bg-neutral-900 border border-cyan-500/50 text-sm text-white focus:outline-none"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingMessageIndex(null)}
                          className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEditPrompt(index)}
                          className="px-3 py-1 text-xs bg-cyan-500 text-white rounded-md font-medium"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Message Content */
                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeText = String(children).replace(/\n$/, '');

                            if (!inline) {
                              return (
                                <div className="my-3 rounded-xl overflow-hidden border border-white/[0.08] bg-neutral-950 font-mono text-xs">
                                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900 border-b border-white/[0.06] text-neutral-400">
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-300">
                                      {match ? match[1] : 'code'}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(codeText, `code-${index}`)}
                                      className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
                                      title="Copy code"
                                    >
                                      {copiedId === `code-${index}` ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <pre className="p-3.5 overflow-x-auto text-neutral-200">
                                    <code>{children}</code>
                                  </pre>
                                </div>
                              );
                            }
                            return (
                              <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-cyan-300 font-mono text-[13px]" {...props}>
                                {children}
                              </code>
                            );
                          },
                          table({ children }) {
                            return (
                              <div className="my-3 overflow-x-auto rounded-xl border border-white/[0.08]">
                                <table className="w-full text-left text-xs border-collapse">
                                  {children}
                                </table>
                              </div>
                            );
                          },
                          th({ children }) {
                            return (
                              <th className="border-b border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-neutral-300">
                                {children}
                              </th>
                            );
                          },
                          td({ children }) {
                            return (
                              <td className="border-b border-white/[0.04] px-3 py-2 text-xs text-neutral-300 tabular-nums">
                                {children}
                              </td>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>

                      {/* Streaming cursor */}
                      {isLastAssistant && (
                        <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
                      )}
                    </div>
                  )}

                  {/* Web Search Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Grounding Citations & Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cite, cIdx) => (
                          <a
                            key={cIdx}
                            href={cite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{cite.title || cite.url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Action Bar (Copy, Read aloud, Regenerate, Thumbs) */}
                  <div className="mt-3 pt-2 flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-1">
                      {/* Copy message button */}
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1.5 rounded-lg hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Speak message button */}
                      <button
                        onClick={() => handleSpeak(msg.content, msg.id)}
                        className="p-1.5 rounded-lg hover:text-white hover:bg-white/[0.06] transition-colors"
                        title={playingAudioId === msg.id ? 'Stop audio' : 'Read aloud with AI TTS'}
                      >
                        {playingAudioId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* User prompt edit button */}
                      {isUser && (
                        <button
                          onClick={() => startEditPrompt(index, msg.content)}
                          className="p-1.5 rounded-lg hover:text-white hover:bg-white/[0.06] transition-colors"
                          title="Edit prompt"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Regenerate if last assistant message */}
                      {!isUser && index === conversation.messages.length - 1 && !isStreaming && (
                        <button
                          onClick={onRegenerateLastResponse}
                          className="p-1.5 rounded-lg hover:text-white hover:bg-white/[0.06] transition-colors"
                          title="Regenerate response"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Feedback buttons for assistant */}
                    {!isUser && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onFeedback(msg.id, 'like')}
                          className={`p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors ${
                            msg.feedback === 'like' ? 'text-emerald-400' : 'hover:text-white'
                          }`}
                          title="Good response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onFeedback(msg.id, 'dislike')}
                          className={`p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors ${
                            msg.feedback === 'dislike' ? 'text-rose-400' : 'hover:text-white'
                          }`}
                          title="Bad response"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
