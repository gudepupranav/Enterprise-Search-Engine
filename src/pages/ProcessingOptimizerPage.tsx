import { useState, useMemo } from 'react';
import { 
  Layers, 
  ArrowRight, 
  Clock, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  Info, 
} from 'lucide-react';
import { tsp, matrixChainOrder, parseTSPCell, type TSPResult, type IntervalDPResult } from '../engine/dp';

type OptimizerTab = 'sequence' | 'segment';

export default function ProcessingOptimizerPage() {
  const [activeTab, setActiveTab] = useState<OptimizerTab>('sequence');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // --- TAB 1: Batch Processing Sequence Optimizer (Bitmask TSP) ---
  const [selectedTaskCount, setSelectedTaskCount] = useState<number>(4);
  const taskNames = useMemo(() => [
    'Document Ingestion & Parsing',
    'Token Stream & Normalization',
    'Financial Table Extraction',
    'Compliance Vault Verification',
    'Audit Log Indexing',
    'Manifest Routing Validation'
  ].slice(0, selectedTaskCount), [selectedTaskCount]);

  // Initial cost matrix representing context-switching latency (ms) between tasks
  const [costMatrix, setCostMatrix] = useState<number[][]>([
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
  ]);

  // Update cost matrix dimensions when task count changes
  const handleTaskCountChange = (count: number) => {
    setSelectedTaskCount(count);
    const newMatrix: number[][] = Array.from({ length: count }, (_, i) =>
      Array.from({ length: count }, (_, j) => {
        if (i === j) return 0;
        if (i < costMatrix.length && j < costMatrix[i].length) {
          return costMatrix[i][j];
        }
        return Math.floor(Math.abs(i - j) * 8 + 12);
      })
    );
    setCostMatrix(newMatrix);
  };

  const updateMatrixCell = (i: number, j: number, val: string) => {
    const numeric = parseTSPCell(val, i === j);
    setCostMatrix(prev => {
      const copy = prev.map(row => [...row]);
      copy[i][j] = numeric;
      return copy;
    });
  };

  const tspResult: TSPResult = useMemo(() => {
    return tsp(costMatrix);
  }, [costMatrix]);

  // Sequential baseline cost for comparison
  const sequentialCost = useMemo(() => {
    let cost = 0;
    for (let i = 0; i < selectedTaskCount; i++) {
      const next = (i + 1) % selectedTaskCount;
      cost += costMatrix[i][next];
    }
    return cost;
  }, [costMatrix, selectedTaskCount]);

  const latencySaved = sequentialCost > tspResult.minCost ? sequentialCost - tspResult.minCost : 0;

  // --- TAB 2: Content Segment Partition Optimizer (Interval DP) ---
  const [sectionDimensions] = useState<number[]>([15, 30, 10, 50, 25]);
  const sectionLabels = ['Executive Summary', 'Financial Tables', 'Risk Disclosures', 'Auditor Notes'];

  const intervalResult: IntervalDPResult = useMemo(() => {
    return matrixChainOrder(sectionDimensions);
  }, [sectionDimensions]);

  // Unoptimized sequential left-to-right operations cost
  const sequentialIntervalCost = useMemo(() => {
    if (sectionDimensions.length < 3) return 0;
    let cost = 0;
    let currentRows = sectionDimensions[0];
    for (let i = 1; i < sectionDimensions.length - 1; i++) {
      cost += currentRows * sectionDimensions[i] * sectionDimensions[i + 1];
    }
    return cost;
  }, [sectionDimensions]);

  const operationsSaved = sequentialIntervalCost > intervalResult.optimalCost
    ? sequentialIntervalCost - intervalResult.optimalCost
    : 0;

  return (
    <div className="py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Processing Optimizer</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Optimize execution sequences and hierarchical document partition schemes with mathematical optimality guarantees.
          </p>
        </div>
        <div className="flex rounded-lg border border-outline-variant bg-surface p-1 gap-1">
          <button
            onClick={() => { setActiveTab('sequence'); setShowTechnicalDetails(false); }}
            className={`py-1.5 px-4 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'sequence' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Clock size={14} /> Batch Processing Sequence
          </button>
          <button
            onClick={() => { setActiveTab('segment'); setShowTechnicalDetails(false); }}
            className={`py-1.5 px-4 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'segment' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers size={14} /> Content Segment Hierarchy
          </button>
        </div>
      </div>

      {activeTab === 'sequence' ? (
        /* --- TAB 1: SEQUENCE OPTIMIZER --- */
        <div className="flex flex-col gap-6">
          {/* Controls & Configuration */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-bold text-sm text-on-surface">Batch Processing Sequence Configuration</span>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Calculate the optimal task dispatch sequence to minimize CPU context-switch latency and memory reload overhead.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant font-medium">Batch Size:</span>
                {[3, 4, 5, 6].map(count => (
                  <button
                    key={count}
                    onClick={() => handleTaskCountChange(count)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                      selectedTaskCount === count
                        ? 'bg-primary text-white'
                        : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Transition Latency Cost Matrix Grid */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-on-surface-variant">
                Context-Switch Latency Matrix (ms between tasks):
              </span>
              <div className="overflow-x-auto">
                <table className="border-collapse font-mono text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 border border-outline-variant/30 bg-surface-container-low text-left text-[11px] text-outline">
                        From \ To
                      </th>
                      {taskNames.map((_, j) => (
                        <th key={j} className="p-2 border border-outline-variant/30 bg-surface-container-low text-center text-[11px] text-primary">
                          T{j}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {costMatrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2 border border-outline-variant/30 bg-surface-container-low font-bold text-primary text-[11px]">
                          T{i} ({taskNames[i]?.slice(0, 18)}...)
                        </td>
                        {row.map((cost, j) => (
                          <td key={j} className="p-1 border border-outline-variant/20 text-center">
                            {i === j ? (
                              <span className="text-outline font-bold">0</span>
                            ) : (
                              <input
                                type="text"
                                value={Number.isFinite(cost) ? cost : '∞'}
                                onChange={e => updateMatrixCell(i, j, e.target.value)}
                                className="w-12 text-center p-1 rounded bg-surface border border-outline-variant/40 text-on-surface font-bold text-xs focus:border-primary outline-none"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* KPI Output Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Optimal Sequence Latency</span>
              <div className="mt-2 flex items-baseline gap-2">
                {tspResult.minCost === Infinity ? (
                  <span className="text-xl font-bold text-amber-700 font-mono">Unreachable</span>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-primary font-mono">{tspResult.minCost} ms</span>
                    <span className="text-xs text-emerald-700 font-semibold">global minimum</span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-on-surface-variant mt-2">
                {tspResult.minCost === Infinity ? 'Graph has disconnected components' : 'Zero suboptimal traversals'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Latency Saved vs Sequential</span>
              <div className="mt-2 flex items-baseline gap-2">
                {tspResult.minCost === Infinity ? (
                  <span className="text-xl font-bold text-outline font-mono">N/A</span>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-emerald-700 font-mono">-{latencySaved} ms</span>
                    <span className="text-xs text-on-surface-variant">saved</span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-outline mt-2">Baseline sequential: {sequentialCost === Infinity ? 'Unreachable' : `${sequentialCost} ms`}</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Search Space Traversed</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-on-surface font-mono">
                  {tspResult.reachableStates.length}
                </span>
                <span className="text-xs text-on-surface-variant">bitmask states</span>
              </div>
              <span className="text-[11px] text-outline mt-2">O(N · 2^N) state combinations</span>
            </div>
          </div>

          {/* Optimal Route Visualizer */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-sm text-on-surface">Calculated Optimal Processing Sequence</span>
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
              >
                <Code size={14} />
                {showTechnicalDetails ? 'Hide Bitmask DP States' : 'Show Bitmask DP States'}
                {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {tspResult.path.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>No Hamiltonian Tour Available:</strong> The current context-switch matrix has infinite latency transitions between tasks. Provide valid non-zero connections between processing tasks to allow a full cyclical execution order.
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-outline-variant/30 flex flex-wrap items-center gap-2">
                {tspResult.path.map((taskIdx, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-outline-variant/40 shadow-xs">
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center font-mono">
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-on-surface">
                        T{taskIdx}: {taskNames[taskIdx]}
                      </span>
                    </div>
                    {i < tspResult.path.length - 1 && (
                      <ArrowRight size={15} className="text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expandable Technical Details (Bitmask DP State Table) */}
          {showTechnicalDetails && (
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4 text-xs font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <span className="font-bold text-on-surface flex items-center gap-2 text-sm">
                  <Info size={16} className="text-primary" />
                  Bitmask Dynamic Programming State Space (Bellman-Held-Karp)
                </span>
                <span className="font-mono text-[11px] text-outline">
                  dp[mask][i] = min_j(dp[mask \ i][j] + cost[j][i])
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
                  <span className="font-bold text-on-surface text-xs">
                    Reachable DP States ({tspResult.reachableStates.length} states evaluated):
                  </span>
                  <div className="max-h-48 overflow-y-auto flex flex-col gap-1 font-mono text-[11px]">
                    {tspResult.reachableStates.slice(0, 20).map((st, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-outline-variant/10">
                        <span className="text-primary">
                          Mask: {st.mask.toString(2).padStart(selectedTaskCount, '0')}_2 @ Task {st.city}
                        </span>
                        <span className="font-bold text-on-surface">{st.cost} ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
                  <span className="font-bold text-on-surface text-xs">Mathematical Complexity:</span>
                  <p className="text-on-surface-variant text-xs leading-relaxed">
                    The brute-force permutation search requires evaluating <strong>O((N-1)!)</strong> schedules ({selectedTaskCount === 6 ? '120' : '6'} paths). 
                    By applying Bitmask Dynamic Programming, memoization compresses the execution space to <strong>O(N² · 2^N)</strong> operations, guaranteeing exact global optimality without heuristic approximations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- TAB 2: CONTENT SEGMENT PARTITION OPTIMIZER (Interval DP) --- */
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
            <div>
              <span className="font-bold text-sm text-on-surface">Content Segment Hierarchy Optimizer</span>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Calculate the optimal binary merge hierarchy for multi-section documents to minimize intermediate index synthesis and memory allocation costs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sectionLabels.map((lbl, idx) => (
                <div key={idx} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                  <span className="text-[11px] uppercase font-semibold text-outline">Section {idx + 1}</span>
                  <span className="text-xs font-bold text-on-surface">{lbl}</span>
                  <span className="text-[11px] font-mono text-primary mt-1">
                    Dimensions: {sectionDimensions[idx]} × {sectionDimensions[idx + 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Segment KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Optimal Merge Operations</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-primary font-mono">
                  {intervalResult.optimalCost.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-700 font-semibold">scalar ops</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-2">Optimal tree partitioning</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Operations Saved</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                  {operationsSaved.toLocaleString()}
                </span>
                <span className="text-xs text-on-surface-variant">saved</span>
              </div>
              <span className="text-[11px] text-outline mt-2">
                Sequential baseline: {sequentialIntervalCost.toLocaleString()} ops
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Algorithm Efficiency</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                  {sequentialIntervalCost > 0 ? ((operationsSaved / sequentialIntervalCost) * 100).toFixed(1) : 0}%
                </span>
                <span className="text-xs text-on-surface-variant">reduction</span>
              </div>
              <span className="text-[11px] text-outline mt-2">Interval recurrence minimization</span>
            </div>
          </div>

          {/* Merge Tree & Traceback */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-sm text-on-surface">Optimal Section Partition & Parenthesization Hierarchy</span>
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
              >
                <Code size={14} />
                {showTechnicalDetails ? 'Hide Interval DP Matrix' : 'Show Interval DP Matrix'}
                {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-outline-variant/30 flex flex-col gap-2 font-mono text-xs">
              <span className="font-bold text-primary text-sm">
                Optimal Merge Order: {intervalResult.traceback.join(' → ')}
              </span>
              <p className="text-[11px] text-on-surface-variant font-sans mt-1">
                Sections with heavy intermediate token volumes are deferred until adjacent smaller sub-trees are synthesized.
              </p>
            </div>
          </div>

          {/* Expandable Technical Details (Interval DP Table) */}
          {showTechnicalDetails && (
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4 text-xs font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <span className="font-bold text-on-surface flex items-center gap-2 text-sm">
                  <Info size={16} className="text-primary" />
                  Interval Dynamic Programming Matrix (O(N³) Multi-Stage Sub-problem Grid)
                </span>
                <span className="font-mono text-[11px] text-outline">{intervalResult.recurrence}</span>
              </div>

              <div className="bg-white p-4 rounded-lg border border-outline-variant/30 overflow-x-auto">
                <table className="border-collapse font-mono text-xs w-full">
                  <thead>
                    <tr>
                      <th className="p-2 border border-outline-variant/30 bg-surface-container text-left">i \ j</th>
                      {sectionLabels.map((_, j) => (
                        <th key={j} className="p-2 border border-outline-variant/30 bg-surface-container text-center">
                          Sec {j + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intervalResult.values.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2 border border-outline-variant/30 bg-surface-container font-bold text-primary">
                          Sec {i + 1}
                        </td>
                        {row.map((val, j) => (
                          <td key={j} className="p-2 border border-outline-variant/20 text-center">
                            {i > j ? (
                              <span className="text-outline">-</span>
                            ) : i === j ? (
                              <span className="text-outline">0</span>
                            ) : (
                              <span className="font-bold text-on-surface">
                                {Number.isFinite(val) ? val.toLocaleString() : '∞'}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
