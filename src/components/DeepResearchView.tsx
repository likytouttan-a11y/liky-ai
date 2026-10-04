import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Compass, 
  Search, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Layers, 
  FileText, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Citation, DeepResearchSession, DeepResearchStep } from '../types';
import { api } from '../services/api';

interface DeepResearchViewProps {
  initialQuery?: string;
  onSendToCanvas?: (title: string, markdown: string) => void;
}

export const DeepResearchView: React.FC<DeepResearchViewProps> = ({
  initialQuery = '',
  onSendToCanvas,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [depth, setDepth] = useState<'standard' | 'in-depth'>('in-depth');
  const [domainFocus, setDomainFocus] = useState('Comprehensive');
  const [isResearching, setIsResearching] = useState(false);
  const [steps, setSteps] = useState<DeepResearchStep[]>([]);
  const [plan, setPlan] = useState<{ summary: string; subQueries: string[] } | null>(null);
  const [report, setReport] = useState('');
  const [sources, setSources] = useState<Citation[]>([]);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startResearch = async () => {
    if (!query.trim() || isResearching) return;

    setIsResearching(true);
    setReport('');
    setSources([]);
    setPlan(null);
    setSteps([
      { step: 1, title: 'Clarifying Objective & Formulating Research Plan', details: 'Analyzing scope and identifying investigative dimensions.', status: 'in-progress' },
      { step: 2, title: 'Gathering & Cross-Referencing Grounded Sources', details: 'Querying live web endpoints and checking facts.', status: 'pending' },
      { step: 3, title: 'Synthesizing Findings into Publication-Grade Report', details: 'Structuring executive summary and comparative evidence.', status: 'pending' },
    ]);

    abortControllerRef.current = new AbortController();

    await api.deepResearchStream(
      {
        query: query.trim(),
        depth,
        domainFocus,
      },
      {
        onStep: (s) => {
          setSteps((prev) =>
            prev.map((stepItem) => {
              if (stepItem.step === s.step) {
                return { ...stepItem, title: s.title, details: s.details, status: 'in-progress' };
              }
              if (stepItem.step < s.step) {
                return { ...stepItem, status: 'completed' };
              }
              return stepItem;
            })
          );
        },
        onPlan: (p) => {
          setPlan(p);
        },
        onReportDelta: (chunk) => {
          setReport((prev) => prev + chunk);
        },
        onDone: (data) => {
          setSources(data.sources);
          setSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
          setIsResearching(false);
        },
        onError: (err) => {
          setIsResearching(false);
          alert(`Deep Research Notice: ${err}`);
        },
      },
      abortControllerRef.current.signal
    );
  };

  const stopResearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsResearching(false);
  };

  const copyReport = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportMarkdown = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepResearch_${query.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Liky Deep Research Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Syne',sans-serif]">
          Autonomous Multi-Source Investigation
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Launch a multi-stage research workflow. Liky AI breaks down your question, executes multiple grounded web search queries, cross-checks facts, and synthesizes an authoritative report.
        </p>
      </div>

      {/* Query Formulation Input Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300">Research Question or Topic</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Current breakthroughs and supply chain bottlenecks in high-temperature superconductors..."
            rows={2}
            className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            {/* Depth Selector */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span>Depth:</span>
              <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-white/10">
                <button
                  onClick={() => setDepth('standard')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    depth === 'standard' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setDepth('in-depth')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    depth === 'in-depth' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Exhaustive
                </button>
              </div>
            </div>

            {/* Domain Focus */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span>Domain:</span>
              <select
                value={domainFocus}
                onChange={(e) => setDomainFocus(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 focus:outline-none"
              >
                <option value="Comprehensive">Comprehensive / General</option>
                <option value="Scientific">Scientific & Engineering</option>
                <option value="Financial">Financial & Markets</option>
                <option value="Geopolitical">Geopolitical & Policy</option>
                <option value="Medical">Medical & Bioscience</option>
              </select>
            </div>
          </div>

          {/* Action button */}
          {isResearching ? (
            <button
              onClick={stopResearch}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Cancel Research</span>
            </button>
          ) : (
            <button
              onClick={startResearch}
              disabled={!query.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Deep Research</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress & Milestone Stages Tracker */}
      {steps.length > 0 && (
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-neutral-300">
              Research Pipeline Status
            </span>
            <span>{isResearching ? 'Active Investigation...' : 'Completed'}</span>
          </div>

          <div className="space-y-3">
            {steps.map((st) => (
              <div key={st.step} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {st.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : st.status === 'in-progress' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 text-neutral-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-neutral-200">
                    {st.title}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {st.details}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sub-Queries generated */}
          {plan && plan.subQueries && plan.subQueries.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs">
              <span className="text-neutral-400 font-medium">Investigative Sub-Queries:</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {plan.subQueries.map((sq, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-neutral-300 text-[11px]"
                  >
                    {sq}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Report Display */}
      {report && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-6">
          {/* Action bar for report */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Synthesized Research Report
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {query}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyReport}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-neutral-200 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={exportMarkdown}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-neutral-200 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MD</span>
              </button>

              {onSendToCanvas && (
                <button
                  onClick={() => onSendToCanvas(`Research: ${query.slice(0, 30)}`, report)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open in Canvas</span>
                </button>
              )}
            </div>
          </div>

          {/* Markdown Body */}
          <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-headings:font-['Syne',sans-serif] prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-table:my-4 prose-th:bg-white/[0.04] prose-th:p-2.5 prose-td:p-2.5 prose-td:tabular-nums">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report}
            </ReactMarkdown>
          </div>

          {/* Sources Section */}
          {sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-3">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Grounded Citations & Primary Sources ({sources.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate pr-2">{src.title || src.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
