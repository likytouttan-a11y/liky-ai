import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  PenTool, 
  Play, 
  Code, 
  FileText, 
  Save, 
  Download, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw, 
  Wand2, 
  Eye, 
  Edit3
} from 'lucide-react';
import { CanvasDocument } from '../types';
import { api } from '../services/api';

interface CanvasWorkspaceProps {
  documents: CanvasDocument[];
  onSaveDocument: (doc: CanvasDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  documents,
  onSaveDocument,
  onDeleteDocument,
}) => {
  const [activeDocId, setActiveDocId] = useState<string>(
    documents[0]?.id || 'doc-new'
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [aiInstruction, setAiInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentDoc = documents.find((d) => d.id === activeDocId) || {
    id: 'doc-new',
    title: 'Untitled Document',
    content: '# Start typing your document or code...',
    type: 'markdown' as const,
    updatedAt: Date.now(),
  };

  const [title, setTitle] = useState(currentDoc.title);
  const [content, setContent] = useState(currentDoc.content);
  const [docType, setDocType] = useState(currentDoc.type);

  // Sync state when active document changes
  const switchDocument = (doc: CanvasDocument) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    setContent(doc.content);
    setDocType(doc.type);
  };

  const createNewDoc = (type: 'markdown' | 'code' | 'html') => {
    const newDoc: CanvasDocument = {
      id: `doc-${Date.now()}`,
      title: type === 'html' ? 'Interactive Mini-App' : 'Untitled Document',
      content:
        type === 'html'
          ? `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0b0f19; color: #38bdf8; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    button { background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
  </style>
</head>
<body>
  <div style="text-align: center;">
    <h2>Interactive Canvas Mini-App</h2>
    <button onclick="alert('Hello from Liky Canvas!')">Click Me</button>
  </div>
</body>
</html>`
          : `# New Creative Draft\n\nOutline your thoughts, research, or structured notes here.`,
      type,
      updatedAt: Date.now(),
    };
    onSaveDocument(newDoc);
    switchDocument(newDoc);
  };

  const handleSave = () => {
    const updated: CanvasDocument = {
      ...currentDoc,
      title,
      content,
      type: docType,
      updatedAt: Date.now(),
    };
    onSaveDocument(updated);
  };

  // Run AI Transformation on Document
  const handleAITransform = async (action: string) => {
    if (!content.trim() || isProcessing) return;

    setIsProcessing(true);

    let prompt = '';
    if (action === 'rewrite') {
      prompt = `Rewrite and polish the following content with superior clarity, rhythm, and flow:\n\n${content}`;
    } else if (action === 'expand') {
      prompt = `Significantly expand on this draft with deeper arguments, practical examples, and rigorous breakdown:\n\n${content}`;
    } else if (action === 'shorten') {
      prompt = `Condense and distill the following text into punchy, high-impact key paragraphs:\n\n${content}`;
    } else if (action === 'fix') {
      prompt = `Find and correct all grammatical, stylistic, logical, or syntax bugs in the following content:\n\n${content}`;
    } else if (action === 'custom' && aiInstruction.trim()) {
      prompt = `${aiInstruction.trim()}:\n\n${content}`;
    }

    let modifiedContent = '';

    await api.chatStream(
      {
        messages: [{ role: 'user', content: prompt }],
        model: 'gemini-3.8-flash',
        systemInstruction: 'You are Liky AI Creative Canvas Assistant. Modify the provided document according to instructions. Output only the updated document content without conversational filler.',
      },
      {
        onDelta: (text) => {
          modifiedContent += text;
          setContent(modifiedContent);
        },
        onDone: () => {
          setIsProcessing(false);
          setAiInstruction('');
          handleSave();
        },
        onError: (err) => {
          setIsProcessing(false);
          alert(`Transformation error: ${err}`);
        },
      }
    );
  };

  const exportDocument = () => {
    const ext = docType === 'html' ? 'html' : docType === 'code' ? 'ts' : 'md';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-neutral-950">
      {/* Left List of Documents (Collapsible) */}
      <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-white/[0.08] p-3 flex flex-col gap-2 bg-neutral-900/40">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Workspace Docs
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => createNewDoc('markdown')}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08]"
              title="New Markdown Document"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => createNewDoc('html')}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08]"
              title="New Interactive Mini-App"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto max-h-36 lg:max-h-none flex-1">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => switchDocument(doc)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                doc.id === activeDocId
                  ? 'bg-cyan-500/10 text-cyan-300 font-medium border border-cyan-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {doc.type === 'html' ? (
                  <Code className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                )}
                <span className="truncate">{doc.title}</span>
              </div>
              {documents.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDocument(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Document & Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Document Top Bar */}
        <div className="h-14 border-b border-white/[0.08] px-4 flex items-center justify-between gap-3 bg-neutral-900/60">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleSave();
            }}
            placeholder="Document title..."
            className="bg-transparent text-sm sm:text-base font-semibold text-white focus:outline-none flex-1 truncate"
          />

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-800 border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'editor' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'preview' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {docType === 'html' ? <Play className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{docType === 'html' ? 'Run App' : 'Preview'}</span>
              </button>
            </div>

            <button
              onClick={exportDocument}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08]"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Action Quick Bar */}
        <div className="border-b border-white/[0.06] px-4 py-2 bg-neutral-900/30 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3" />
              <span>Liky AI Assist:</span>
            </span>

            <button
              onClick={() => handleAITransform('rewrite')}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 hover:text-white border border-white/[0.06] transition-colors"
            >
              Polish & Rewrite
            </button>

            <button
              onClick={() => handleAITransform('expand')}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 hover:text-white border border-white/[0.06] transition-colors"
            >
              Expand Depth
            </button>

            <button
              onClick={() => handleAITransform('shorten')}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 hover:text-white border border-white/[0.06] transition-colors"
            >
              Summarize
            </button>

            <button
              onClick={() => handleAITransform('fix')}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 hover:text-white border border-white/[0.06] transition-colors"
            >
              Fix Bugs & Grammar
            </button>
          </div>

          {/* Custom Instruction Box */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Custom AI instruction..."
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAITransform('custom');
              }}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none w-full sm:w-56"
            />
            <button
              onClick={() => handleAITransform('custom')}
              disabled={!aiInstruction.trim() || isProcessing}
              className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editor Body or Preview Pane */}
        <div className="flex-1 overflow-auto relative">
          {isProcessing && (
            <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs shadow-lg backdrop-blur-md">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Liky AI is updating canvas...</span>
            </div>
          )}

          {activeTab === 'editor' ? (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                handleSave();
              }}
              placeholder="Write your document or code..."
              className="w-full h-full p-6 bg-transparent text-sm leading-relaxed text-neutral-100 font-mono resize-none focus:outline-none"
            />
          ) : docType === 'html' ? (
            /* Interactive Sandbox Iframe Runner */
            <iframe
              srcDoc={content}
              title="Interactive Canvas Sandbox"
              sandbox="allow-scripts"
              className="w-full h-full border-none bg-neutral-950"
            />
          ) : (
            /* Markdown Preview */
            <div className="p-8 prose prose-invert max-w-4xl mx-auto text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
