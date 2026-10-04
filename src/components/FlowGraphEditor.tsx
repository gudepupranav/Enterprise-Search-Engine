import { useState } from 'react';
import { Plus, Trash2, RotateCcw, Layers } from 'lucide-react';
import type { FlowEdge, FlowNode, FlowGraph } from '../engine/flow';
import { FLOW_PRESETS } from '../engine/flow';

interface FlowGraphEditorProps {
  graph: FlowGraph;
  onUpdateGraph: (graph: FlowGraph) => void;
  onResetFlow: () => void;
  isAlgorithmRunning: boolean;
}

export default function FlowGraphEditor({
  graph,
  onUpdateGraph,
  onResetFlow,
  isAlgorithmRunning,
}: FlowGraphEditorProps) {
  // New node form state
  const [newNodeLabel, setNewNodeLabel] = useState('');
  
  // New edge form state
  const [fromNode, setFromNode] = useState(graph.nodes[0]?.id || '');
  const [toNode, setToNode] = useState(graph.nodes[1]?.id || '');
  const [edgeCapacity, setEdgeCapacity] = useState('10');

  // Selected preset
  const [selectedPreset, setSelectedPreset] = useState(0);

  const handleAddNode = () => {
    const label = newNodeLabel.trim() || `v${graph.nodes.length + 1}`;
    const id = `node_${Date.now().toString().slice(-4)}`;
    
    // Position near center
    const x = Math.min(650, 150 + Math.random() * 400);
    const y = Math.min(380, 100 + Math.random() * 240);

    const updatedNodes: FlowNode[] = [...graph.nodes, { id, label, x, y }];
    onUpdateGraph({
      ...graph,
      nodes: updatedNodes,
    });
    setNewNodeLabel('');
  };

  const handleRemoveNode = (nodeId: string) => {
    if (nodeId === graph.source || nodeId === graph.sink) {
      alert('Cannot remove source or sink node. Please change source/sink first.');
      return;
    }
    const updatedNodes = graph.nodes.filter(n => n.id !== nodeId);
    const updatedEdges = graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    onUpdateGraph({
      ...graph,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  };

  const effectiveFrom = graph.nodes.some(n => n.id === fromNode) ? fromNode : (graph.nodes[0]?.id || '');
  const effectiveTo = graph.nodes.some(n => n.id === toNode) ? toNode : (graph.nodes[1]?.id || '');

  const handleAddEdge = () => {
    if (!effectiveFrom || !effectiveTo) return;
    if (effectiveFrom === effectiveTo) {
      alert('Self-loops are not allowed in standard flow networks.');
      return;
    }
    const cap = Math.max(1, parseInt(edgeCapacity, 10) || 1);

    // Check if edge exists
    const existingIndex = graph.edges.findIndex(e => e.from === effectiveFrom && e.to === effectiveTo);
    let updatedEdges: FlowEdge[];
    if (existingIndex >= 0) {
      // update capacity
      updatedEdges = graph.edges.map((e, idx) =>
        idx === existingIndex ? { ...e, capacity: cap, flow: 0 } : e
      );
    } else {
      const id = `e_${Date.now().toString().slice(-4)}`;
      updatedEdges = [...graph.edges, { id, from: effectiveFrom, to: effectiveTo, capacity: cap, flow: 0 }];
    }

    onUpdateGraph({
      ...graph,
      edges: updatedEdges,
    });
  };

  const handleRemoveEdge = (edgeId: string) => {
    const updatedEdges = graph.edges.filter(e => e.id !== edgeId);
    onUpdateGraph({
      ...graph,
      edges: updatedEdges,
    });
  };

  const handleCapacityChange = (edgeId: string, newCap: number) => {
    const cap = Math.max(0, newCap);
    const updatedEdges = graph.edges.map(e => (e.id === edgeId ? { ...e, capacity: cap } : e));
    onUpdateGraph({
      ...graph,
      edges: updatedEdges,
    });
  };

  const handleLoadPreset = (index: number) => {
    setSelectedPreset(index);
    const preset = FLOW_PRESETS[index];
    if (preset) {
      onUpdateGraph(JSON.parse(JSON.stringify(preset.graph)));
      onResetFlow();
    }
  };

  return (
    <div className="flex flex-col gap-5 bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          <h3 className="font-bold text-on-surface text-sm uppercase tracking-wide">
            Graph Topology & Capacity Controls
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
          >
            <RotateCcw size={14} />
            Reset Flow
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div>
        <label className="block text-xs font-semibold text-outline uppercase mb-1.5">
          Benchmark Network Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {FLOW_PRESETS.map((p, idx) => (
            <button
              key={p.name}
              disabled={isAlgorithmRunning}
              onClick={() => handleLoadPreset(idx)}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                selectedPreset === idx
                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                  : 'border-outline-variant/40 hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <div className="font-bold">{p.name}</div>
              <div className="text-[11px] text-on-surface-variant truncate mt-0.5">
                {p.graph.nodes.length} nodes, {p.graph.edges.length} edges
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Source and Sink Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-emerald-700 uppercase mb-1">
            Source Node (s)
          </label>
          <select
            value={graph.source}
            disabled={isAlgorithmRunning}
            onChange={(e) => onUpdateGraph({ ...graph, source: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-emerald-300 bg-emerald-50/50 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {graph.nodes.map(n => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-700 uppercase mb-1">
            Sink Node (t)
          </label>
          <select
            value={graph.sink}
            disabled={isAlgorithmRunning}
            onChange={(e) => onUpdateGraph({ ...graph, sink: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-purple-300 bg-purple-50/50 text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {graph.nodes.map(n => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Node & Add Edge Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-outline-variant/20">
        {/* Node addition */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-outline uppercase">Add New Node</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Node label (e.g. v5)"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-outline-variant rounded-lg font-mono focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleAddNode}
              disabled={isAlgorithmRunning}
              className="px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg flex items-center gap-1 hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
            {graph.nodes.map(n => {
              const isSrcOrSnk = n.id === graph.source || n.id === graph.sink;
              return (
                <span
                  key={n.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
                    n.id === graph.source
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                      : n.id === graph.sink
                      ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                >
                  {n.label}
                  {!isSrcOrSnk && (
                    <button
                      onClick={() => handleRemoveNode(n.id)}
                      className="text-rose-600 hover:text-rose-800 ml-0.5"
                      title="Remove node"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Edge addition */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-outline uppercase">Add / Update Directed Edge</span>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={effectiveFrom}
              onChange={(e) => setFromNode(e.target.value)}
              className="px-2 py-1.5 text-xs font-mono border border-outline-variant rounded-lg"
            >
              {graph.nodes.map(n => (
                <option key={`from-${n.id}`} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
            <select
              value={effectiveTo}
              onChange={(e) => setToNode(e.target.value)}
              className="px-2 py-1.5 text-xs font-mono border border-outline-variant rounded-lg"
            >
              {graph.nodes.map(n => (
                <option key={`to-${n.id}`} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <input
                type="number"
                min="1"
                max="999"
                value={edgeCapacity}
                onChange={(e) => setEdgeCapacity(e.target.value)}
                placeholder="Cap"
                className="w-16 px-2 py-1.5 text-xs font-mono border border-outline-variant rounded-lg"
              />
              <button
                onClick={handleAddEdge}
                disabled={isAlgorithmRunning}
                className="px-2.5 py-1.5 bg-secondary text-white text-xs font-semibold rounded-lg flex items-center justify-center hover:bg-secondary/90 disabled:opacity-50"
                title="Connect Edge"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edges List & Quick Removal */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-outline uppercase">
            Active Edges & Capacities ({graph.edges.length})
          </span>
          <span className="text-[11px] text-on-surface-variant font-mono">
            Click trash to delete edge
          </span>
        </div>
        <div className="max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-1">
          {graph.edges.map((e) => {
            const from = graph.nodes.find(n => n.id === e.from)?.label || e.from;
            const to = graph.nodes.find(n => n.id === e.to)?.label || e.to;
            return (
              <div
                key={e.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-surface-container-low border border-outline-variant/30 text-xs font-mono"
              >
                <span className="font-semibold text-on-surface truncate">
                  {from} → {to}
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="number"
                    min="1"
                    className="w-12 px-1 py-0.5 text-center text-xs border rounded bg-white"
                    value={e.capacity}
                    onChange={(ev) => handleCapacityChange(e.id, parseInt(ev.target.value, 10) || 0)}
                  />
                  <button
                    onClick={() => handleRemoveEdge(e.id)}
                    className="text-rose-600 hover:text-rose-800 p-0.5"
                    title="Delete edge"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
