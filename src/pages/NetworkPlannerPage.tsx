import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  FastForward,
  Network,
  Users,
  Layers,
  Code,
  Info,
} from 'lucide-react';
import {
  FLOW_PRESETS,
  runEdmondsKarp,
  runFordFulkerson,
  type FlowAlgorithmResult,
  type FlowGraph,
  type FlowStep,
  type FlowEdge,
} from '../engine/flow';
import FlowGraphCanvas from '../components/FlowGraphCanvas';
import FlowGraphEditor from '../components/FlowGraphEditor';
import ResidualGraphView from '../components/ResidualGraphView';
import BipartiteMatchingTab from '../components/BipartiteMatchingTab';
import AssignmentProblemTab from '../components/AssignmentProblemTab';
import FlowApplicationsTab from '../components/FlowApplicationsTab';

type MainTab = 'network' | 'assignment' | 'applications';
type AlgorithmChoice = 'edmonds-karp' | 'ford-fulkerson';

export default function NetworkPlannerPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('network');
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmChoice>('edmonds-karp');
  const [graph, setGraph] = useState<FlowGraph>(() =>
    JSON.parse(JSON.stringify(FLOW_PRESETS[0].graph))
  );

  // Stepper state
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed] = useState<number>(800);
  const [showResidualView, setShowResidualView] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Compute flow result based on chosen algorithm
  const result: FlowAlgorithmResult = useMemo(() => {
    if (selectedAlgo === 'edmonds-karp') {
      return runEdmondsKarp(graph);
    }
    return runFordFulkerson(graph);
  }, [graph, selectedAlgo]);

  const totalSteps = result.steps.length;
  const currentStep: FlowStep = result.steps[Math.min(stepIndex, totalSteps - 1)] || result.steps[0];

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps, playbackSpeed]);

  const handleReset = () => {
    setStepIndex(0);
    setIsPlaying(false);
  };

  // Synchronize stepper state when graph topology or algorithm changes
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [graph, selectedAlgo]);

  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n),
    }));
  };

  // Convert current step edges to FlowEdge[]
  const displayedEdges: FlowEdge[] = useMemo(() => {
    if (!currentStep) return graph.edges;
    return currentStep.edges.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      capacity: e.capacity,
      flow: e.flow,
    }));
  }, [currentStep, graph.edges]);

  const isComplete = currentStep?.phase === 'final_cut' || currentStep?.isComplete;

  return (
    <div className="py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Processing Network Planner</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Simulate document ingestion throughput, bottleneck capacity constraints, and task-to-analyst resource allocations.
          </p>
        </div>
        <div className="flex rounded-lg border border-outline-variant bg-surface p-1 gap-1">
          <button
            onClick={() => setActiveTab('network')}
            className={`py-1.5 px-4 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'network' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Network size={14} /> Pipeline Network Topology
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`py-1.5 px-4 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'assignment' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Users size={14} /> Task & Resource Allocation
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-1.5 px-4 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'applications' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers size={14} /> Applied Topologies
          </button>
        </div>
      </div>

      {activeTab === 'network' && (
        <div className="flex flex-col gap-6">
          {/* Algorithm Choice Controls */}
          <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-on-surface">Solver Engine:</span>
              <div className="flex rounded-lg border border-outline-variant bg-surface p-0.5">
                <button
                  onClick={() => { setSelectedAlgo('edmonds-karp'); setStepIndex(0); }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedAlgo === 'edmonds-karp' ? 'bg-primary text-white' : 'text-on-surface-variant'
                  }`}
                >
                  Edmonds-Karp (BFS Shortest Path)
                </button>
                <button
                  onClick={() => { setSelectedAlgo('ford-fulkerson'); setStepIndex(0); }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedAlgo === 'ford-fulkerson' ? 'bg-primary text-white' : 'text-on-surface-variant'
                  }`}
                >
                  Ford-Fulkerson (DFS)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={showResidualView}
                  onChange={(e) => setShowResidualView(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span>Show Residual Capacity overlay</span>
              </label>
            </div>
          </div>

          {/* KPI Output Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Max Pipeline Throughput</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-primary font-mono">
                  {isComplete ? result.maxFlow : currentStep?.currentFlow || 0}
                </span>
                <span className="text-xs text-on-surface-variant">units / sec</span>
              </div>
              <span className="text-[11px] text-emerald-700 mt-2 font-semibold">
                {isComplete ? 'Optimal maximum reached' : 'Calculating augmentation...'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Max-Flow Min-Cut Theorem</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                  {result.minCutCapacity} = {result.maxFlow}
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-2">Duality equation verified</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Critical Bottleneck Edges</span>
              <div className="mt-2">
                <span className="text-2xl font-extrabold text-amber-700 font-mono">
                  {result.minCutEdges.length} edges
                </span>
              </div>
              <span className="text-[11px] text-outline mt-2 truncate">
                {result.minCutEdges.map(e => `${e.from}→${e.to}`).join(', ')}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] text-outline uppercase font-semibold">Augmentation Steps</span>
              <div className="mt-2">
                <span className="text-2xl font-extrabold text-on-surface font-mono">
                  {result.steps.length} steps
                </span>
              </div>
              <span className="text-[11px] text-outline mt-2">
                Source: {graph.source} · Sink: {graph.sink}
              </span>
            </div>
          </div>

          {/* Visual Canvas and Editor Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
                  <span className="font-bold text-on-surface">Interactive Pipeline Flow Network</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-outline">Step:</span>
                    <span className="font-bold text-primary">{stepIndex + 1} / {totalSteps}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[420px]">
                  <FlowGraphCanvas
                    nodes={graph.nodes}
                    edges={displayedEdges}
                    source={graph.source}
                    sink={graph.sink}
                    currentStep={currentStep}
                    showResidual={showResidualView}
                    onUpdateNodePosition={handleUpdateNodePosition}
                    onSelectNode={setSelectedNodeId}
                    selectedNodeId={selectedNodeId}
                  />
                </div>

                {/* Step Controls Toolbar */}
                <div className="p-3 border-t border-outline-variant/30 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleReset}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface"
                      title="Reset Stepper"
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                      disabled={stepIndex === 0}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface disabled:opacity-40"
                      title="Previous Step"
                    >
                      <SkipBack size={15} />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 flex items-center gap-1.5"
                    >
                      {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                      {isPlaying ? 'Pause' : 'Auto Play'}
                    </button>
                    <button
                      onClick={() => setStepIndex(Math.min(totalSteps - 1, stepIndex + 1))}
                      disabled={stepIndex >= totalSteps - 1}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface disabled:opacity-40"
                      title="Next Step"
                    >
                      <SkipForward size={15} />
                    </button>
                    <button
                      onClick={() => setStepIndex(totalSteps - 1)}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface"
                      title="Jump to Finish"
                    >
                      <FastForward size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                      className="flex items-center gap-1 text-primary hover:underline font-semibold"
                    >
                      <Code size={14} /> Technical Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Step Explanatory Banner */}
              <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-xs text-xs">
                <span className="font-bold text-on-surface">Active Algorithm State:</span>
                <p className="font-mono text-primary mt-1">{currentStep?.description}</p>
                {currentStep?.detail && (
                  <p className="font-mono text-on-surface-variant text-[11px] mt-1">{currentStep.detail}</p>
                )}
              </div>
            </div>

            {/* Sidebar Editor */}
            <div className="flex flex-col gap-4">
              <FlowGraphEditor
                graph={graph}
                onUpdateGraph={(newGraph) => {
                  setGraph(newGraph);
                  setStepIndex(0);
                  setIsPlaying(false);
                }}
                onResetFlow={handleReset}
                isAlgorithmRunning={isPlaying}
              />
            </div>
          </div>

          {/* Residual Graph Inspector */}
          {showResidualView && (
            <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-xs">
              <ResidualGraphView
                nodes={graph.nodes}
                residualEdges={currentStep.residualEdges}
                reachableFromSource={currentStep.reachableFromSource}
              />
            </div>
          )}

          {/* Technical Details Panel */}
          {showTechnicalDetails && (
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-4 text-xs font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <span className="font-bold text-on-surface flex items-center gap-2 text-sm">
                  <Info size={16} className="text-primary" />
                  Flow Network Theoretical Complexity & Duality Proof
                </span>
                <span className="font-mono text-[11px] text-outline">
                  {selectedAlgo === 'edmonds-karp' ? 'Edmonds-Karp: O(V · E²)' : 'Ford-Fulkerson: O(E · |f*|)'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
                  <span className="font-bold text-on-surface text-xs">Max-Flow Min-Cut Verification:</span>
                  <p className="text-on-surface-variant text-xs leading-relaxed">
                    By the Max-Flow Min-Cut Theorem, the maximum throughput from source <strong>{graph.source}</strong> to destination <strong>{graph.sink}</strong> equals the capacity of the minimum cut partition.
                  </p>
                  <div className="font-mono text-[11px] bg-gray-50 p-2.5 rounded border border-outline-variant/20 flex flex-col gap-1">
                    <div>Reachable Source Partition S: [{result.sourceCutSet.join(', ')}]</div>
                    <div>Sink Partition T: [{result.sinkCutSet.join(', ')}]</div>
                    <div className="font-bold text-emerald-800">
                      Total Cut Capacity = {result.minCutCapacity} === Max Flow = {result.maxFlow}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
                  <span className="font-bold text-on-surface text-xs">Capacity Constraints:</span>
                  <p className="text-on-surface-variant text-xs leading-relaxed">
                    1. <strong>Capacity Constraint:</strong> For all edges (u,v), 0 ≤ f(u,v) ≤ c(u,v).<br />
                    2. <strong>Skew Symmetry:</strong> f(u,v) = -f(v,u).<br />
                    3. <strong>Flow Conservation:</strong> For all nodes except source and sink, total incoming flow strictly equals total outgoing flow.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignment' && (
        <div className="flex flex-col gap-6">
          <BipartiteMatchingTab />
          <AssignmentProblemTab />
        </div>
      )}

      {activeTab === 'applications' && (
        <FlowApplicationsTab />
      )}
    </div>
  );
}
