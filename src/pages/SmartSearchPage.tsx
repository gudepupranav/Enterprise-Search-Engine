import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Hash, 
  Bot, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Upload, 
  Info,
  Code,
  FileCode,
  Table,
  ArrowRight,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { recommendAlgorithm, runSearchAlgorithm, getAlgorithmMetadata } from '../engine/algorithmCatalog';
import { suffixArrayMultiSearch, buildSuffixArray, buildLCPArray } from '../engine/multiPattern';
import { computeLPSArray, computeZArray } from '../engine/stringSearch';
import { processDocumentFile, type ProcessedDocument } from '../engine/documentProcessing';
import type { SearchAlgorithmId, SearchResult } from '../types';

interface FleetDocResult {
  doc: ProcessedDocument;
  docIndex: number;
  results: SearchResult[];
  totalMatches: number;
  totalExecutionTimeMs: number;
  totalComparisons: number;
}

export default function SmartSearchPage() {
  const { documents, addDocuments, addSearchRecord, settings } = useApp();
  const [searchParams] = useSearchParams();

  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [searchMode, setSearchMode] = useState<'single' | 'multi'>('single');
  const [singleQuery, setSingleQuery] = useState('revenue');
  const [multiQueryText, setMultiQueryText] = useState('revenue\noperating\nEBITDA\nmargin');
  const [selectedEngine, setSelectedEngine] = useState<SearchAlgorithmId>(settings.defaultEngine);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [fleetResults, setFleetResults] = useState<FleetDocResult[]>([]);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [lastExecutedEngine, setLastExecutedEngine] = useState<string>('');

  // Handle URL search params on mount or param change
  useEffect(() => {
    const docIdParam = searchParams.get('docId');
    const docIndexParam = searchParams.get('docIndex');
    const qParam = searchParams.get('q');
    const modeParam = searchParams.get('mode');

    if (docIdParam) {
      const idx = documents.findIndex(d => d.id === docIdParam);
      if (idx !== -1) setSelectedDocIndex(idx);
    } else if (docIndexParam !== null && !isNaN(Number(docIndexParam))) {
      const idx = Number(docIndexParam);
      if (idx >= -1 && idx < documents.length) setSelectedDocIndex(idx);
    }

    if (qParam) {
      setSingleQuery(qParam);
    }
    if (modeParam === 'multi' || modeParam === 'single') {
      setSearchMode(modeParam);
    }
  }, [searchParams, documents]);

  // Clean bounds when document fleet changes
  useEffect(() => {
    if (selectedDocIndex >= documents.length && documents.length > 0) {
      setSelectedDocIndex(0);
      setResults([]);
      setFleetResults([]);
    }
  }, [documents.length, selectedDocIndex]);

  const isFleetMode = selectedDocIndex === -1;
  const activeDoc = isFleetMode ? null : (documents[selectedDocIndex] ?? documents[0] ?? null);

  const patterns = useMemo(() => {
    return Array.from(new Set(
      multiQueryText
        .split(/\r?\n|,/)
        .map(p => p.trim())
        .filter(Boolean)
    ));
  }, [multiQueryText]);

  // Intelligent Recommendation logic (for active doc or general corpus)
  const recommendation = useMemo(() => {
    const targetSize = activeDoc ? activeDoc.measuredCharacters : 12000;
    return recommendAlgorithm({
      documentSize: targetSize,
      patternLength: searchMode === 'single' ? singleQuery.length : (patterns[0]?.length ?? 4),
      numberOfPatterns: searchMode === 'multi' ? patterns.length : 1,
      mode: searchMode === 'multi' ? 'multi-pattern' : 'single',
    });
  }, [activeDoc, searchMode, singleQuery, patterns]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        addDocuments([processDocumentFile(file.name, content, file.size)]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const handleClear = () => {
    setSingleQuery('');
    setMultiQueryText('');
    setResults([]);
    setFleetResults([]);
  };

  const executeSearch = () => {
    const effectiveEngine = selectedEngine === 'auto'
      ? (recommendation?.algorithm.id ?? 'kmp')
      : selectedEngine;

    const getTextForSearch = (doc: ProcessedDocument) =>
      settings.caseSensitive ? doc.searchText : doc.searchText.toLowerCase();
    const getQueryForSearch = (q: string) =>
      settings.caseSensitive ? q : q.toLowerCase();

    // FLEET-WIDE (ALL DOCUMENTS) SEARCH
    if (isFleetMode) {
      const fleetList: FleetDocResult[] = [];
      let fleetEngineName = '';

      documents.forEach((doc, idx) => {
        const docText = getTextForSearch(doc);
        if (searchMode === 'multi') {
          const targetPatterns = patterns.map(getQueryForSearch);
          const multiResultsMap = suffixArrayMultiSearch(docText, targetPatterns);
          const multiList = Object.values(multiResultsMap);
          const totalMatches = multiList.reduce((acc, r) => acc + r.matchCount, 0);
          const totalExecutionTimeMs = multiList.reduce((acc, r) => acc + r.executionTimeMs, 0);
          const totalComparisons = multiList.reduce((acc, r) => acc + r.comparisons, 0);
          fleetEngineName = 'Suffix Array Multi-Pattern Index';

          fleetList.push({
            doc,
            docIndex: idx,
            results: multiList,
            totalMatches,
            totalExecutionTimeMs,
            totalComparisons,
          });

          multiList.forEach(res => {
            addSearchRecord({
              query: res.pattern,
              docName: doc.name,
              matchCount: res.matchCount,
              executionTimeMs: res.executionTimeMs,
              algorithmName: res.algorithmName,
              comparisons: res.comparisons,
            });
          });
        } else {
          const q = singleQuery.trim();
          if (!q) return;
          const res = runSearchAlgorithm(effectiveEngine, docText, getQueryForSearch(q));
          fleetEngineName = getAlgorithmMetadata(effectiveEngine).name;

          fleetList.push({
            doc,
            docIndex: idx,
            results: [res],
            totalMatches: res.matchCount,
            totalExecutionTimeMs: res.executionTimeMs,
            totalComparisons: res.comparisons,
          });

          addSearchRecord({
            query: q,
            docName: doc.name,
            matchCount: res.matchCount,
            executionTimeMs: res.executionTimeMs,
            algorithmName: res.algorithmName,
            comparisons: res.comparisons,
          });
        }
      });

      setFleetResults(fleetList);
      setLastExecutedEngine(fleetEngineName);
      setResults([]);
      return;
    }

    // SINGLE DOCUMENT SEARCH
    if (!activeDoc) return;
    const docText = getTextForSearch(activeDoc);

    if (searchMode === 'multi') {
      const targetPatterns = patterns.map(getQueryForSearch);
      const multiResultsMap = suffixArrayMultiSearch(docText, targetPatterns);
      const multiList = Object.values(multiResultsMap);
      setResults(multiList);
      setFleetResults([]);
      setLastExecutedEngine('Suffix Array Multi-Pattern Index');

      multiList.forEach(res => {
        addSearchRecord({
          query: res.pattern,
          docName: activeDoc.name,
          matchCount: res.matchCount,
          executionTimeMs: res.executionTimeMs,
          algorithmName: res.algorithmName,
          comparisons: res.comparisons,
        });
      });
      return;
    }

    const q = singleQuery.trim();
    if (!q) return;

    const res = runSearchAlgorithm(effectiveEngine, docText, getQueryForSearch(q));
    setResults([res]);
    setFleetResults([]);
    setLastExecutedEngine(getAlgorithmMetadata(effectiveEngine).name);

    addSearchRecord({
      query: q,
      docName: activeDoc.name,
      matchCount: res.matchCount,
      executionTimeMs: res.executionTimeMs,
      algorithmName: res.algorithmName,
      comparisons: res.comparisons,
    });
  };

  // Technical transparency computations
  const technicalData = useMemo(() => {
    if (!activeDoc || results.length === 0) return null;
    const targetPattern = searchMode === 'single' ? singleQuery.trim() : patterns[0] ?? '';
    const textSlice = activeDoc.searchText.slice(0, 150);

    return {
      lps: computeLPSArray(targetPattern),
      zBox: computeZArray(targetPattern + '$' + textSlice.slice(0, 100)),
      suffixArrayPreview: buildSuffixArray(textSlice).slice(0, 15),
      lcpPreview: buildLCPArray(
        textSlice,
        buildSuffixArray(textSlice)
      ).slice(0, 15),
    };
  }, [activeDoc, results, searchMode, singleQuery, patterns]);

  const totalMatches = results.reduce((acc, r) => acc + r.matchCount, 0);
  const totalExecutionTime = results.reduce((acc, r) => acc + r.executionTimeMs, 0);

  // Highlighting coordinates for single document view
  const highlightMatches = useMemo(() => {
    if (results.length === 0) return [];
    return Array.from(new Set(results.flatMap(r => r.matches))).sort((a, b) => a - b);
  }, [results]);

  const highlightLength = searchMode === 'single' 
    ? singleQuery.trim().length 
    : Math.max(...patterns.map(p => p.length), 0);

  // Fleet aggregate metrics
  const fleetTotalMatches = fleetResults.reduce((acc, f) => acc + f.totalMatches, 0);
  const fleetTotalLatency = fleetResults.reduce((acc, f) => acc + f.totalExecutionTimeMs, 0);
  const fleetTotalComparisons = fleetResults.reduce((acc, f) => acc + f.totalComparisons, 0);

  const getFormatIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'json': return <FileCode size={15} className="text-amber-600" />;
      case 'csv': return <Table size={15} className="text-emerald-600" />;
      default: return <FileText size={15} className="text-blue-600" />;
    }
  };

  return (
    <div className="py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Smart Search Engine</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Production-grade document search supporting single queries, multi-pattern batches, and corpus-wide fleet scanning.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant bg-surface hover:bg-surface-container transition-colors text-on-surface">
            <Upload size={14} />
            Add Document
            <input type="file" multiple accept=".txt,.json,.csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Search Configuration Card */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
        {/* Document Selector & Mode Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Target Scope</label>
            <select
              value={selectedDocIndex}
              onChange={e => {
                setSelectedDocIndex(Number(e.target.value));
                setResults([]);
                setFleetResults([]);
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:border-primary"
            >
              <option value="-1">
                Entire Corpus ({documents.length} Files Index)
              </option>
              {documents.map((doc, idx) => (
                <option key={doc.id} value={idx}>
                  {doc.name} ({(doc.fileSizeBytes / 1024).toFixed(1)} KB · {doc.tokenCount} tokens)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Search Paradigm</label>
            <div className="flex rounded-lg border border-outline-variant bg-surface p-1 gap-1">
              <button
                onClick={() => { setSearchMode('single'); setResults([]); setFleetResults([]); }}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  searchMode === 'single' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Search size={14} /> Single Pattern
              </button>
              <button
                onClick={() => { setSearchMode('multi'); setResults([]); setFleetResults([]); }}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  searchMode === 'multi' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Hash size={14} /> Multi-Pattern Batch
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Execution Engine</label>
            <select
              value={selectedEngine}
              onChange={e => {
                setSelectedEngine(e.target.value as SearchAlgorithmId);
                setResults([]);
                setFleetResults([]);
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:border-primary"
            >
              <option value="auto">Auto (Adaptive Engine Selector)</option>
              <option value="kmp">Knuth-Morris-Pratt (KMP)</option>
              <option value="rabin">Rabin-Karp Rolling Hash</option>
              <option value="z">Z-Algorithm (Z-Box)</option>
              <option value="suffix-array">Suffix Array (Binary Search)</option>
              <option value="naive">Naïve Sliding Window Scan</option>
            </select>
          </div>
        </div>

        {/* Query Input Area */}
        {searchMode === 'single' ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 text-outline" size={16} />
              <input
                type="text"
                placeholder={isFleetMode ? "Search pattern across entire corpus..." : "Enter query pattern to search..."}
                value={singleQuery}
                onChange={e => {
                  setSingleQuery(e.target.value);
                  if (results.length > 0 || fleetResults.length > 0) {
                    setResults([]);
                    setFleetResults([]);
                  }
                }}
                onKeyDown={e => e.key === 'Enter' && executeSearch()}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                disabled={!singleQuery && results.length === 0}
                className="px-4 py-2.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors disabled:opacity-40 flex items-center gap-1.5"
                title="Reset search"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <button
                onClick={executeSearch}
                disabled={(!activeDoc && !isFleetMode) || !singleQuery.trim()}
                className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-xs flex items-center gap-2"
              >
                <Zap size={15} /> {isFleetMode ? 'Search Entire Corpus' : 'Search Document'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs text-on-surface-variant">
              <span>Enter multiple search patterns (one per line or comma-separated):</span>
              <span className="font-mono font-bold text-primary">{patterns.length} unique patterns queued</span>
            </div>
            <textarea
              value={multiQueryText}
              onChange={e => {
                setMultiQueryText(e.target.value);
                if (results.length > 0 || fleetResults.length > 0) {
                  setResults([]);
                  setFleetResults([]);
                }
              }}
              placeholder="Enter search patterns (e.g. revenue, EBITDA, margin)..."
              rows={3}
              className="w-full p-3 rounded-lg border border-outline-variant font-mono text-xs outline-none focus:border-primary"
            />
            <div className="flex justify-end items-center gap-2">
              <button
                onClick={handleClear}
                disabled={!multiQueryText && results.length === 0}
                className="px-4 py-2.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors disabled:opacity-40 flex items-center gap-1.5"
                title="Reset search patterns"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <button
                onClick={executeSearch}
                disabled={(!activeDoc && !isFleetMode) || patterns.length === 0}
                className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-xs flex items-center gap-2"
              >
                <Zap size={15} /> {isFleetMode ? 'Execute Corpus Multi-Pattern Search' : 'Execute Multi-Pattern Search'}
              </button>
            </div>
          </div>
        )}

        {/* Heuristic Selection Details */}
        {selectedEngine === 'auto' && recommendation && (
          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex items-start gap-2.5 text-xs">
            <Bot size={16} className="text-primary mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-primary">
                Engine Recommendation: {recommendation.algorithm.name} ({recommendation.algorithm.timeComplexity})
              </span>
              <span className="text-on-surface-variant leading-snug">{recommendation.reason}</span>
            </div>
          </div>
        )}
      </div>

      {/* FLEET-WIDE RESULTS DISPLAY */}
      {isFleetMode && fleetResults.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* Fleet Telemetry Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-xs">
              <span className="text-[11px] text-outline uppercase font-semibold">Corpus Documents</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-on-surface font-mono">{fleetResults.length}</span>
                <span className="text-xs text-on-surface-variant">files evaluated</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-xs">
              <span className="text-[11px] text-outline uppercase font-semibold">Total Matches</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-700 font-mono">{fleetTotalMatches}</span>
                <span className="text-xs text-on-surface-variant">matches found</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-xs">
              <span className="text-[11px] text-outline uppercase font-semibold">Corpus Latency</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-primary font-mono">{fleetTotalLatency.toFixed(3)}</span>
                <span className="text-xs text-on-surface-variant">ms elapsed</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-xs">
              <span className="text-[11px] text-outline uppercase font-semibold">Exact Comparisons</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-on-surface font-mono">{fleetTotalComparisons.toLocaleString()}</span>
                <span className="text-xs text-on-surface-variant">operations</span>
              </div>
            </div>
          </div>

          {/* Fleet Breakdown Table */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
              <span className="font-bold text-on-surface">Corpus Match Breakdown by Document</span>
              <span className="font-mono text-on-surface-variant">Engine: {lastExecutedEngine}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold border-b border-outline-variant/30 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Tokens</th>
                    <th className="py-3 px-4">Matches</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {fleetResults.map((item) => (
                    <tr key={item.doc.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getFormatIcon(item.doc.extension)}
                          <span className="font-bold text-on-surface">{item.doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-on-surface-variant">
                        {item.doc.measuredCharacters.toLocaleString()} chars
                      </td>
                      <td className="py-3 px-4 font-mono text-on-surface-variant">
                        {item.doc.tokenCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          item.totalMatches > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.totalMatches} match{item.totalMatches === 1 ? '' : 'es'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-primary">
                        {item.totalExecutionTimeMs.toFixed(3)} ms
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedDocIndex(item.docIndex);
                            setResults(item.results);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-outline-variant hover:bg-surface-container text-primary transition-colors"
                        >
                          Inspect Matches <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE DOCUMENT RESULTS TELEMETRY BAR */}
      {!isFleetMode && results.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-outline uppercase font-semibold text-[11px]">Execution Engine:</span>
              <span className="font-bold text-primary font-mono">{lastExecutedEngine}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-outline uppercase font-semibold text-[11px]">Matches Found:</span>
              <span className="font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {totalMatches} match{totalMatches === 1 ? '' : 'es'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-outline uppercase font-semibold text-[11px]">Browser Execution Latency:</span>
              <span className="font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {totalExecutionTime.toFixed(3)} ms
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Code size={14} />
            {showTechnicalDetails ? 'Hide Technical Details' : 'Show Technical Details'}
            {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}

      {/* Expandable Technical Details Panel */}
      {!isFleetMode && showTechnicalDetails && technicalData && (
        <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4 text-xs font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <span className="font-bold text-on-surface flex items-center gap-2 text-sm">
              <Info size={16} className="text-primary" />
              Technical Engine Specifications & Internal State
            </span>
            <span className="font-mono text-[11px] text-outline">Verified In-Browser Execution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
              <span className="text-[11px] text-outline uppercase font-semibold">Active Algorithm</span>
              <p className="font-bold text-primary mt-1">{lastExecutedEngine}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">Precomputed auxiliary indices</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
              <span className="text-[11px] text-outline uppercase font-semibold">Time Complexity</span>
              <p className="font-bold font-mono text-on-surface mt-1">{results[0]?.timeComplexity}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">Asymptotic worst-case</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
              <span className="text-[11px] text-outline uppercase font-semibold">Space Complexity</span>
              <p className="font-bold font-mono text-on-surface mt-1">{results[0]?.spaceComplexity}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">Auxiliary state footprint</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
              <span className="text-[11px] text-outline uppercase font-semibold">Recorded Comparisons</span>
              <p className="font-bold font-mono text-emerald-700 mt-1">
                {results.reduce((s, r) => s + r.comparisons, 0).toLocaleString()} ops
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">Exact character evaluations</p>
            </div>
          </div>

          {/* Internal Array Structures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-white p-3.5 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
              <span className="font-bold text-on-surface text-xs">
                KMP Longest Prefix-Suffix (LPS) Table:
              </span>
              <p className="text-[11px] text-on-surface-variant">
                State transition table mapping longest proper prefix which is also a suffix:
              </p>
              <div className="flex flex-wrap gap-1 font-mono text-[11px] max-h-24 overflow-y-auto">
                {technicalData.lps.map((val, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-surface border border-outline-variant/30">
                    <span className="text-outline">[{idx}]</span> {val}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
              <span className="font-bold text-on-surface text-xs">
                Suffix Array & Kasai LCP Array Slice:
              </span>
              <p className="text-[11px] text-on-surface-variant">
                Sorted suffix offsets and rank-based longest common prefix depths:
              </p>
              <div className="flex flex-wrap gap-1 font-mono text-[11px] max-h-24 overflow-y-auto">
                {technicalData.suffixArrayPreview.map((saVal, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-surface border border-outline-variant/30">
                    <span className="text-outline">SA[{idx}]:</span> {saVal} <span className="text-primary">LCP:{technicalData.lcpPreview[idx] ?? 0}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Breakdown Table (if multiple patterns in single document) */}
      {!isFleetMode && results.length > 1 && (
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
            <span className="font-bold text-on-surface">Multi-Pattern Query Breakdown</span>
            <span className="text-on-surface-variant font-mono">{results.length} patterns evaluated</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold border-b border-outline-variant/30 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Pattern</th>
                  <th className="py-2.5 px-4">Match Count</th>
                  <th className="py-2.5 px-4">Character Offsets</th>
                  <th className="py-2.5 px-4">Comparisons</th>
                  <th className="py-2.5 px-4 text-right">Execution Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {results.map((res, i) => (
                  <tr key={i} className="hover:bg-surface-container-low/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-primary">{res.pattern}</td>
                    <td className="py-2.5 px-4 font-mono">{res.matchCount}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-on-surface-variant truncate max-w-xs">
                      {res.positions.length > 0 ? res.positions.slice(0, 8).join(', ') + (res.positions.length > 8 ? '...' : '') : 'None'}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{res.comparisons}</td>
                    <td className="py-2.5 px-4 font-mono text-right text-on-surface-variant">
                      {res.executionTimeMs.toFixed(3)} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document View & Highlight Canvas (Single Document mode) */}
      {!isFleetMode && (
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col min-h-[460px]">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span className="font-bold text-on-surface">{activeDoc ? activeDoc.name : 'No Document Selected'}</span>
            </div>
            {results.length > 0 && totalMatches > 0 && (
              <span className="font-mono text-on-surface-variant">
                Highlighting {highlightMatches.length} occurrence locations
              </span>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap bg-gray-50 text-on-surface">
            {activeDoc ? (
              activeDoc.originalText.length === 0 ? (
                <div className="h-full flex items-center justify-center text-outline gap-2">
                  <AlertCircle size={16} /> Document is empty (0 characters). Upload or select a document with content.
                </div>
              ) : results.length > 0 ? (
                totalMatches === 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                      <span>No occurrences found for query pattern using {lastExecutedEngine}.</span>
                      <span className="text-[11px] text-amber-800">Verify pattern spelling or check case sensitivity.</span>
                    </div>
                    <div>{activeDoc.originalText}</div>
                  </div>
                ) : (
                  <HighlightedDocumentContent
                    originalText={activeDoc.originalText}
                    matchPositions={highlightMatches}
                    patternLength={highlightLength}
                  />
                )
              ) : (
                activeDoc.originalText
              )
            ) : (
              <div className="h-full flex items-center justify-center text-outline">
                Select or upload a document to begin searching.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightedDocumentContent({
  originalText,
  matchPositions,
  patternLength,
}: {
  originalText: string;
  matchPositions: number[];
  patternLength: number;
}) {
  if (matchPositions.length === 0 || patternLength <= 0) {
    return <>{originalText}</>;
  }

  // Deduplicate and sort positions
  const sortedPositions = Array.from(new Set(matchPositions)).sort((a, b) => a - b);

  // Merge overlapping and contiguous intervals to prevent corrupting text slicing
  const intervals: { start: number; end: number; matchCount: number }[] = [];
  for (const pos of sortedPositions) {
    if (pos < 0 || pos >= originalText.length) continue;
    const end = Math.min(originalText.length, pos + patternLength);
    if (intervals.length === 0) {
      intervals.push({ start: pos, end, matchCount: 1 });
    } else {
      const last = intervals[intervals.length - 1];
      if (pos <= last.end) {
        last.end = Math.max(last.end, end);
        last.matchCount++;
      } else {
        intervals.push({ start: pos, end, matchCount: 1 });
      }
    }
  }

  const fragments: React.ReactNode[] = [];
  let lastIndex = 0;

  intervals.forEach((iv, idx) => {
    if (iv.start > lastIndex) {
      fragments.push(originalText.slice(lastIndex, iv.start));
    }
    const matchText = originalText.slice(iv.start, iv.end);
    fragments.push(
      <mark
        key={`match-iv-${iv.start}-${idx}`}
        className="bg-yellow-200 text-yellow-950 font-bold px-0.5 rounded shadow-xs border border-yellow-300"
        title={`Match at position ${iv.start} (${iv.matchCount} occurrence${iv.matchCount > 1 ? 's' : ''})`}
      >
        {matchText}
      </mark>
    );
    lastIndex = iv.end;
  });

  if (lastIndex < originalText.length) {
    fragments.push(originalText.slice(lastIndex));
  }

  return <>{fragments}</>;
}
