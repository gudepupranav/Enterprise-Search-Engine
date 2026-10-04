import { useMemo, useState } from 'react';
import { Coins, CheckCircle, Shuffle, ArrowRight } from 'lucide-react';
import { solveAssignmentProblem } from '../engine/flow';

const PRESETS = [
  {
    name: '4x4 Document Review Allocation',
    workers: ['Analyst Alpha', 'Analyst Beta', 'Analyst Gamma', 'Analyst Delta'],
    tasks: ['SEC 10-Q Review', 'Cloud Audit Log', 'Supply Chain CSV', 'Tax Compliance'],
    matrix: [
      [9, 2, 7, 8],
      [6, 4, 3, 7],
      [5, 8, 1, 8],
      [7, 6, 9, 4],
    ],
  },
  {
    name: '3x3 Verification Pipeline',
    workers: ['Inspector 1', 'Inspector 2', 'Inspector 3'],
    tasks: ['Data Validation', 'Sanitization', 'Compliance Proof'],
    matrix: [
      [15, 10, 9],
      [9, 15, 8],
      [10, 12, 11],
    ],
  },
  {
    name: '5x5 Data Pipeline Roles',
    workers: ['Node 1', 'Node 2', 'Node 3', 'Node 4', 'Node 5'],
    tasks: ['Extract', 'Cleanse', 'Enrich', 'Model', 'Index'],
    matrix: [
      [12, 8, 14, 20, 18],
      [10, 15, 9, 12, 14],
      [14, 11, 10, 16, 12],
      [8, 12, 15, 9, 11],
      [13, 10, 12, 11, 8],
    ],
  },
];

export default function AssignmentProblemTab() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [workers, setWorkers] = useState<string[]>(PRESETS[0].workers);
  const [tasks, setTasks] = useState<string[]>(PRESETS[0].tasks);
  const [matrix, setMatrix] = useState<number[][]>(PRESETS[0].matrix);

  const result = useMemo(() => {
    return solveAssignmentProblem(matrix, workers, tasks);
  }, [matrix, workers, tasks]);

  const handleCellChange = (r: number, c: number, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updated = matrix.map((row, rowIdx) =>
      row.map((cell, colIdx) => (rowIdx === r && colIdx === c ? num : cell))
    );
    setMatrix(updated);
  };

  const handleLoadPreset = (idx: number) => {
    setPresetIndex(idx);
    const p = PRESETS[idx];
    setWorkers([...p.workers]);
    setTasks([...p.tasks]);
    setMatrix(p.matrix.map(row => [...row]));
  };

  const handleRandomizeCosts = () => {
    const updated = matrix.map(row => row.map(() => Math.floor(Math.random() * 20) + 1));
    setMatrix(updated);
  };

  // Set of selected cells for quick lookup
  const selectedCells = new Set(
    result.assignments.map(a => `${a.workerIdx}-${a.taskIdx}`)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-tertiary font-semibold">
            Task Assignment & Resource Optimization
          </span>
          <h2 className="text-2xl font-bold text-on-surface mt-1">
            Optimal Resource-to-Task Allocation
          </h2>
          <p className="text-sm text-on-surface-variant max-w-2xl mt-1">
            Determines the minimum-latency assignment mapping each processing resource to a distinct document analysis task.
            Solves the linear assignment problem via Hungarian primal-dual potential adjustments.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-3xl font-extrabold text-tertiary font-mono">
            {result.totalCost}
          </div>
          <div className="text-xs uppercase text-outline font-semibold tracking-wider">
            Total Minimum Cost
          </div>
        </div>
      </div>

      {/* Preset & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-outline">Presets:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={p.name}
              onClick={() => handleLoadPreset(idx)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                presetIndex === idx
                  ? 'border-tertiary bg-tertiary/10 text-tertiary'
                  : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button
          onClick={handleRandomizeCosts}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
        >
          <Shuffle size={14} />
          Randomize Matrix Costs
        </button>
      </div>

      {/* Main Grid & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6">
        {/* Interactive Cost Matrix Table */}
        <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide">
              Editable Cost Matrix (Workers × Tasks)
            </h3>
            <span className="text-[11px] text-on-surface-variant font-mono">
              Highlighted cells indicate optimal assignment
            </span>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2.5 text-left text-xs uppercase font-mono text-outline border-b border-outline-variant/30 bg-surface-container-low">
                  Workers \ Tasks
                </th>
                {tasks.map((t) => (
                  <th
                    key={t}
                    className="p-2.5 text-center text-xs uppercase font-mono text-on-surface border-b border-outline-variant/30 bg-surface-container-low"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, r) => (
                <tr key={workers[r] || `w-${r}`}>
                  <td className="p-2.5 text-xs font-bold font-mono text-on-surface border-b border-outline-variant/20 bg-surface-container-lowest">
                    {workers[r] || `Worker ${r + 1}`}
                  </td>
                  {row.map((cost, c) => {
                    const isSelected = selectedCells.has(`${r}-${c}`);
                    return (
                      <td
                        key={`${r}-${c}`}
                        className={`p-2 text-center border-b border-outline-variant/20 transition-colors ${
                          isSelected
                            ? 'bg-purple-100/90 font-bold'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={cost}
                          onChange={(e) => handleCellChange(r, c, e.target.value)}
                          className={`w-14 text-center py-1 rounded text-xs font-mono border transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-sm'
                              : 'border-outline-variant/40 bg-white text-on-surface'
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5 text-purple-800 font-semibold">
              <span className="w-3 h-3 rounded bg-purple-600"></span> Optimal Selected Assignment
            </span>
            <span>Click any cost cell to recompute live</span>
          </div>
        </div>

        {/* Selected Assignments & Min-Cost Breakdown */}
        <div className="flex flex-col gap-4">
          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-tertiary" />
              Optimal Assignment Mapping
            </h3>
            <div className="flex flex-col gap-2">
              {result.assignments.map(a => (
                <div
                  key={`${a.worker}-${a.task}`}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">{a.worker}</span>
                    <ArrowRight size={13} className="text-outline" />
                    <span className="font-bold text-tertiary">{a.task}</span>
                  </div>
                  <span className="font-bold px-2 py-0.5 rounded bg-white border border-outline-variant/40">
                    Cost: {a.cost}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs font-mono">
              <span className="uppercase text-outline font-semibold">Total Cumulative Cost:</span>
              <span className="text-base font-extrabold text-tertiary font-mono">
                {result.assignments.map(a => a.cost).join(' + ')} = {result.totalCost}
              </span>
            </div>
          </div>

          {/* Min-Cost Flow Theory Card */}
          <div className="bg-tertiary/5 p-4 rounded-xl border border-tertiary/20 text-xs">
            <div className="font-bold text-tertiary flex items-center gap-1.5 uppercase tracking-wide mb-1.5">
              <Coins size={14} /> Min-Cost Maximum Flow Connection
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              The Assignment Problem is a canonical case of Min-Cost Max-Flow. A source node connects to all workers
              with capacity 1 and cost 0. Each worker connects to tasks with capacity 1 and cost c(i, j). Each task
              connects to the sink with capacity 1 and cost 0. Successive shortest path augmentations with reduced costs
              guarantee an optimal global assignment in polynomial time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
