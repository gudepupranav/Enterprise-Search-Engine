import { Link } from 'react-router-dom';
import { ArrowRight, Search, Activity, Network, Box } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function Dashboard() {
  const { documents, searchHistory } = useApp();

  const totalBytes = documents.reduce((acc, doc) => acc + doc.sizeBytes, 0);
  const sizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
  
  const totalSearches = searchHistory.length;
  const hits = searchHistory.filter(s => s.matches > 0).length;
  const hitRate = totalSearches > 0 ? ((hits / totalSearches) * 100).toFixed(1) : '0.0';
  
  const meanLatency = totalSearches > 0 
    ? (searchHistory.reduce((acc, s) => acc + s.timeMs, 0) / totalSearches).toFixed(2)
    : '0.00';
  return (
    <div className="py-8 flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 shadow-sm border border-outline-variant/30">
        <div className="relative z-10 max-w-4xl flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container text-xs font-mono text-primary uppercase font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Production Wasm Engine 2.4-STABLE
            </span>
            <span className="text-xs font-mono text-outline">Syllabus Accreditation: B.Tech CSE Lab Core</span>
          </div>
          <h1 className="text-4xl font-bold text-on-surface tracking-tight mt-2">
            Intelligent Multi-Pattern Search & Document Analytics Engine
          </h1>
          <p className="text-on-surface-variant max-w-3xl leading-relaxed mt-2">
            An Advanced Computational DSA Platform with Real-Time Execution, Visual Tracing & Analytical Profiling. Built for rigorous algorithmic introspection across multi-megabyte unstructured text corpora.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Corpus Memory Load', val: `${documents.length} Files`, sub: `${sizeMB} MB text data`, color: 'bg-primary' },
          { title: 'Search Engine Telemetry', val: `${totalSearches} Queries`, sub: `Hit Rate: ${hitRate}%`, color: 'bg-secondary' },
          { title: 'Implemented Modules', val: '16 / 16 DSA', sub: 'All Modules', color: 'bg-tertiary' },
          { title: 'Mean Benchmark Latency', val: `${meanLatency} ms`, sub: 'Linear O(n)', color: 'bg-primary' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-40">
            <span className="text-xs uppercase text-outline font-semibold tracking-wider">{m.title}</span>
            <div>
              <div className="text-2xl font-bold text-on-surface tracking-tight">{m.val}</div>
              <div className="text-sm text-on-surface-variant mt-1">{m.sub}</div>
            </div>
            <div className={`h-1.5 rounded-full ${m.color} w-3/4 mt-4`}></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-lg font-semibold text-on-surface">Accelerated Lab Workspaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/search" className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 hover:border-primary/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
              <Search size={20} />
            </div>
            <h3 className="font-semibold text-on-surface">Multi-Pattern Search</h3>
            <p className="text-sm text-on-surface-variant mt-2 mb-4">Ingest raw document buffers and run concurrent searches.</p>
            <div className="flex items-center justify-between text-sm text-primary font-semibold">
              Enter Studio <ArrowRight size={16} />
            </div>
          </Link>
          
          <Link to="/algorithm-lab" className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 hover:border-secondary/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4 group-hover:bg-secondary group-hover:text-white transition-colors">
              <Activity size={20} />
            </div>
            <h3 className="font-semibold text-on-surface">Step-by-Step Visualizer</h3>
            <p className="text-sm text-on-surface-variant mt-2 mb-4">Inspect exact pointer shifts and failure link redirections.</p>
            <div className="flex items-center justify-between text-sm text-secondary font-semibold">
              Visual Trace <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/co3-co4-labs" className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 hover:border-tertiary/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary mb-4 group-hover:bg-tertiary group-hover:text-white transition-colors">
              <Network size={20} />
            </div>
            <h3 className="font-semibold text-on-surface">Flow Network Simulator</h3>
            <p className="text-sm text-on-surface-variant mt-2 mb-4">Construct residual capacities and evaluate augmenting paths.</p>
            <div className="flex items-center justify-between text-sm text-tertiary font-semibold">
              Execute Graph <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/dp-lab" className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 hover:border-primary/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
              <Box size={20} />
            </div>
            <h3 className="font-semibold text-on-surface">Matrix Alignment Tool</h3>
            <p className="text-sm text-on-surface-variant mt-2 mb-4">Dynamic programming cell matrix for Wagner-Fischer.</p>
            <div className="flex items-center justify-between text-sm text-primary font-semibold">
              Inspect Table <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
