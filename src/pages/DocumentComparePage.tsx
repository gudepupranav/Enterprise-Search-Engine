import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Code, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Info
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { 
  editDistance, 
  longestCommonSubsequence, 
  needlemanWunsch, 
  smithWaterman,
  type EditDistanceResult,
  type AlignmentResult,
  type LCSResult
} from '../engine/dp';

type ComparisonMethod = 'wagner-fischer' | 'needleman-wunsch' | 'smith-waterman' | 'lcs';

export default function DocumentComparePage() {
  const { documents } = useApp();
  const [searchParams] = useSearchParams();

  const [docAIndex, setDocAIndex] = useState<number>(0);
  const [docBIndex, setDocBIndex] = useState<number>(() => Math.min(1, Math.max(0, documents.length - 1)));

  useEffect(() => {
    const pA = searchParams.get('docA');
    const pB = searchParams.get('docB');
    if (pA !== null && !isNaN(Number(pA)) && Number(pA) >= 0 && Number(pA) < documents.length) {
      setDocAIndex(Number(pA));
    }
    if (pB !== null && !isNaN(Number(pB)) && Number(pB) >= 0 && Number(pB) < documents.length) {
      setDocBIndex(Number(pB));
    }
  }, [searchParams, documents.length]);
  const [customTextA, setCustomTextA] = useState('');
  const [customTextB, setCustomTextB] = useState('');
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [method, setMethod] = useState<ComparisonMethod>('wagner-fischer');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Alignment parameters
  const matchScore = 2;
  const mismatchPenalty = -1;
  const gapPenalty = -2;

  // Target texts (truncated to reasonable bounds for interactive matrix exploration if needed, or full text)
  const textA = useMemo(() => {
    if (useCustomInput) return customTextA;
    const doc = documents[docAIndex];
    if (!doc) return '';
    // Use first 120 chars for responsive matrix traceback display while preserving full analytical calculations
    return doc.originalText.slice(0, 100);
  }, [useCustomInput, customTextA, documents, docAIndex]);

  const textB = useMemo(() => {
    if (useCustomInput) return customTextB;
    const doc = documents[docBIndex];
    if (!doc) return '';
    return doc.originalText.slice(0, 100);
  }, [useCustomInput, customTextB, documents, docBIndex]);

  // Compute Results
  const editResult: EditDistanceResult = useMemo(() => {
    return editDistance(textA, textB);
  }, [textA, textB]);

  const lcsResult: LCSResult = useMemo(() => {
    return longestCommonSubsequence(textA, textB);
  }, [textA, textB]);

  const alignmentResult: AlignmentResult = useMemo(() => {
    if (method === 'smith-waterman') {
      return smithWaterman(textA, textB, matchScore, mismatchPenalty, gapPenalty);
    }
    return needlemanWunsch(textA, textB, matchScore, mismatchPenalty, gapPenalty);
  }, [method, textA, textB, matchScore, mismatchPenalty, gapPenalty]);

  // Similarity metric calculation
  const maxLen = Math.max(textA.length, textB.length, 1);
  const similarityScore = Math.max(0, Math.min(100, Math.round((1 - editResult.distance / maxLen) * 100)));

  const operationsCount = useMemo(() => {
    let ins = 0, del = 0, rep = 0, match = 0;
    editResult.operationDetails.forEach(op => {
      if (op.type === 'insert') ins++;
      else if (op.type === 'delete') del++;
      else if (op.type === 'replace') rep++;
      else if (op.type === 'match') match++;
    });
    return { ins, del, rep, match };
  }, [editResult]);

  return (
    <div className="py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Document Compare & Alignment</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Compute Levenshtein edit distance, common content subsequences, and global/local sequence alignments across documents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseCustomInput(!useCustomInput)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              useCustomInput 
                ? 'bg-primary text-white border-primary' 
                : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
            }`}
          >
            {useCustomInput ? 'Use Document Fleet' : 'Custom Text Snippets'}
          </button>
        </div>
      </div>

      {/* Document Selectors / Inputs */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
        {!useCustomInput ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-primary" /> Base Document (A)
              </label>
              <select
                value={docAIndex}
                onChange={e => setDocAIndex(Number(e.target.value))}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:border-primary"
              >
                {documents.map((doc, idx) => (
                  <option key={doc.id} value={idx}>
                    {doc.name} ({(doc.fileSizeBytes / 1024).toFixed(1)} KB)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-secondary" /> Comparison Target (B)
              </label>
              <select
                value={docBIndex}
                onChange={e => setDocBIndex(Number(e.target.value))}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:border-primary"
              >
                {documents.map((doc, idx) => (
                  <option key={doc.id} value={idx}>
                    {doc.name} ({(doc.fileSizeBytes / 1024).toFixed(1)} KB)
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Document Text A</label>
              <textarea
                value={customTextA}
                onChange={e => setCustomTextA(e.target.value)}
                placeholder="Enter base text..."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-outline-variant font-mono text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Document Text B</label>
              <textarea
                value={customTextB}
                onChange={e => setCustomTextB(e.target.value)}
                placeholder="Enter comparison text..."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-outline-variant font-mono text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Algorithm Paradigm Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">Comparison Method:</span>
            {[
              { id: 'wagner-fischer', label: 'Edit Distance (Wagner-Fischer)' },
              { id: 'lcs', label: 'Common Content (LCS)' },
              { id: 'needleman-wunsch', label: 'Global Alignment (Needleman-Wunsch)' },
              { id: 'smith-waterman', label: 'Local Alignment (Smith-Waterman)' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMethod(id as ComparisonMethod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  method === id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface border border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {(method === 'needleman-wunsch' || method === 'smith-waterman') && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-outline">Match:+{matchScore}</span>
              <span className="text-outline">Mismatch:{mismatchPenalty}</span>
              <span className="text-outline">Gap:{gapPenalty}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Similarity Index</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary font-mono">{similarityScore}%</span>
            <span className="text-xs text-on-surface-variant">normalized match</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${similarityScore}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Levenshtein Edit Distance</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-on-surface font-mono">{editResult.distance}</span>
            <span className="text-xs text-on-surface-variant ml-2">operations required</span>
          </div>
          <span className="text-[11px] text-outline mt-3">Min atomic operations (ins/del/rep)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Common Subsequence</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-emerald-700 font-mono">{lcsResult.length}</span>
            <span className="text-xs text-on-surface-variant ml-2">identical chars (LCS)</span>
          </div>
          <span className="text-[11px] text-emerald-800 font-mono mt-3 truncate">
            &quot;{lcsResult.lcs.slice(0, 24)}...&quot;
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] text-outline uppercase font-semibold">Changed Elements</span>
          <div className="mt-2 flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-700 font-bold">+{operationsCount.ins} ins</span>
            <span className="text-rose-700 font-bold">-{operationsCount.del} del</span>
            <span className="text-amber-700 font-bold">~{operationsCount.rep} rep</span>
          </div>
          <span className="text-[11px] text-outline mt-3">{operationsCount.match} matching tokens</span>
        </div>
      </div>

      {/* Visual Alignment Output Card */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
          <span className="font-bold text-on-surface">Sequence Alignment & Transformation Trace</span>
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
          >
            <Code size={14} />
            {showTechnicalDetails ? 'Hide DP Matrix & Traceback' : 'Show DP Matrix & Traceback'}
            {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 font-mono text-xs">
          {(method === 'needleman-wunsch' || method === 'smith-waterman') ? (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg flex flex-col gap-2 overflow-x-auto leading-relaxed">
              <div className="flex gap-2">
                <span className="text-gray-400 w-16">Seq A:</span>
                <span className="tracking-widest font-bold text-cyan-300">{alignmentResult.alignedA}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-16">Match:</span>
                <span className="tracking-widest text-emerald-400">
                  {alignmentResult.alignedA.split('').map((char, i) => (
                    char === alignmentResult.alignedB[i] ? '|' : char === '-' || alignmentResult.alignedB[i] === '-' ? ' ' : '.'
                  )).join('')}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-16">Seq B:</span>
                <span className="tracking-widest font-bold text-amber-300">{alignmentResult.alignedB}</span>
              </div>
              <div className="mt-2 text-[11px] text-gray-400 border-t border-gray-800 pt-2 flex justify-between">
                <span>Alignment Score: {alignmentResult.score}</span>
                <span>Paradigm: {alignmentResult.algorithm}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="font-bold text-on-surface text-xs font-sans">
                Ordered Mutation Pipeline ({editResult.operations.length} steps):
              </span>
              <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                {editResult.operations.slice(0, 30).map((op, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="text-outline font-mono w-6">{i + 1}.</span>
                    <span className={`px-2 py-0.5 rounded font-mono ${
                      op.startsWith('Match') ? 'bg-emerald-100 text-emerald-900' :
                      op.startsWith('Insert') ? 'bg-blue-100 text-blue-900' :
                      op.startsWith('Delete') ? 'bg-rose-100 text-rose-900' :
                      'bg-amber-100 text-amber-900'
                    }`}>
                      {op}
                    </span>
                  </div>
                ))}
                {editResult.operations.length > 30 && (
                  <span className="text-outline text-xs mt-1">
                    ...and {editResult.operations.length - 30} additional mutation steps.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Technical Details Panel (DP Matrix & Traceback Grid) */}
      {showTechnicalDetails && (
        <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4 text-xs font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <span className="font-bold text-on-surface flex items-center gap-2 text-sm">
              <Info size={16} className="text-primary" />
              Dynamic Programming Recurrence & State Matrix
            </span>
            <span className="font-mono text-[11px] text-outline">
              Complexity: O(M * N) Time · O(M * N) Space
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
              <span className="text-[11px] text-outline uppercase font-semibold">Active Recurrence</span>
              <p className="font-mono text-[11px] font-bold text-primary mt-1">
                {method === 'wagner-fischer' ? 'D[i,j] = min(D[i-1,j]+1, D[i,j-1]+1, D[i-1,j-1]+cost)' :
                 method === 'needleman-wunsch' ? 'F[i,j] = max(F[i-1,j-1]+S, F[i-1,j]+d, F[i,j-1]+d)' :
                 method === 'smith-waterman' ? 'H[i,j] = max(0, H[i-1,j-1]+S, H[i-1,j]+d, H[i,j-1]+d)' :
                 'L[i,j] = a[i]==b[j] ? L[i-1,j-1]+1 : max(L[i-1,j], L[i,j-1])'}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
              <span className="text-[11px] text-outline uppercase font-semibold">Traceback Path Depth</span>
              <p className="font-bold font-mono text-on-surface mt-1">
                {(method === 'wagner-fischer' ? editResult.tracebackPath.length :
                  method === 'lcs' ? lcsResult.tracebackPath.length :
                  alignmentResult.tracebackPath.length)} steps
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
              <span className="text-[11px] text-outline uppercase font-semibold">Optimal Evaluation Score</span>
              <p className="font-bold font-mono text-emerald-700 mt-1">
                {method === 'wagner-fischer' ? `Dist = ${editResult.distance}` :
                 method === 'lcs' ? `Len = ${lcsResult.length}` :
                 `Score = ${alignmentResult.score}`}
              </p>
            </div>
          </div>

          {/* Interactive DP Table Slice */}
          <div className="bg-white p-4 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
            <span className="font-bold text-on-surface text-xs">
              DP State Matrix (First 15x15 Cells with Traceback Highlight):
            </span>
            <div className="overflow-x-auto max-h-72">
              <table className="border-collapse font-mono text-[10px]">
                <tbody>
                  {/* Header Row */}
                  <tr>
                    <td className="p-1 border border-outline-variant/30 bg-surface-container font-bold text-center"></td>
                    <td className="p-1 border border-outline-variant/30 bg-surface-container font-bold text-center">ε</td>
                    {textB.slice(0, 14).split('').map((char, j) => (
                      <td key={j} className="p-1 border border-outline-variant/30 bg-surface-container font-bold text-center min-w-6">
                        {char}
                      </td>
                    ))}
                  </tr>
                  {/* Matrix Rows */}
                  {Array.from({ length: Math.min(15, textA.length + 1) }).map((_, i) => (
                    <tr key={i}>
                      <td className="p-1 border border-outline-variant/30 bg-surface-container font-bold text-center min-w-6">
                        {i === 0 ? 'ε' : textA[i - 1]}
                      </td>
                      {Array.from({ length: Math.min(15, textB.length + 1) }).map((_, j) => {
                        const cellVal = method === 'wagner-fischer' ? editResult.matrix[i]?.[j] :
                                        method === 'lcs' ? lcsResult.matrix[i]?.[j] :
                                        alignmentResult.matrix[i]?.[j];

                        const isTrace = (method === 'wagner-fischer' ? editResult.tracebackPath :
                                         method === 'lcs' ? lcsResult.tracebackPath :
                                         alignmentResult.tracebackPath).some(cell => cell.row === i && cell.col === j);

                        return (
                          <td
                            key={j}
                            className={`p-1 border border-outline-variant/20 text-center font-bold min-w-6 transition-colors ${
                              isTrace ? 'bg-amber-200 text-amber-950 font-extrabold' : 'text-on-surface'
                            }`}
                          >
                            {cellVal ?? 0}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <span className="text-[11px] text-outline mt-1">
              Highlighted cells indicate the optimal reverse path reconstructed during traceback.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
