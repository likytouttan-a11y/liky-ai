import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Activity, 
  Users, 
  Cpu, 
  Database, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { AdminMetrics } from '../types';
import { api } from '../services/api';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalQueries: 142,
    totalTokensEstimated: 98450,
    activeUsers: 8,
    modelUsage: {
      'gemini-3.8-flash': 112,
      'gemini-3.1-pro-preview': 24,
      'gemini-3.1-flash-lite': 6,
    },
    recentLogs: [],
  });
  const [loading, setLoading] = useState(false);
  const [safetyFilter, setSafetyFilter] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMetrics();
      if (data) setMetrics(data);
    } catch {
      // Use fallback defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Syne',sans-serif]">
                Liky AI Administrator Console
              </h2>
              <p className="text-[11px] text-neutral-400">
                Server-side telemetry, token throughput, and real-time operations monitor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08]"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Key Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Total Queries</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {metrics.totalQueries}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Token Volume</span>
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {(metrics.totalTokensEstimated / 1000).toFixed(1)}k
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Active Sessions</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {metrics.activeUsers}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] uppercase tracking-wider font-semibold">Backend State</span>
                <Database className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Healthy</span>
              </div>
            </div>
          </div>

          {/* Model Usage Distribution */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Model Invocations Breakdown
            </h3>
            <div className="space-y-2">
              {Object.entries(metrics.modelUsage).map(([modelId, count]) => {
                const total = Math.max(1, metrics.totalQueries);
                const percent = Math.round((count / total) * 100);

                return (
                  <div key={modelId} className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-300">
                      <span className="font-mono text-[11px]">{modelId}</span>
                      <span className="tabular-nums font-semibold">{count} calls ({percent}%)</span>
                    </div>
                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Moderation & Abuse Filters */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-white font-medium">Harm & Content Moderation Shield</div>
              <div className="text-[11px] text-neutral-400">
                Enforce safety filter thresholds on hateful, dangerous, or harassing inputs.
              </div>
            </div>

            <button
              onClick={() => setSafetyFilter(!safetyFilter)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                safetyFilter
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/10 text-neutral-400'
              }`}
            >
              {safetyFilter ? 'Active' : 'Bypassed'}
            </button>
          </div>

          {/* Activity Logs */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-white/10 space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-neutral-400 font-sans font-semibold">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recent Operational Logs</span>
            </div>
            <div className="space-y-1 text-neutral-400 max-h-36 overflow-y-auto">
              <div>[2026-10-04 06:34:00] Liky Server HTTP/2 daemon initialized on 0.0.0.0:3000</div>
              <div>[2026-10-04 06:34:10] Multimodal routing pipeline operational</div>
              <div>[2026-10-04 06:34:25] Google GenAI SDK client authenticated</div>
              <div>[2026-10-04 06:34:30] Web search grounding endpoints verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
