import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  GitCompare,
  Zap,
  Network,
  ArrowRight,
  CheckCircle2,
  Upload,
  FileCode,
  Table
} from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function Dashboard() {
  const { documents, searchHistory } = useApp();
  const navigate = useNavigate();

  const totalChars = documents.reduce((sum, d) => sum + d.measuredCharacters, 0);
  const totalTokens = documents.reduce((sum, d) => sum + d.tokenCount, 0);
  const totalFileBytes = documents.reduce((sum, d) => sum + d.fileSizeBytes, 0);

  const totalSearches = searchHistory.length;
  const totalMatches = searchHistory.reduce((sum, s) => sum + s.matchCount, 0);
  const avgLatency = totalSearches > 0
    ? (searchHistory.reduce((sum, s) => sum + s.executionTimeMs, 0) / totalSearches).toFixed(3)
    : '0.000';

  const getFormatIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'json': return <FileCode size={16} className="text-amber-600" />;
      case 'csv': return <Table size={16} className="text-emerald-600" />;
      default: return <FileText size={16} className="text-blue-600" />;
    }
  };

  return (
    <div className="py-6 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white p-8 shadow-sm border border-slate-800">
        <div className="relative z-10 max-w-4xl flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              PatternLab Enterprise Platform
            </span>
            <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              Deterministic High-Throughput Processing
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Multi-Pattern Search & Document Analytics Engine
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
            A unified document intelligence workspace combining sub-millisecond multi-pattern searching, structural sequence alignment, combinatorial batch execution optimization, and network capacity planning.
          </p>

          {/* Quick Action Launchers */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/documents"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Upload size={14} /> Upload Documents
            </Link>
            <Link
              to="/search"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/15"
            >
              <Search size={14} /> Search Documents
            </Link>
            <Link
              to="/compare"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/15"
            >
              <GitCompare size={14} /> Compare Documents
            </Link>
            <Link
              to="/optimizer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/15"
            >
              <Zap size={14} /> Optimize Processing
            </Link>
            <Link
              to="/network-planner"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/15"
            >
              <Network size={14} /> Plan Network
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Active Document Fleet</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary font-mono">{documents.length}</span>
            <span className="text-xs text-on-surface-variant">files loaded</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-2 font-mono">
            {(totalFileBytes / 1024).toFixed(1)} KB memory payload
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Indexed Token Volume</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-mono">
              {totalTokens.toLocaleString()}
            </span>
            <span className="text-xs text-on-surface-variant">tokens</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-2 font-mono">
            {totalChars.toLocaleString()} characters indexed
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Search Engine Latency</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 font-mono">
              {avgLatency} ms
            </span>
            <span className="text-xs text-on-surface-variant">mean time</span>
          </div>
          <span className="text-[11px] text-emerald-800 mt-2 font-mono">
            {totalMatches.toLocaleString()} total matches verified
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Engine System Status</span>
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-600" />
            <span className="text-xl font-bold text-on-surface">100% Operational</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-2">
            Suffix Array, DP & Flow engines online
          </span>
        </div>
      </div>

      {/* Core Workflows Navigation Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-on-surface tracking-tight">Core Application Workflows</h2>
          <span className="text-xs text-on-surface-variant">Choose a module to begin analyzing documents</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/search"
            className="group bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search size={20} />
              </div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Smart Document Search</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Execute single and batch multi-pattern searches using Suffix Arrays, KMP, Rabin-Karp, and Z-Algorithm.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Open Search Engine</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/compare"
            className="group bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <GitCompare size={20} />
              </div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Document Compare</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Compute Levenshtein edit distance, common content (LCS), and global/local sequence alignments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Compare Documents</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/optimizer"
            className="group bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Zap size={20} />
              </div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Processing Optimizer</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Optimize batch document ingestion sequences via Bitmask TSP and partition hierarchical document segments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Run Optimizer</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/network-planner"
            className="group bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Network size={20} />
              </div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Network Planner</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Model document routing network throughput, bottleneck capacity cuts, and task-to-analyst assignments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Plan Network</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Section: Active Document Fleet & Recent Search Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Fleet Preview */}
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
            <span className="font-bold text-on-surface">Active Document Corpus</span>
            <Link to="/documents" className="text-primary hover:underline font-semibold">
              Manage Fleet ({documents.length})
            </Link>
          </div>

          <div className="p-2 flex flex-col divide-y divide-outline-variant/10">
            {documents.slice(0, 4).map((doc) => (
              <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {getFormatIcon(doc.extension)}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-on-surface truncate">{doc.name}</span>
                    <span className="text-[11px] text-outline">
                      {doc.measuredCharacters.toLocaleString()} chars · {doc.tokenCount.toLocaleString()} tokens
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/search?docId=${encodeURIComponent(doc.id)}`)}
                    className="px-2.5 py-1 rounded bg-surface hover:bg-surface-container border border-outline-variant/40 text-[11px] font-semibold text-primary"
                  >
                    Search
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Search Activity Log */}
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
            <span className="font-bold text-on-surface">Recent Query Executions</span>
            <Link to="/insights" className="text-primary hover:underline font-semibold">
              View Insights
            </Link>
          </div>

          <div className="p-2 flex flex-col divide-y divide-outline-variant/10">
            {searchHistory.slice(0, 4).map((record) => (
              <div key={record.id} className="p-3 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors text-xs">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">&quot;{record.query}&quot;</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-outline-variant/40 text-on-surface-variant font-medium">
                      {record.algorithmName}
                    </span>
                  </div>
                  <span className="text-[11px] text-outline truncate mt-0.5">{record.docName}</span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono font-bold text-emerald-700">{record.matchCount} matches</span>
                  <span className="text-[11px] font-mono text-outline">{record.executionTimeMs.toFixed(3)} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
