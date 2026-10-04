import type { FlowNode, ResidualEdge } from '../engine/flow';

interface ResidualGraphViewProps {
  nodes: FlowNode[];
  residualEdges: ResidualEdge[];
  reachableFromSource?: string[];
}

export default function ResidualGraphView({
  nodes,
  residualEdges,
  reachableFromSource = [],
}: ResidualGraphViewProps) {
  const nodeMap = new Map<string, FlowNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Filter to positive residual capacity edges and group
  const usableEdges = residualEdges.filter(e => e.residualCapacity > 0);
  const saturatedEdges = residualEdges.filter(e => e.residualCapacity === 0 && !e.isReverse);

  return (
    <div className="flex flex-col gap-4 bg-slate-900/90 rounded-xl p-4 border border-outline-variant/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Residual Network G<sub>f</sub> (Capacity Available)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Forward edges: c<sub>f</sub>(u, v) = c(u, v) - f(u, v) • Backward edges: c<sub>f</sub>(v, u) = f(u, v)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            Forward ({usableEdges.filter(e => !e.isReverse).length})
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            Backward ({usableEdges.filter(e => e.isReverse).length})
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Saturated ({saturatedEdges.length})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
        {usableEdges.map((re, idx) => {
          const fromNode = nodeMap.get(re.from);
          const toNode = nodeMap.get(re.to);
          const isForward = !re.isReverse;
          const isFromReachable = reachableFromSource.includes(re.from);

          return (
            <div
              key={`${re.originalEdgeId}-${re.from}-${re.to}-${idx}`}
              className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono ${
                isForward
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                  : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                  isForward ? 'bg-emerald-900/80 text-emerald-300' : 'bg-cyan-900/80 text-cyan-300'
                }`}>
                  {isForward ? 'FWD' : 'REV'}
                </span>
                <span className="font-semibold text-slate-100 flex items-center gap-1">
                  {fromNode?.label || re.from} → {toNode?.label || re.to}
                  {isFromReachable && (
                    <span className="text-[9px] px-1 rounded bg-emerald-900 text-emerald-300 font-bold" title="Node is reachable from source in Gf">
                      S
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white">
                  c<sub>f</sub> = {re.residualCapacity}
                </span>
              </div>
            </div>
          );
        })}

        {usableEdges.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-slate-400 bg-slate-950/50 rounded-lg border border-slate-800">
            No usable residual edges remain. The residual network is disconnected from source to sink. Maximum flow reached!
          </div>
        )}
      </div>

      {saturatedEdges.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">
            Fully Saturated Edges (c<sub>f</sub> = 0):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {saturatedEdges.map((se) => (
              <span
                key={se.originalEdgeId}
                className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[11px] font-mono border border-slate-800"
              >
                {nodeMap.get(se.from)?.label || se.from} → {nodeMap.get(se.to)?.label || se.to} (cap: {se.capacity})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
