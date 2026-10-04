import { useMemo, useState } from 'react';
import { Trash2, CheckCircle2, AlertCircle, GitMerge, ArrowRight } from 'lucide-react';
import { solveBipartiteMatching } from '../engine/flow';

const PRESET_MATCHINGS = [
  {
    name: 'Document Compliance Review Allocation',
    left: ['Analyst A', 'Analyst B', 'Analyst C', 'Analyst D'],
    right: ['Doc 1: Audit Log', 'Doc 2: Financials', 'Doc 3: Manifest', 'Doc 4: Tax Vault'],
    candidates: [
      ['Analyst A', 'Doc 1: Audit Log'],
      ['Analyst A', 'Doc 2: Financials'],
      ['Analyst B', 'Doc 2: Financials'],
      ['Analyst B', 'Doc 3: Manifest'],
      ['Analyst C', 'Doc 1: Audit Log'],
      ['Analyst C', 'Doc 4: Tax Vault'],
      ['Analyst D', 'Doc 3: Manifest'],
      ['Analyst D', 'Doc 4: Tax Vault'],
    ] as [string, string][],
  },
  {
    name: 'Security Vulnerability Audits',
    left: ['Auditor Alpha', 'Auditor Beta', 'Auditor Gamma'],
    right: ['CVE Triage', 'Log Audit', 'SOC2 Review'],
    candidates: [
      ['Auditor Alpha', 'CVE Triage'],
      ['Auditor Alpha', 'Log Audit'],
      ['Auditor Beta', 'Log Audit'],
      ['Auditor Gamma', 'SOC2 Review'],
      ['Auditor Gamma', 'CVE Triage'],
    ] as [string, string][],
  },
];

