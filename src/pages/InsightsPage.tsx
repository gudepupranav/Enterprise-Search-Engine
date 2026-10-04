import { useMemo } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Award,
  FileCode,
  Table
} from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function InsightsPage() {
  const { documents, searchHistory, comparisonHistory } = useApp();

  // Document fleet statistics
  const docStats = useMemo(() => {
    if (documents.length === 0) {
      return {
        totalDocs: 0,
        totalChars: 0,
        totalTokens: 0,
        avgChars: 0,
        avgTokens: 0,
        longestDoc: null,
        shortestDoc: null,
        formatCounts: { txt: 0, json: 0, csv: 0, other: 0 },
      };
    }

    const totalChars = documents.reduce((sum, d) => sum + d.measuredCharacters, 0);
    const totalTokens = documents.reduce((sum, d) => sum + d.tokenCount, 0);
    const avgChars = Math.round(totalChars / documents.length);
    const avgTokens = Math.round(totalTokens / documents.length);

    let longest = documents[0];
    let shortest = documents[0];

    const formatCounts = { txt: 0, json: 0, csv: 0, other: 0 };

    documents.forEach(d => {
      if (d.measuredCharacters > longest.measuredCharacters) longest = d;
      if (d.measuredCharacters < shortest.measuredCharacters) shortest = d;
      
      const ext = d.extension.toLowerCase();
      if (ext === 'txt') formatCounts.txt++;
      else if (ext === 'json') formatCounts.json++;
      else if (ext === 'csv') formatCounts.csv++;
      else formatCounts.other++;
    });

    return {
      totalDocs: documents.length,
      totalChars,
      totalTokens,
      avgChars,
      avgTokens,
      longestDoc: longest,
      shortestDoc: shortest,
      formatCounts,
    };
  }, [documents]);

  // Search History statistics
  const searchStats = useMemo(() => {
    if (searchHistory.length === 0) {
      return {
        totalSearches: 0,
        avgLatencyMs: 0,
        totalMatchesFound: 0,
        frequentPatterns: [],
        algorithmBreakdown: {},
      };
    }

    const totalSearches = searchHistory.length;
    const totalTime = searchHistory.reduce((sum, s) => sum + s.executionTimeMs, 0);
    const avgLatencyMs = totalTime / totalSearches;
    const totalMatchesFound = searchHistory.reduce((sum, s) => sum + s.matchCount, 0);

    // Aggregate pattern frequencies
    const patternFreqMap: Record<string, { count: number; matches: number }> = {};
    const algoMap: Record<string, number> = {};

    searchHistory.forEach(s => {
      if (!patternFreqMap[s.query]) {
        patternFreqMap[s.query] = { count: 0, matches: 0 };
      }
      patternFreqMap[s.query].count++;
      patternFreqMap[s.query].matches += s.matchCount;

      algoMap[s.algorithmName] = (algoMap[s.algorithmName] || 0) + 1;
    });

    const frequentPatterns = Object.entries(patternFreqMap)
      .map(([query, data]) => ({ query, count: data.count, matches: data.matches }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSearches,
      avgLatencyMs,
      totalMatchesFound,
      frequentPatterns,
      algorithmBreakdown: algoMap,
    };
  }, [searchHistory]);

  return (
    <div className="py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Document & Engine Insights</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time analytics aggregated strictly from indexed documents and live search executions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <TrendingUp size={15} /> Real-Time Telemetry
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Indexed Corpus Volume</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary font-mono">{docStats.totalDocs}</span>
            <span className="text-xs text-on-surface-variant">documents</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-2 font-mono">
            {docStats.totalChars.toLocaleString()} total characters
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Total Linguistic Tokens</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-mono">
              {docStats.totalTokens.toLocaleString()}
            </span>
            <span className="text-xs text-on-surface-variant">tokens</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-2">
            Avg ~{docStats.avgTokens.toLocaleString()} tokens / doc
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Search Engine Latency</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 font-mono">
              {searchStats.avgLatencyMs.toFixed(3)} ms
            </span>
            <span className="text-xs text-on-surface-variant">mean time</span>
          </div>
          <span className="text-[11px] text-emerald-800 mt-2 font-mono">
            {searchStats.totalMatchesFound} matches verified
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Total Queries Processed</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary font-mono">{searchStats.totalSearches}</span>
            <span className="text-xs text-on-surface-variant">runs</span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-2">
            {comparisonHistory.length} structural comparisons
          </span>
        </div>
      </div>

      {/* Extremes & Document Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
          <span className="font-bold text-sm text-on-surface">Corpus Extremes & Length Profile</span>
          {docStats.longestDoc ? (
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex justify-between items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <Award size={18} className="text-amber-500 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-outline uppercase text-[10px] font-semibold">Longest Document</span>
                    <span className="font-bold text-on-surface truncate">{docStats.longestDoc.name}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-primary">
                  {docStats.longestDoc.measuredCharacters.toLocaleString()} chars
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex justify-between items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={18} className="text-blue-500 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-outline uppercase text-[10px] font-semibold">Shortest Document</span>
                    <span className="font-bold text-on-surface truncate">{docStats.shortestDoc?.name}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-on-surface">
                  {docStats.shortestDoc?.measuredCharacters.toLocaleString()} chars
                </span>
              </div>

              <div className="p-3 rounded-lg border border-outline-variant/20 flex justify-between text-on-surface-variant text-[11px]">
                <span>Mean Document Length:</span>
                <span className="font-mono font-bold text-on-surface">{docStats.avgChars.toLocaleString()} characters</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-outline text-xs">No active documents to analyze.</div>
          )}
        </div>

        {/* Format Distribution Card */}
        <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
          <span className="font-bold text-sm text-on-surface">Document Format Composition</span>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Plain Text (.txt)', count: docStats.formatCounts.txt, icon: <FileText size={15} className="text-blue-600" /> },
              { label: 'Structured JSON (.json)', count: docStats.formatCounts.json, icon: <FileCode size={15} className="text-amber-600" /> },
              { label: 'Tabular CSV (.csv)', count: docStats.formatCounts.csv, icon: <Table size={15} className="text-emerald-600" /> },
            ].map((fmt, i) => {
              const pct = docStats.totalDocs > 0 ? ((fmt.count / docStats.totalDocs) * 100).toFixed(0) : 0;
              return (
                <div key={i} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      {fmt.icon} {fmt.label}
                    </span>
                    <span className="font-mono font-bold text-on-surface">{fmt.count} files ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Query Pattern Analytics */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
          <span className="font-bold text-on-surface">Frequently Queried Search Patterns</span>
          <span className="text-on-surface-variant font-mono">{searchStats.totalSearches} total search traces</span>
        </div>

        {searchStats.frequentPatterns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold border-b border-outline-variant/30 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Pattern Query</th>
                  <th className="py-2.5 px-4">Times Searched</th>
                  <th className="py-2.5 px-4">Total Matches Verified</th>
                  <th className="py-2.5 px-4">Frequency Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {searchStats.frequentPatterns.map((item, idx) => {
                  const share = searchStats.totalSearches > 0 
                    ? ((item.count / searchStats.totalSearches) * 100).toFixed(0)
                    : 0;
                  return (
                    <tr key={idx} className="hover:bg-surface-container-low/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-primary">{item.query}</td>
                      <td className="py-2.5 px-4 font-mono">{item.count}</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-700 font-bold">{item.matches}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${share}%` }}></div>
                          </div>
                          <span className="font-mono text-[11px] text-outline">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-outline text-xs">No search queries logged yet.</div>
        )}
      </div>
    </div>
  );
}
