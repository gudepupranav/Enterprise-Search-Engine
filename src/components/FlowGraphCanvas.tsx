import { useRef, useState } from 'react';
import type { FlowEdge, FlowNode, FlowStep } from '../engine/flow';

interface FlowGraphCanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  source: string;
  sink: string;
  currentStep?: FlowStep | null;
  showResidual: boolean;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

export default function FlowGraphCanvas({
  nodes,
  edges,
  source,
  sink,
  currentStep,
  showResidual,
  onUpdateNodePosition,
  onSelectNode,
  selectedNodeId,
}: FlowGraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Map nodes for fast lookup
  const nodeMap = new Map<string, FlowNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Determine path edges in current step
  const activePathEdgeIds = new Set<string>();
  const activePathEdges = currentStep?.path || [];
  for (const p of activePathEdges) {
    activePathEdgeIds.add(p.originalEdgeId);
  }

  // Determine cut edges in current step
  const cutEdgeIds = new Set<string>();
  if (currentStep?.phase === 'final_cut' && currentStep.cutEdges) {
    for (const ce of currentStep.cutEdges) {
      cutEdgeIds.add(ce.id);
    }
  }

  // Drag handlers
  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    onSelectNode?.(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left));
    const y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top));
    
    // Scale coordinates if viewBox differs from client rect
    const scaleX = 760 / rect.width;
    const scaleY = 440 / rect.height;
    onUpdateNodePosition(draggingNodeId, Math.round(x * scaleX), Math.round(y * scaleY));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-outline-variant/30 shadow-inner select-none">
      {/* Legend / Overlay bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 text-xs font-mono pointer-events-none">
        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded backdrop-blur-sm">
          Source (s): {source}
        </span>
        <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded backdrop-blur-sm">
          Sink (t): {sink}
        </span>
        {currentStep?.phase === 'final_cut' && (
          <span className="bg-rose-950/90 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded animate-pulse">
            Cut Capacity: {currentStep.cutCapacity} = Max Flow {currentStep.currentFlow}
          </span>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 760 440"
        className="w-full h-[440px] cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => onSelectNode?.('')}
      >
        <defs>
          {/* Arrow markers */}
          <marker id="arrow-default" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#eab308" />
          </marker>
          <marker id="arrow-saturated" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>
          <marker id="arrow-cut" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>
          <marker id="arrow-reverse" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
          </marker>

          {/* Glow filter */}
          <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid Pattern */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* EDGES */}
        {edges.map((edge) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          const isPath = activePathEdgeIds.has(edge.id);
          const isCut = cutEdgeIds.has(edge.id);
          const isSaturated = edge.flow === edge.capacity && edge.capacity > 0;
          const hasFlow = edge.flow > 0;

          // Check if reverse edge exists between same pair to curve slightly
          const hasOpposite = edges.some(e => e.from === edge.to && e.to === edge.from);
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const dist = Math.hypot(dx, dy) || 1;
          const normX = -dy / dist;
          const normY = dx / dist;

          const curveOffset = hasOpposite ? 18 : 0;
          const midX = (fromNode.x + toNode.x) / 2 + normX * curveOffset;
          const midY = (fromNode.y + toNode.y) / 2 + normY * curveOffset;

          const pathD = hasOpposite
            ? `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`
            : `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;

          let strokeColor = '#475569';
          let markerUrl = 'url(#arrow-default)';
          let strokeWidth = 2;

          if (isCut) {
            strokeColor = '#f43f5e';
            markerUrl = 'url(#arrow-cut)';
            strokeWidth = 3.5;
          } else if (isPath) {
            strokeColor = '#eab308';
            markerUrl = 'url(#arrow-active)';
            strokeWidth = 3.5;
          } else if (isSaturated) {
            strokeColor = '#10b981';
            markerUrl = 'url(#arrow-saturated)';
            strokeWidth = 2.5;
          } else if (hasFlow) {
            strokeColor = '#3b82f6';
            strokeWidth = 2.5;
          }

          return (
            <g key={edge.id} className="transition-all duration-300">
              {/* Edge path */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isCut ? '6,3' : undefined}
                markerEnd={markerUrl}
                filter={isPath ? 'url(#glow-gold)' : undefined}
              />

              {/* Edge Badge: Flow / Capacity */}
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x="-28"
                  y="-12"
                  width="56"
                  height="24"
                  rx="6"
                  className={`${
                    isCut
                      ? 'fill-rose-950 stroke-rose-500'
                      : isPath
                      ? 'fill-amber-950 stroke-amber-400'
                      : isSaturated
                      ? 'fill-emerald-950 stroke-emerald-500'
                      : hasFlow
                      ? 'fill-blue-950 stroke-blue-500'
                      : 'fill-slate-900 stroke-slate-700'
                  } stroke`}
                  strokeWidth="1.5"
                />
                <text
                  textAnchor="middle"
                  dy="4"
                  className="font-mono text-[11px] font-bold fill-slate-100"
                >
                  {edge.flow} / {edge.capacity}
                </text>
              </g>

              {/* If Residual toggle is ON, show residual capacity preview */}
              {showResidual && (
                <g transform={`translate(${midX}, ${midY + 16})`}>
                  <rect
                    x="-24"
                    y="-9"
                    width="48"
                    height="18"
                    rx="4"
                    className="fill-cyan-950/90 stroke-cyan-500/60"
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    dy="3"
                    className="font-mono text-[9px] fill-cyan-300 font-semibold"
                  >
                    cf:{Math.max(0, edge.capacity - edge.flow)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* NODES */}
        {nodes.map((node) => {
          const isSource = node.id === source;
          const isSink = node.id === sink;
          const isSelected = selectedNodeId === node.id;
          const isDragging = draggingNodeId === node.id;

          // Reachability in min-cut
          const inSourceCut = currentStep?.reachableFromSource?.includes(node.id);
          const isCutActive = currentStep?.phase === 'final_cut';

          // BFS level if available
          const bfsLevel = currentStep?.bfsLevels?.[node.id];

          let nodeBg = '#1e293b';
          let nodeBorder = '#64748b';

          if (isSource) {
            nodeBg = '#064e3b';
            nodeBorder = '#10b981';
          } else if (isSink) {
            nodeBg = '#4c1d95';
            nodeBorder = '#a855f7';
          } else if (isCutActive) {
            if (inSourceCut) {
              nodeBg = '#064e3b';
              nodeBorder = '#34d399';
            } else {
              nodeBg = '#311042';
              nodeBorder = '#c084fc';
            }
          }

          if (isSelected) {
            nodeBorder = '#38bdf8';
          }

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-grab active:cursor-grabbing transition-transform"
              onMouseDown={(e) => handleMouseDown(node.id, e)}
            >
              {/* Outer halo */}
              <circle
                r={isDragging ? 26 : 22}
                fill={nodeBg}
                stroke={nodeBorder}
                strokeWidth={isSelected || isDragging ? 3 : 2}
                className="transition-all duration-200"
              />

              {/* Min Cut Set Badge (S or T) */}
              {isCutActive && (
                <g transform="translate(14, -14)">
                  <circle
                    r="8"
                    className={inSourceCut ? 'fill-emerald-500' : 'fill-purple-500'}
                  />
                  <text
                    textAnchor="middle"
                    dy="3"
                    className="font-mono text-[9px] font-bold fill-white"
                  >
                    {inSourceCut ? 'S' : 'T'}
                  </text>
                </g>
              )}

              {/* BFS Level Badge if present */}
              {bfsLevel !== undefined && (
                <g transform="translate(-14, -14)">
                  <circle r="8" className="fill-amber-500" />
                  <text
                    textAnchor="middle"
                    dy="3"
                    className="font-mono text-[9px] font-bold fill-black"
                  >
                    {bfsLevel}
                  </text>
                </g>
              )}

              {/* Node Label */}
              <text
                textAnchor="middle"
                dy="4"
                className="font-mono text-xs font-bold fill-slate-100 pointer-events-none select-none"
              >
                {node.label.length > 5 ? node.label.slice(0, 4) + '..' : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
