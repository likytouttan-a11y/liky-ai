import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowUp, 
  Square, 
  Paperclip, 
  Globe, 
  Mic, 
  MicOff, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Compass,
  FileCode,
  Music
} from 'lucide-react';
import { Attachment } from '../types';

interface PromptComposerProps {
  onSendMessage: (content: string, attachments: Attachment[], enableWebSearch: boolean) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  onStartDeepResearch?: (query: string) => void;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  placeholder?: string;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopGeneration,
  onStartDeepResearch,
  enableWebSearch,
  onToggleWebSearch,
  placeholder = 'Ask anything, upload documents, analyze images...',
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        220
      )}px`;
    }
  }, [content]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can use the Voice Assistant mode instead!');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start speech recognition', e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(content.trim(), attachments, enableWebSearch);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // File attachments handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      let type: Attachment['type'] = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('video/')) type = 'video';

      const reader = new FileReader();

      // For text/code/csv files, read text directly
      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.js')
      ) {
        reader.onload = () => {
          const textContent = reader.result as string;
          const newAtt: Attachment = {
            id: `att-${Date.now()}-${Math.random()}`,
            name: file.name,
            mimeType: file.type || 'text/plain',
            size: file.size,
            type: 'document',
            base64Data: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(textContent)))}`,
          };
          setAttachments((prev) => [...prev, newAtt]);
        };
        reader.readAsText(file);
      } else {
        // Read as Data URL (images, audio, PDF)
        reader.onload = () => {
          const base64 = reader.result as string;
          const newAtt: Attachment = {
            id: `att-${Date.now()}-${Math.random()}`,
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            type,
            base64Data: base64,
            previewUrl: type === 'image' ? base64 : undefined,
          };
          setAttachments((prev) => [...prev, newAtt]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full max-w-4xl mx-auto rounded-2xl bg-neutral-900/90 dark:bg-neutral-900/90 border transition-all ${
        isDragging
          ? 'border-cyan-400 bg-cyan-950/20 ring-4 ring-cyan-500/20'
          : 'border-white/[0.1] shadow-2xl shadow-black/40'
      }`}
    >
      {/* Dragging Overlay */}
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl bg-cyan-950/80 backdrop-blur-sm z-30 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-cyan-300">
            <ImageIcon className="w-8 h-8 animate-bounce" />
            <span className="text-sm font-semibold">Drop images or files to attach</span>
          </div>
        </div>
      )}

      {/* Attachments Preview Chips */}
      {attachments.length > 0 && (
        <div className="p-3 pb-0 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs text-neutral-200"
            >
              {att.type === 'image' && att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-6 h-6 object-cover rounded-md"
                />
              ) : att.type === 'document' ? (
                <FileText className="w-4 h-4 text-cyan-400" />
              ) : att.type === 'audio' ? (
                <Music className="w-4 h-4 text-indigo-400" />
              ) : (
                <FileCode className="w-4 h-4 text-emerald-400" />
              )}
              <span className="max-w-[140px] truncate">{att.name}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 rounded-full hover:bg-white/[0.1] text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea Input */}
      <div className="px-3.5 pt-3 pb-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 focus:outline-none max-h-48 leading-relaxed font-sans"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="px-3 pb-2.5 pt-1 flex items-center justify-between flex-wrap gap-2">
        {/* Left tools: Attach, Web Search, Deep Research */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept="image/*,.pdf,.txt,.md,.csv,.json,.ts,.js,audio/*"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Attach images, documents or audio"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Web Search Toggle */}
          <button
            type="button"
            onClick={onToggleWebSearch}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              enableWebSearch
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
            }`}
            title="Enable live Google Web Search Grounding"
          >
            <Globe className={`w-3.5 h-3.5 ${enableWebSearch ? 'text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Deep Research Quick Launch */}
          {onStartDeepResearch && (
            <button
              type="button"
              onClick={() => {
                if (content.trim()) {
                  onStartDeepResearch(content.trim());
                  setContent('');
                } else {
                  alert('Please enter a research topic or question in the box first.');
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-colors"
              title="Launch dedicated Deep Research workflow on this prompt"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Deep Research</span>
            </button>
          )}

          {/* Voice Input Microphone */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2 rounded-xl transition-colors ${
              isRecording
                ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title={isRecording ? 'Stop recording' : 'Dictate with voice'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Right tools: Send or Stop */}
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-white/10 transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() && attachments.length === 0}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                content.trim() || attachments.length > 0
                  ? 'bg-gradient-to-tr from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95'
                  : 'bg-white/[0.06] text-neutral-500 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
