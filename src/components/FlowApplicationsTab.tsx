import { useMemo, useState } from 'react';
import { Server, ShieldAlert, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';
import { runEdmondsKarp, type FlowGraph } from '../engine/flow';

export default function FlowApplicationsTab() {
  const [activeApp, setActiveApp] = useState<'resource' | 'task' | 'network'>('resource');

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
            Applied Network Flow Systems
          </span>
          <h2 className="text-2xl font-bold text-on-surface mt-1">
            Real-World Flow Network Applications
          </h2>
          <p className="text-sm text-on-surface-variant max-w-2xl mt-1">
            Concrete engineering applications using max-flow and min-cut properties: load balancing across cloud clusters, emergency team dispatch, and backbone bandwidth bottleneck analysis.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1 bg-surface-container rounded-lg border border-outline-variant/30">
          <button
            onClick={() => setActiveApp('resource')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeApp === 'resource'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Resource Allocation
          </button>
          <button
            onClick={() => setActiveApp('task')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeApp === 'task'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Task & Shift Assignment
          </button>
          <button
            onClick={() => setActiveApp('network')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeApp === 'network'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Network Capacity & Bottlenecks
          </button>
        </div>
      </div>

      {activeApp === 'resource' && <ResourceAllocationDemo />}
      {activeApp === 'task' && <TaskAssignmentDemo />}
      {activeApp === 'network' && <NetworkCapacityDemo />}
    </div>
  );
}

/**
 * 1. Cloud Server Resource Allocation Demo
 */
function ResourceAllocationDemo() {
  const [incomingLoad, setIncomingLoad] = useState(80);
  const [cluster1Cap, setCluster1Cap] = useState(30);
  const [cluster2Cap, setCluster2Cap] = useState(35);
  const [cluster3Cap, setCluster3Cap] = useState(25);

  const graph: FlowGraph = useMemo(() => {
    return {
      source: 'Ingress',
      sink: 'DB_Cluster',
      nodes: [
        { id: 'Ingress', label: 'Load Balancer', x: 80, y: 180 },
        { id: 'Cluster_US', label: 'US East Pods', x: 300, y: 80 },
        { id: 'Cluster_EU', label: 'EU Central Pods', x: 300, y: 180 },
        { id: 'Cluster_AP', label: 'AP South Pods', x: 300, y: 280 },
        { id: 'DB_Cluster', label: 'Core DB Engine', x: 540, y: 180 },
      ],
      edges: [
        { id: 'e1', from: 'Ingress', to: 'Cluster_US', capacity: cluster1Cap, flow: 0 },
        { id: 'e2', from: 'Ingress', to: 'Cluster_EU', capacity: cluster2Cap, flow: 0 },
        { id: 'e3', from: 'Ingress', to: 'Cluster_AP', capacity: cluster3Cap, flow: 0 },
        { id: 'e4', from: 'Cluster_US', to: 'DB_Cluster', capacity: 28, flow: 0 },
        { id: 'e5', from: 'Cluster_EU', to: 'DB_Cluster', capacity: 30, flow: 0 },
        { id: 'e6', from: 'Cluster_AP', to: 'DB_Cluster', capacity: 22, flow: 0 },
      ],
    };
  }, [cluster1Cap, cluster2Cap, cluster3Cap]);

  const result = useMemo(() => runEdmondsKarp(graph), [graph]);
  const throughput = Math.min(incomingLoad, result.maxFlow);
  const droppedLoad = Math.max(0, incomingLoad - result.maxFlow);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Parameter Sliders */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide flex items-center gap-2">
          <Server size={18} className="text-primary" />
          Cloud Microservice Cluster Parameters
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between text-xs font-semibold text-on-surface mb-1">
              <span>Incoming Ingress Request Traffic</span>
              <span className="font-mono text-primary font-bold">{incomingLoad} req/s</span>
            </div>
            <input
              type="range"
              min="20"
              max="140"
              value={incomingLoad}
              onChange={(e) => setIncomingLoad(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-on-surface mb-1">
              <span>US-East Cluster Capacity Limit</span>
              <span className="font-mono text-on-surface-variant">{cluster1Cap} req/s</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={cluster1Cap}
              onChange={(e) => setCluster1Cap(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-on-surface mb-1">
              <span>EU-Central Cluster Capacity Limit</span>
              <span className="font-mono text-on-surface-variant">{cluster2Cap} req/s</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={cluster2Cap}
              onChange={(e) => setCluster2Cap(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-on-surface mb-1">
              <span>AP-South Cluster Capacity Limit</span>
              <span className="font-mono text-on-surface-variant">{cluster3Cap} req/s</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={cluster3Cap}
              onChange={(e) => setCluster3Cap(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
          <span className="text-xs uppercase text-outline font-semibold">System BottleNeck Analysis:</span>
          <div className="text-xs text-on-surface-variant leading-relaxed">
            The max throughput of this multi-region topology is{' '}
            <strong className="text-primary font-mono">{result.maxFlow} req/s</strong>.
            {droppedLoad > 0 ? (
              <span className="text-rose-600 font-semibold block mt-1">
                Warning: {droppedLoad} req/s will be dropped or queued. The downstream processing link is saturated!
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold block mt-1">
                Healthy: All {incomingLoad} req/s ingress traffic is satisfied by active residual capacities.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics & Cut Card */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase text-outline font-semibold">Serviced Throughput</span>
            <div className="text-3xl font-extrabold text-emerald-600 font-mono mt-2">
              {throughput} <span className="text-xs text-outline font-normal">req/s</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-2">
              Max Flow Capacity: {result.maxFlow}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase text-outline font-semibold">Min-Cut Bottleneck Cap</span>
            <div className="text-3xl font-extrabold text-primary font-mono mt-2">
              {result.minCutCapacity} <span className="text-xs text-outline font-normal">units</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-2">
              Partition: S={result.sourceCutSet.length} nodes, T={result.sinkCutSet.length} nodes
            </div>
          </div>
        </div>

        {/* Bottleneck Cut Edges */}
        <div className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline mb-2">
            Identified Bottleneck Links (Min-Cut Saturated Edges)
          </h4>
          <div className="flex flex-col gap-2">
            {result.minCutEdges.map(e => (
              <div
                key={e.id}
                className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs font-mono"
              >
                <span className="font-bold text-rose-950">
                  {e.from} → {e.to}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
                  Saturated at {e.capacity} req/s
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Emergency Task & Shift Assignment Demo
 */
function TaskAssignmentDemo() {
  const teams = [
    { name: 'Fire Engine A', skills: ['Urban Fire', 'HAZMAT'] },
    { name: 'Rescue Squad B', skills: ['Structural Collapse', 'Extrication'] },
    { name: 'Ambulance Medic C', skills: ['Trauma Triage', 'Life Support'] },
    { name: 'Hazmat Unit D', skills: ['HAZMAT', 'Decontamination'] },
  ];

  const emergencyIncidents = [
    { zone: 'District 1: Chemical Spill', required: 'HAZMAT' },
    { zone: 'District 2: Highrise Fire', required: 'Urban Fire' },
    { zone: 'District 3: Highway Crash', required: 'Trauma Triage' },
    { zone: 'District 4: Tunnel Collapse', required: 'Structural Collapse' },
  ];

  // Matched by compatibility
  const matching = [
    { team: 'Hazmat Unit D', zone: 'District 1: Chemical Spill', skill: 'HAZMAT' },
    { team: 'Fire Engine A', zone: 'District 2: Highrise Fire', skill: 'Urban Fire' },
    { team: 'Ambulance Medic C', zone: 'District 3: Highway Crash', skill: 'Trauma Triage' },
    { team: 'Rescue Squad B', zone: 'District 4: Tunnel Collapse', skill: 'Structural Collapse' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide flex items-center gap-2">
          <ShieldAlert size={18} className="text-secondary" />
          Emergency Response Roster Requirements
        </h3>
        <div className="space-y-3">
          {emergencyIncidents.map(inc => (
            <div
              key={inc.zone}
              className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-on-surface block">{inc.zone}</span>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  Mandatory Skill: {inc.required}
                </span>
              </div>
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-900 font-semibold font-mono text-[11px]">
                High Priority
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-outline-variant/20">
          <span className="text-xs uppercase font-bold text-outline block mb-2">Available Squads & Certifications:</span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {teams.map(t => (
              <div key={t.name} className="p-2 rounded bg-surface-container border text-[11px]">
                <span className="font-bold text-on-surface block">{t.name}</span>
                <span className="text-outline text-[10px]">{t.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide flex items-center gap-2">
          <CheckCircle2 size={18} className="text-secondary" />
          Flow-Dispatched Optimal Matchings (100% Coverage)
        </h3>
        <div className="space-y-3">
          {matching.map(m => (
            <div
              key={m.team}
              className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs font-mono"
            >
              <div>
                <span className="font-bold text-emerald-950 block">{m.team}</span>
                <span className="text-[11px] text-emerald-700">Skill deployed: {m.skill}</span>
              </div>
              <ArrowRight size={14} className="text-emerald-600" />
              <div className="text-right">
                <span className="font-bold text-purple-950 block">{m.zone}</span>
                <span className="text-[11px] text-emerald-600 font-semibold">Assigned & Dispatched</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2 text-xs text-on-surface-variant leading-relaxed">
          The bipartite matching is modeled with a source connected to each response unit and incidents connected to a sink.
          All 4 crisis zones are fully allocated with zero unmet demand.
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Network Infrastructure Capacity Demo
 */
function NetworkCapacityDemo() {
  const [coreLinkCap, setCoreLinkCap] = useState(40);

  const graph: FlowGraph = useMemo(() => {
    return {
      source: 'DataCenter_A',
      sink: 'DataCenter_B',
      nodes: [
        { id: 'DataCenter_A', label: 'Rack Aggregator A', x: 80, y: 180 },
        { id: 'Spine1', label: 'Spine Switch 1', x: 260, y: 90 },
        { id: 'Spine2', label: 'Spine Switch 2', x: 260, y: 270 },
        { id: 'Leaf1', label: 'Leaf Core 1', x: 440, y: 90 },
        { id: 'Leaf2', label: 'Leaf Core 2', x: 440, y: 270 },
        { id: 'DataCenter_B', label: 'CDN Gateway B', x: 620, y: 180 },
      ],
      edges: [
        { id: 'e1', from: 'DataCenter_A', to: 'Spine1', capacity: 30, flow: 0 },
        { id: 'e2', from: 'DataCenter_A', to: 'Spine2', capacity: 30, flow: 0 },
        { id: 'e3', from: 'Spine1', to: 'Leaf1', capacity: coreLinkCap, flow: 0 },
        { id: 'e4', from: 'Spine1', to: 'Leaf2', capacity: 15, flow: 0 },
        { id: 'e5', from: 'Spine2', to: 'Leaf1', capacity: 15, flow: 0 },
        { id: 'e6', from: 'Spine2', to: 'Leaf2', capacity: coreLinkCap, flow: 0 },
        { id: 'e7', from: 'Leaf1', to: 'DataCenter_B', capacity: 35, flow: 0 },
        { id: 'e8', from: 'Leaf2', to: 'DataCenter_B', capacity: 35, flow: 0 },
      ],
    };
  }, [coreLinkCap]);

  const result = useMemo(() => runEdmondsKarp(graph), [graph]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          Optical Fiber Backbone Link Controls
        </h3>

        <div>
          <div className="flex justify-between text-xs font-semibold text-on-surface mb-1">
            <span>Core Spine-to-Leaf Optical Link Bandwidth</span>
            <span className="font-mono text-primary font-bold">{coreLinkCap} Gbps</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            value={coreLinkCap}
            onChange={(e) => setCoreLinkCap(parseInt(e.target.value, 10))}
            className="w-full accent-primary"
          />
        </div>

        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
          <span className="font-bold text-on-surface uppercase block mb-1">Topology Specifications:</span>
          <ul className="list-disc pl-4 space-y-1 text-on-surface-variant font-mono text-[11px]">
            <li>Rack Ingress links: 2x 30 Gbps = 60 Gbps theoretical max</li>
            <li>Core links: 2x {coreLinkCap} Gbps + 2x 15 Gbps cross-over</li>
            <li>CDN Egress links: 2x 35 Gbps = 70 Gbps</li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide mb-3">
            Throughput & Min-Cut Boundary
          </h3>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-primary font-mono">
              {result.maxFlow}
            </span>
            <span className="text-sm font-semibold text-outline">Gbps Max Throughput</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            The max sustainable packet throughput is bounded by the minimum cut capacity ({result.minCutCapacity} Gbps).
          </p>

          <div className="mt-4 pt-3 border-t border-outline-variant/20">
            <span className="text-xs uppercase text-outline font-semibold block mb-2">
              Bottlenecked Cross-Sections:
            </span>
            <div className="flex flex-wrap gap-2">
              {result.minCutEdges.map(e => (
                <span
                  key={e.id}
                  className="px-2 py-1 rounded bg-rose-100 text-rose-900 text-xs font-mono font-bold"
                >
                  {e.from} → {e.to} ({e.capacity} Gbps)
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary/5 text-xs text-on-surface-variant">
          Increasing the core link above 30 Gbps shifts the bottleneck to the ingress switches, illustrating the law of diminishing returns in network architecture.
        </div>
      </div>
    </div>
  );
}