export default function BipartiteMatchingTab() {
  const [leftNodes, setLeftNodes] = useState<string[]>(PRESET_MATCHINGS[0].left);
  const [rightNodes, setRightNodes] = useState<string[]>(PRESET_MATCHINGS[0].right);
  const [candidates, setCandidates] = useState<[string, string][]>(PRESET_MATCHINGS[0].candidates);

  const [newLeft, setNewLeft] = useState('');
  const [newRight, setNewRight] = useState('');
  const [selectedLeft, setSelectedLeft] = useState(leftNodes[0] || '');
  const [selectedRight, setSelectedRight] = useState(rightNodes[0] || '');

  // Solve matching
  const result = useMemo(() => {
    return solveBipartiteMatching(leftNodes, rightNodes, candidates);
  }, [leftNodes, rightNodes, candidates]);

  const handleAddLeft = () => {
    const name = newLeft.trim();
    if (!name || leftNodes.includes(name)) return;
    setLeftNodes([...leftNodes, name]);
    setNewLeft('');
  };

  const handleRemoveLeft = (name: string) => {
    setLeftNodes(leftNodes.filter(n => n !== name));
    setCandidates(candidates.filter(([l]) => l !== name));
  };

  const handleAddRight = () => {
    const name = newRight.trim();
    if (!name || rightNodes.includes(name)) return;
    setRightNodes([...rightNodes, name]);
    setNewRight('');
  };

  const handleRemoveRight = (name: string) => {
    setRightNodes(rightNodes.filter(n => n !== name));
    setCandidates(candidates.filter(([, r]) => r !== name));
  };

  const handleToggleCandidate = (l: string, r: string) => {
    const exists = candidates.some(([left, right]) => left === l && right === r);
    if (exists) {
      setCandidates(candidates.filter(([left, right]) => !(left === l && right === r)));
    } else {
      setCandidates([...candidates, [l, r]]);
    }
  };

  const handleLoadPreset = (idx: number) => {
    const p = PRESET_MATCHINGS[idx];
    setLeftNodes([...p.left]);
    setRightNodes([...p.right]);
    setCandidates([...p.candidates]);
    setSelectedLeft(p.left[0] || '');
    setSelectedRight(p.right[0] || '');
  };

  const matchedSet = new Set(result.matchedPairs.map(p => `${p.leftId}::${p.rightId}`));

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-secondary font-semibold">
            Task Allocation & Assignment Matching
          </span>
          <h2 className="text-2xl font-bold text-on-surface mt-1">
            Resource-Task Capability Matching
          </h2>
          <p className="text-sm text-on-surface-variant max-w-2xl mt-1">
            Matches candidate analysts or verification services to eligible document tasks by reducing to maximum network flow on unit-capacity constraints.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-3xl font-extrabold text-secondary font-mono">
            {result.matchingSize} / {Math.min(leftNodes.length, rightNodes.length)}
          </div>
          <div className="text-xs uppercase text-outline font-semibold tracking-wider">
            Maximum Matching Size
          </div>
        </div>
      </div>

      {/* Preset bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase font-semibold text-outline">Presets:</span>
        {PRESET_MATCHINGS.map((p, i) => (
          <button
            key={p.name}
            onClick={() => handleLoadPreset(i)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Main Interactive Bipartite Canvas & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-6">
        {/* SVG Bipartite Visualizer */}
        <div className="bg-slate-950 p-6 rounded-xl border border-outline-variant/30 shadow-inner flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="text-emerald-400 font-bold">Left Partition: Students (L)</span>
            <span className="text-purple-400 font-bold">Right Partition: Projects (R)</span>
          </div>

          <svg viewBox="0 0 600 380" className="w-full h-[360px]">
            {/* Candidate Edges */}
            {candidates.map(([l, r]) => {
              const lIdx = leftNodes.indexOf(l);
              const rIdx = rightNodes.indexOf(r);
              if (lIdx === -1 || rIdx === -1) return null;

              const y1 = 40 + lIdx * (300 / Math.max(1, leftNodes.length - 1 || 1));
              const y2 = 40 + rIdx * (300 / Math.max(1, rightNodes.length - 1 || 1));

              const isMatched = matchedSet.has(`${l}::${r}`);

              return (
                <line
                  key={`${l}-${r}`}
                  x1="140"
                  y1={y1}
                  x2="460"
                  y2={y2}
                  stroke={isMatched ? '#10b981' : '#334155'}
                  strokeWidth={isMatched ? 3.5 : 1.5}
                  strokeDasharray={isMatched ? undefined : '4,4'}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Left Nodes */}
            {leftNodes.map((l, i) => {
              const y = 40 + i * (300 / Math.max(1, leftNodes.length - 1 || 1));
              const isMatched = result.matchedPairs.some(p => p.leftId === l);

              return (
                <g key={`L-${l}`} transform={`translate(140, ${y})`} className="cursor-pointer">
                  <circle
                    r="20"
                    fill={isMatched ? '#064e3b' : '#3f1515'}
                    stroke={isMatched ? '#34d399' : '#f87171'}
                    strokeWidth="2.5"
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    className="font-mono text-xs font-bold fill-white pointer-events-none"
                  >
                    {l.length > 5 ? l.slice(0, 4) : l}
                  </text>
                  <text
                    x="-28"
                    y="4"
                    textAnchor="end"
                    className="font-sans text-xs fill-slate-300 font-semibold"
                  >
                    {l}
                  </text>
                </g>
              );
            })}

            {/* Right Nodes */}
            {rightNodes.map((r, i) => {
              const y = 40 + i * (300 / Math.max(1, rightNodes.length - 1 || 1));
              const isMatched = result.matchedPairs.some(p => p.rightId === r);

              return (
                <g key={`R-${r}`} transform={`translate(460, ${y})`} className="cursor-pointer">
                  <circle
                    r="20"
                    fill={isMatched ? '#4c1d95' : '#3f1515'}
                    stroke={isMatched ? '#a855f7' : '#f87171'}
                    strokeWidth="2.5"
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    className="font-mono text-xs font-bold fill-white pointer-events-none"
                  >
                    {r.length > 5 ? r.slice(0, 4) : r}
                  </text>
                  <text
                    x="28"
                    y="4"
                    textAnchor="start"
                    className="font-sans text-xs fill-slate-300 font-semibold"
                  >
                    {r}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Matched Edge
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-0.5 bg-slate-500"></span> Candidate Preference
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unmatched Node
            </span>
          </div>
        </div>

        {/* Matching Analysis and Inspector */}
        <div className="flex flex-col gap-4">
          {/* Matched Pairs Card */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-secondary" />
              Optimal Matched Assignments ({result.matchedPairs.length})
            </h3>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {result.matchedPairs.map(p => (
                <div
                  key={`${p.leftId}-${p.rightId}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs font-mono"
                >
                  <span className="font-bold text-emerald-950">{p.leftId}</span>
                  <ArrowRight size={14} className="text-emerald-600" />
                  <span className="font-bold text-purple-950">{p.rightId}</span>
                </div>
              ))}
              {result.matchedPairs.length === 0 && (
                <div className="text-xs text-on-surface-variant py-4 text-center">
                  No matchings possible with current candidate edges.
                </div>
              )}
            </div>
          </div>

          {/* Unmatched Nodes Warning */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-600" />
              Unmatched Nodes
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="font-semibold text-outline block mb-1">Unmatched Students:</span>
                {result.unmatchedLeft.length > 0 ? (
                  <div className="flex flex-wrap gap-1 font-mono text-rose-700">
                    {result.unmatchedLeft.map(u => (
                      <span key={u} className="px-2 py-0.5 bg-rose-100 rounded">
                        {u}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-700 font-semibold">All students matched!</span>
                )}
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="font-semibold text-outline block mb-1">Unmatched Projects:</span>
                {result.unmatchedRight.length > 0 ? (
                  <div className="flex flex-wrap gap-1 font-mono text-rose-700">
                    {result.unmatchedRight.map(u => (
                      <span key={u} className="px-2 py-0.5 bg-rose-100 rounded">
                        {u}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-700 font-semibold">All projects filled!</span>
                )}
              </div>
            </div>
          </div>

          {/* Flow Reduction Theorem Card */}
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-xs">
            <div className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide mb-1">
              <GitMerge size={14} /> Flow Equivalence Property
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              Super-source s pushes 1 unit of flow into each student. Every preference edge transmits up to 1 unit.
              Every project routes 1 unit to super-sink t. The max flow computed by Edmonds-Karp is exactly{' '}
              <strong className="font-mono text-primary font-bold">{result.maxFlow}</strong>, establishing maximum matching size.
            </p>
          </div>
        </div>
      </div>

      {/* Node and Candidate Preference Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm">
        {/* Left Side Controls */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
            Manage Students (Left)
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Student name"
              value={newLeft}
              onChange={(e) => setNewLeft(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border rounded-lg font-mono"
            />
            <button
              onClick={handleAddLeft}
              className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {leftNodes.map(l => (
              <span
                key={l}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-900 text-xs font-mono font-semibold"
              >
                {l}
                <button
                  onClick={() => handleRemoveLeft(l)}
                  className="text-emerald-700 hover:text-emerald-950"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">
            Manage Projects (Right)
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Project name"
              value={newRight}
              onChange={(e) => setNewRight(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border rounded-lg font-mono"
            />
            <button
              onClick={handleAddRight}
              className="px-3 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-semibold hover:bg-purple-800"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {rightNodes.map(r => (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-900 text-xs font-mono font-semibold"
              >
                {r}
                <button
                  onClick={() => handleRemoveRight(r)}
                  className="text-purple-700 hover:text-purple-950"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Candidate Preference Edge Toggle */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-outline uppercase tracking-wide">
            Toggle Candidate Preference
          </span>
          <div className="flex gap-2">
            <select
              value={selectedLeft}
              onChange={(e) => setSelectedLeft(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border rounded-lg font-mono"
            >
              {leftNodes.map(l => (
                <option key={`sel-l-${l}`} value={l}>{l}</option>
              ))}
            </select>
            <select
              value={selectedRight}
              onChange={(e) => setSelectedRight(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border rounded-lg font-mono"
            >
              {rightNodes.map(r => (
                <option key={`sel-r-${r}`} value={r}>{r}</option>
              ))}
            </select>
            <button
              onClick={() => handleToggleCandidate(selectedLeft, selectedRight)}
              className="px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-secondary/90"
            >
              Toggle
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Candidate edges indicate valid allocations. Click toggle to link or unlink student to project.
          </p>
        </div>
      </div>
    </div>
  );
}
