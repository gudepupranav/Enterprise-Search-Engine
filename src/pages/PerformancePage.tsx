import { useState, useEffect } from 'react';
import { 
  Play, 
  BarChart3, 
  Clock, 
  Info, 
  RotateCcw
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { naiveSearch, kmpSearch, rabinKarpSearch, zAlgorithmSearch } from '../engine/stringSearch';
import { buildSuffixArray, searchSuffixArray } from '../engine/multiPattern';
import type { SearchResult } from '../types';

export default function PerformancePage() {
  const { documents } = useApp();
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [benchmarkPattern, setBenchmarkPattern] = useState<string>('revenue');
  const [benchmarkResults, setBenchmarkResults] = useState<SearchResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (selectedDocIndex >= documents.length && documents.length > 0) {
      setSelectedDocIndex(0);
      setBenchmarkResults(null);
    }
  }, [documents.length, selectedDocIndex]);

  const activeDoc = documents[selectedDocIndex] ?? documents[0];
  const targetText = activeDoc ? activeDoc.originalText : '';

  const runBenchmark = () => {
    if (!targetText || !benchmarkPattern) return;
    setIsRunning(true);

    setTimeout(() => {
      // Execute each algorithm against the EXACT same text & pattern
      const naive = naiveSearch(targetText, benchmarkPattern);
      const kmp = kmpSearch(targetText, benchmarkPattern);
      const rabin = rabinKarpSearch(targetText, benchmarkPattern);
      const zAlgo = zAlgorithmSearch(targetText, benchmarkPattern);

      const saBuildStart = performance.now();
      const sa = buildSuffixArray(targetText);
      const saRes = searchSuffixArray(targetText, sa, benchmarkPattern);
      const saTotalTime = performance.now() - saBuildStart;

      const results: SearchResult[] = [
        kmp,
        rabin,
        zAlgo,
        {
          ...saRes,
          algorithmName: 'Suffix Array (Index + Binary Search)',
          executionTimeMs: saTotalTime,
        },
        naive,
      ];

      setBenchmarkResults(results);
      setIsRunning(false);
    }, 50);
  };

  const maxTime = benchmarkResults
    ? Math.max(...benchmarkResults.map(r => r.executionTimeMs), 0.001)
    : 1;

  const maxComparisons = benchmarkResults
    ? Math.max(...benchmarkResults.map(r => r.comparisons), 1)
    : 1;

  return (
    <div className="py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Performance & Benchmark Suite</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Empirical multi-algorithm performance benchmarking measuring execution latency and exact character comparisons.
          </p>
        </div>
        <button
          onClick={runBenchmark}
          disabled={isRunning || !targetText}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
        >
          {isRunning ? <RotateCcw size={15} className="animate-spin" /> : <Play size={15} />}
          {isRunning ? 'Running Benchmark...' : 'Execute Multi-Engine Benchmark'}
        </button>
      </div>

      {/* Benchmark Target Setup */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Benchmark Corpus</label>
          <select
            value={selectedDocIndex}
            onChange={e => {
              setSelectedDocIndex(Number(e.target.value));
              setBenchmarkResults(null);
            }}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:border-primary"
          >
            {documents.map((doc, idx) => (
              <option key={doc.id} value={idx}>
                {doc.name} ({doc.measuredCharacters.toLocaleString()} chars · {(doc.fileSizeBytes / 1024).toFixed(1)} KB)
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Pattern to Search</label>
          <input
            type="text"
            value={benchmarkPattern}
            onChange={e => {
              setBenchmarkPattern(e.target.value);
              setBenchmarkResults(null);
            }}
            placeholder="Enter benchmark pattern..."
            className="px-3 py-2 text-xs font-mono rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Telemetry Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Evaluated Payload</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary font-mono">
              {activeDoc ? activeDoc.measuredCharacters.toLocaleString() : 0}
            </span>
            <span className="text-xs text-on-surface-variant">characters</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-2">
            Pattern length: {benchmarkPattern.length} chars
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Algorithms Tested</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-mono">5</span>
            <span className="text-xs text-on-surface-variant">engines</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-2">
            KMP, Rabin-Karp, Z-Algo, Suffix Array, Naïve
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Measurement Integrity</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700">100% Deterministic</span>
          </div>
          <span className="text-[11px] text-emerald-800 mt-2">
            performance.now() microsecond timers
          </span>
        </div>
      </div>

      {/* Benchmark Results Section */}
      {benchmarkResults && (
        <div className="flex flex-col gap-6">
          {/* Comparative Results Table */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
              <span className="font-bold text-on-surface">Multi-Algorithm Performance Matrix</span>
              <span className="text-on-surface-variant font-mono">Input: &quot;{benchmarkPattern}&quot;</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold border-b border-outline-variant/30 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Algorithm</th>
                    <th className="py-3 px-4">Theoretical Time</th>
                    <th className="py-3 px-4">Theoretical Space</th>
                    <th className="py-3 px-4">Matches Verified</th>
                    <th className="py-3 px-4">Character Comparisons</th>
                    <th className="py-3 px-4 text-right">Measured Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {benchmarkResults.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-container-low/50">
                      <td className="py-3 px-4 font-bold text-on-surface">{r.algorithmName}</td>
                      <td className="py-3 px-4 font-mono text-primary font-semibold">{r.timeComplexity}</td>
                      <td className="py-3 px-4 font-mono text-on-surface-variant">{r.spaceComplexity}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">{r.matchCount}</td>
                      <td className="py-3 px-4 font-mono">{r.comparisons.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-right text-primary">
                        {r.executionTimeMs.toFixed(3)} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Execution-Time & Comparisons Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Latency Chart */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
              <span className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <Clock size={16} className="text-primary" /> Measured Execution Time (ms)
              </span>
              <div className="flex flex-col gap-3">
                {benchmarkResults.map((r, i) => {
                  const pct = Math.max(4, Math.round((r.executionTimeMs / maxTime) * 100));
                  return (
                    <div key={i} className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-on-surface truncate">{r.algorithmName}</span>
                        <span className="font-mono font-bold text-primary">{r.executionTimeMs.toFixed(3)} ms</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparisons Chart */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
              <span className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <BarChart3 size={16} className="text-emerald-700" /> Exact Character Comparisons
              </span>
              <div className="flex flex-col gap-3">
                {benchmarkResults.map((r, i) => {
                  const pct = Math.max(4, Math.round((r.comparisons / maxComparisons) * 100));
                  return (
                    <div key={i} className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-on-surface truncate">{r.algorithmName}</span>
                        <span className="font-mono font-bold text-emerald-800">{r.comparisons.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Theoretical vs Measured Engineering Analysis */}
          <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-3 text-xs">
            <span className="font-bold text-on-surface flex items-center gap-2 text-sm">
              <Info size={16} className="text-primary" />
              Theoretical Complexity vs. Measured Browser Execution Time
            </span>
            <p className="text-on-surface-variant leading-relaxed">
              While <strong>theoretical time complexity</strong> (such as KMP’s guaranteed <em>O(N + M)</em> or Suffix Array’s <em>O(M · log N + K)</em>) describes asymptotic scaling on infinitely growing inputs, <strong>measured browser execution time</strong> is influenced by V8 JavaScript engine JIT compilation, CPU L1/L2 data cache locality, and string allocation overheads. 
              Counting <strong>character comparisons</strong> provides an engine-independent metric verifying that KMP never backtracks, whereas Naïve repeatedly re-evaluates characters on partial prefix matches.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
