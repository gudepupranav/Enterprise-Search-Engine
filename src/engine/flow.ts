export interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  capacity: number;
  flow: number;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  source: string;
  sink: string;
}

export interface ResidualEdge {
  from: string;
  to: string;
  residualCapacity: number;
  isReverse: boolean;
  originalEdgeId: string;
  flow: number;
  capacity: number;
}

export interface FlowStep {
  stepIndex: number;
  phase: 'init' | 'bfs_search' | 'dfs_search' | 'path_found' | 'augmenting' | 'residual_updated' | 'final_cut';
  description: string;
  detail: string;
  currentFlow: number;
  edges: { id: string; from: string; to: string; capacity: number; flow: number }[];
  residualEdges: ResidualEdge[];
  path?: { from: string; to: string; isReverse: boolean; originalEdgeId: string }[];
  pathNodes?: string[];
  bottleneck?: number;
  bfsLevels?: Record<string, number>;
  bfsQueue?: string[];
  dfsStack?: string[];
  reachableFromSource?: string[];
  cutEdges?: { id: string; from: string; to: string; capacity: number; flow: number }[];
  cutCapacity?: number;
  isComplete: boolean;
}

export interface FlowAlgorithmResult {
  maxFlow: number;
  steps: FlowStep[];
  finalResidualEdges: ResidualEdge[];
  sourceCutSet: string[];
  sinkCutSet: string[];
  minCutEdges: FlowEdge[];
  minCutCapacity: number;
  iterations: number;
}

export interface BipartiteMatchingResult {
  matchedPairs: { leftId: string; rightId: string }[];
  unmatchedLeft: string[];
  unmatchedRight: string[];
  matchingSize: number;
  flowEquivalentSteps: FlowStep[];
  flowGraph: FlowGraph;
  maxFlow: number;
}

export interface AssignmentResult {
  assignments: { worker: string; workerIdx: number; task: string; taskIdx: number; cost: number }[];
  totalCost: number;
  costMatrix: number[][];
  workerNames: string[];
  taskNames: string[];
  steps: {
    iteration: number;
    description: string;
    selectedPairs: [number, number][];
    currentCost: number;
  }[];
}

/**
 * Builds the residual edges list from current flow values
 */
export function computeResidualEdges(edges: FlowEdge[]): ResidualEdge[] {
  const residuals: ResidualEdge[] = [];
  
  for (const edge of edges) {
    const forwardCap = Math.max(0, edge.capacity - edge.flow);
    residuals.push({
      from: edge.from,
      to: edge.to,
      residualCapacity: forwardCap,
      isReverse: false,
      originalEdgeId: edge.id,
      flow: edge.flow,
      capacity: edge.capacity,
    });

    const reverseCap = Math.max(0, edge.flow);
    residuals.push({
      from: edge.to,
      to: edge.from,
      residualCapacity: reverseCap,
      isReverse: true,
      originalEdgeId: edge.id,
      flow: edge.flow,
      capacity: edge.capacity,
    });
  }

  return residuals;
}

/**
 * Identify reachable nodes from source in residual network using positive residual capacity
 */
export function findReachableInResidual(
  source: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
): Set<string> {
  const visited = new Set<string>();
  const queue = [source];
  visited.add(source);

  const adj = new Map<string, { to: string; cap: number }[]>();
  for (const n of nodes) adj.set(n.id, []);

  for (const e of edges) {
    const fwd = e.capacity - e.flow;
    if (fwd > 0) adj.get(e.from)?.push({ to: e.to, cap: fwd });
    const rev = e.flow;
    if (rev > 0) adj.get(e.to)?.push({ to: e.from, cap: rev });
  }

  while (queue.length > 0) {
    const u = queue.shift()!;
    const neighbors = adj.get(u) || [];
    for (const { to, cap } of neighbors) {
      if (cap > 0 && !visited.has(to)) {
        visited.add(to);
        queue.push(to);
      }
    }
  }

  return visited;
}

/**
 * Compute the min-cut details from a flow state
 */
export function getMinCutDetails(graph: FlowGraph, edges: FlowEdge[]) {
  const sourceReachable = findReachableInResidual(graph.source, graph.nodes, edges);
  const sourceCutSet = Array.from(sourceReachable);
  const sinkCutSet = graph.nodes
    .map(n => n.id)
    .filter(id => !sourceReachable.has(id));

  const minCutEdges: FlowEdge[] = [];
  let minCutCapacity = 0;

  for (const e of edges) {
    if (sourceReachable.has(e.from) && !sourceReachable.has(e.to)) {
      minCutEdges.push(e);
      minCutCapacity += e.capacity;
    }
  }

  return { sourceCutSet, sinkCutSet, minCutEdges, minCutCapacity };
}

/**
 * Edmonds-Karp Algorithm (BFS-based Ford-Fulkerson)
 */
export function runEdmondsKarp(graph: FlowGraph): FlowAlgorithmResult {
  const edges: FlowEdge[] = graph.edges.map(e => ({ ...e, flow: 0 }));
  const steps: FlowStep[] = [];
  let currentFlow = 0;
  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    phase: 'init',
    description: 'Initialized Flow Network with zero flow on all directed edges.',
    detail: `Source: ${graph.source}, Sink: ${graph.sink}. Ready to search shortest augmenting paths via BFS.`,
    currentFlow: 0,
    edges: edges.map(e => ({ ...e })),
    residualEdges: computeResidualEdges(edges),
    isComplete: false,
  });

  let iteration = 0;
  const maxIterations = 500; // Safeguard

  while (iteration < maxIterations) {
    iteration++;

    // BFS to find shortest augmenting path in terms of edges
    const parent = new Map<string, { from: string; edge: FlowEdge; isReverse: boolean }>();
    const visited = new Set<string>();
    const queue: string[] = [graph.source];
    visited.add(graph.source);

    const bfsLevels: Record<string, number> = { [graph.source]: 0 };

    while (queue.length > 0) {
      const u = queue.shift()!;
      const currentLevel = bfsLevels[u];

      // Forward edges from u
      for (const e of edges) {
        if (e.from === u) {
          const residual = e.capacity - e.flow;
          if (residual > 0 && !visited.has(e.to)) {
            visited.add(e.to);
            bfsLevels[e.to] = currentLevel + 1;
            parent.set(e.to, { from: u, edge: e, isReverse: false });
            queue.push(e.to);
          }
        }
      }

      // Backward edges into u (reverse flow cancellation)
      for (const e of edges) {
        if (e.to === u) {
          const residual = e.flow;
          if (residual > 0 && !visited.has(e.from)) {
            visited.add(e.from);
            bfsLevels[e.from] = currentLevel + 1;
            parent.set(e.from, { from: u, edge: e, isReverse: true });
            queue.push(e.from);
          }
        }
      }

      if (visited.has(graph.sink)) break;
    }

    if (!visited.has(graph.sink)) {
      // No more augmenting path found
      const { sourceCutSet, sinkCutSet, minCutEdges, minCutCapacity } = getMinCutDetails(graph, edges);
      steps.push({
        stepIndex: stepIdx++,
        phase: 'final_cut',
        description: `No augmenting path found from ${graph.source} to ${graph.sink} in residual graph. Maximum flow reached!`,
        detail: `Max Flow = ${currentFlow}. Min-Cut Capacity = ${minCutCapacity}. Reachable set S = {${sourceCutSet.join(', ')}}. Unreachable set T = {${sinkCutSet.join(', ')}}.`,
        currentFlow,
        edges: edges.map(e => ({ ...e })),
        residualEdges: computeResidualEdges(edges),
        reachableFromSource: sourceCutSet,
        cutEdges: minCutEdges.map(e => ({ ...e })),
        cutCapacity: minCutCapacity,
        isComplete: true,
      });
      break;
    }

    // Reconstruct augmenting path
    const pathEdges: { from: string; to: string; isReverse: boolean; originalEdgeId: string }[] = [];
    const pathNodes: string[] = [graph.sink];
    let curr = graph.sink;
    let bottleneck = Infinity;

    while (curr !== graph.source) {
      const p = parent.get(curr)!;
      const resCap = p.isReverse ? p.edge.flow : (p.edge.capacity - p.edge.flow);
      bottleneck = Math.min(bottleneck, resCap);
      pathEdges.unshift({
        from: p.from,
        to: curr,
        isReverse: p.isReverse,
        originalEdgeId: p.edge.id,
      });
      curr = p.from;
      pathNodes.unshift(curr);
    }

    steps.push({
      stepIndex: stepIdx++,
      phase: 'path_found',
      description: `Iteration ${iteration}: Shortest augmenting path found via BFS: ${pathNodes.join(' → ')}.`,
      detail: `Path length: ${pathEdges.length} hops. Bottleneck capacity Δ = ${bottleneck}.`,
      currentFlow,
      edges: edges.map(e => ({ ...e })),
      residualEdges: computeResidualEdges(edges),
      path: pathEdges,
      pathNodes,
      bottleneck,
      bfsLevels,
      bfsQueue: Array.from(visited),
      isComplete: false,
    });

    // Augment flow
    for (const p of pathEdges) {
      const edge = edges.find(e => e.id === p.originalEdgeId)!;
      if (!p.isReverse) {
        edge.flow += bottleneck;
      } else {
        edge.flow -= bottleneck;
      }
    }
    currentFlow += bottleneck;

    steps.push({
      stepIndex: stepIdx++,
      phase: 'augmenting',
      description: `Augmented flow by Δ = ${bottleneck} along path ${pathNodes.join(' → ')}. Current total flow: ${currentFlow}.`,
      detail: `Updated flow on ${pathEdges.length} edges. Residual capacities recalculated.`,
      currentFlow,
      edges: edges.map(e => ({ ...e })),
      residualEdges: computeResidualEdges(edges),
      path: pathEdges,
      pathNodes,
      bottleneck,
      isComplete: false,
    });
  }

  const finalCut = getMinCutDetails(graph, edges);
  return {
    maxFlow: currentFlow,
    steps,
    finalResidualEdges: computeResidualEdges(edges),
    sourceCutSet: finalCut.sourceCutSet,
    sinkCutSet: finalCut.sinkCutSet,
    minCutEdges: finalCut.minCutEdges,
    minCutCapacity: finalCut.minCutCapacity,
    iterations: iteration,
  };
}

/**
 * Ford-Fulkerson Method (DFS-based augmenting path)
 */
export function runFordFulkerson(graph: FlowGraph): FlowAlgorithmResult {
  const edges: FlowEdge[] = graph.edges.map(e => ({ ...e, flow: 0 }));
  const steps: FlowStep[] = [];
  let currentFlow = 0;
  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    phase: 'init',
    description: 'Initialized Flow Network with zero flow on all directed edges (Ford-Fulkerson DFS).',
    detail: `Source: ${graph.source}, Sink: ${graph.sink}. Ready to search augmenting paths via Depth-First Search.`,
    currentFlow: 0,
    edges: edges.map(e => ({ ...e })),
    residualEdges: computeResidualEdges(edges),
    isComplete: false,
  });

  let iteration = 0;
  const maxIterations = 500;

  while (iteration < maxIterations) {
    iteration++;

    // DFS to find any augmenting path
    const visited = new Set<string>();
    const dfsStack: string[] = [];
    type PathStep = { from: string; to: string; isReverse: boolean; edge: FlowEdge; resCap: number };
    let foundPath: PathStep[] | null = null;

    function dfs(u: string, currentPath: PathStep[]): boolean {
      if (u === graph.sink) {
        foundPath = [...currentPath];
        return true;
      }
      visited.add(u);
      dfsStack.push(u);

      // Forward residual edges
      for (const e of edges) {
        if (e.from === u && !visited.has(e.to)) {
          const res = e.capacity - e.flow;
          if (res > 0) {
            currentPath.push({ from: u, to: e.to, isReverse: false, edge: e, resCap: res });
            if (dfs(e.to, currentPath)) return true;
            currentPath.pop();
          }
        }
      }

      // Backward residual edges
      for (const e of edges) {
        if (e.to === u && !visited.has(e.from)) {
          const res = e.flow;
          if (res > 0) {
            currentPath.push({ from: u, to: e.from, isReverse: true, edge: e, resCap: res });
            if (dfs(e.from, currentPath)) return true;
            currentPath.pop();
          }
        }
      }

      return false;
    }

    dfs(graph.source, []);

    if (!foundPath || (foundPath as PathStep[]).length === 0) {
      // No more augmenting path
      const { sourceCutSet, sinkCutSet, minCutEdges, minCutCapacity } = getMinCutDetails(graph, edges);
      steps.push({
        stepIndex: stepIdx++,
        phase: 'final_cut',
        description: `No augmenting path found by DFS from ${graph.source} to ${graph.sink}. Maximum flow reached!`,
        detail: `Max Flow = ${currentFlow}. Min-Cut Capacity = ${minCutCapacity}. Reachable set S = {${sourceCutSet.join(', ')}}. Unreachable set T = {${sinkCutSet.join(', ')}}.`,
        currentFlow,
        edges: edges.map(e => ({ ...e })),
        residualEdges: computeResidualEdges(edges),
        reachableFromSource: sourceCutSet,
        cutEdges: minCutEdges.map(e => ({ ...e })),
        cutCapacity: minCutCapacity,
        isComplete: true,
      });
      break;
    }

    const pathSteps: PathStep[] = foundPath;
    let bottleneck = Infinity;
    const pathNodes: string[] = [graph.source];

    for (const ps of pathSteps) {
      bottleneck = Math.min(bottleneck, ps.resCap);
      pathNodes.push(ps.to);
    }

    const pathEdges = pathSteps.map(ps => ({
      from: ps.from,
      to: ps.to,
      isReverse: ps.isReverse,
      originalEdgeId: ps.edge.id,
    }));

    steps.push({
      stepIndex: stepIdx++,
      phase: 'path_found',
      description: `Iteration ${iteration}: DFS identified augmenting path: ${pathNodes.join(' → ')}.`,
      detail: `Bottleneck capacity Δ = ${bottleneck} across path.`,
      currentFlow,
      edges: edges.map(e => ({ ...e })),
      residualEdges: computeResidualEdges(edges),
      path: pathEdges,
      pathNodes,
      bottleneck,
      dfsStack,
      isComplete: false,
    });

    // Augment flow
    for (const ps of pathSteps) {
      if (!ps.isReverse) {
        ps.edge.flow += bottleneck;
      } else {
        ps.edge.flow -= bottleneck;
      }
    }
    currentFlow += bottleneck;

    steps.push({
      stepIndex: stepIdx++,
      phase: 'augmenting',
      description: `Augmented flow by Δ = ${bottleneck} along path ${pathNodes.join(' → ')}. Current total flow: ${currentFlow}.`,
      detail: `Updated flow on ${pathSteps.length} edges. Residual capacities recalculated.`,
      currentFlow,
      edges: edges.map(e => ({ ...e })),
      residualEdges: computeResidualEdges(edges),
      path: pathEdges,
      pathNodes,
      bottleneck,
      isComplete: false,
    });
  }

  const finalCut = getMinCutDetails(graph, edges);
  return {
    maxFlow: currentFlow,
    steps,
    finalResidualEdges: computeResidualEdges(edges),
    sourceCutSet: finalCut.sourceCutSet,
    sinkCutSet: finalCut.sinkCutSet,
    minCutEdges: finalCut.minCutEdges,
    minCutCapacity: finalCut.minCutCapacity,
    iterations: iteration,
  };
}

/**
 * Solves Bipartite Matching by reduction to Maximum Flow
 */
export function solveBipartiteMatching(
  leftNodes: string[],
  rightNodes: string[],
  candidateEdges: [string, string][]
): BipartiteMatchingResult {
  const superSource = 's_src';
  const superSink = 't_snk';

  const nodes: FlowNode[] = [
    { id: superSource, label: 'Super Source (s)', x: 60, y: 220 },
    { id: superSink, label: 'Super Sink (t)', x: 740, y: 220 },
  ];

  const leftSpacing = 380 / Math.max(1, leftNodes.length);
  leftNodes.forEach((name, i) => {
    nodes.push({
      id: `L_${name}`,
      label: name,
      x: 260,
      y: 60 + i * leftSpacing,
    });
  });

  const rightSpacing = 380 / Math.max(1, rightNodes.length);
  rightNodes.forEach((name, i) => {
    nodes.push({
      id: `R_${name}`,
      label: name,
      x: 540,
      y: 60 + i * rightSpacing,
    });
  });

  const edges: FlowEdge[] = [];
  let edgeId = 0;

  // Super-source to Left nodes (capacity 1)
  for (const l of leftNodes) {
    edges.push({
      id: `e_${edgeId++}`,
      from: superSource,
      to: `L_${l}`,
      capacity: 1,
      flow: 0,
    });
  }

  // Left to Right candidate edges (capacity 1)
  for (const [l, r] of candidateEdges) {
    edges.push({
      id: `e_${edgeId++}`,
      from: `L_${l}`,
      to: `R_${r}`,
      capacity: 1,
      flow: 0,
    });
  }

  // Right to Super-sink edges (capacity 1)
  for (const r of rightNodes) {
    edges.push({
      id: `e_${edgeId++}`,
      from: `R_${r}`,
      to: superSink,
      capacity: 1,
      flow: 0,
    });
  }

  const flowGraph: FlowGraph = {
    nodes,
    edges,
    source: superSource,
    sink: superSink,
  };

  const flowResult = runEdmondsKarp(flowGraph);

  // Extract matching edges (where flow === 1 between Left and Right)
  const matchedPairs: { leftId: string; rightId: string }[] = [];
  const matchedLeftSet = new Set<string>();
  const matchedRightSet = new Set<string>();

  const finalEdges = flowResult.steps[flowResult.steps.length - 1]?.edges || [];
  for (const e of finalEdges) {
    if (e.from.startsWith('L_') && e.to.startsWith('R_') && e.flow === 1) {
      const leftId = e.from.slice(2);
      const rightId = e.to.slice(2);
      matchedPairs.push({ leftId, rightId });
      matchedLeftSet.add(leftId);
      matchedRightSet.add(rightId);
    }
  }

  const unmatchedLeft = leftNodes.filter(l => !matchedLeftSet.has(l));
  const unmatchedRight = rightNodes.filter(r => !matchedRightSet.has(r));

  return {
    matchedPairs,
    unmatchedLeft,
    unmatchedRight,
    matchingSize: matchedPairs.length,
    flowEquivalentSteps: flowResult.steps,
    flowGraph,
    maxFlow: flowResult.maxFlow,
  };
}

/**
 * Solves the Assignment Problem with Min-Cost Max-Flow / Hungarian reduction
 */
export function solveAssignmentProblem(
  costMatrix: number[][],
  workerNames: string[],
  taskNames: string[]
): AssignmentResult {
  const n = costMatrix.length;
  const m = costMatrix[0]?.length || 0;

  // We implement the Hungarian Algorithm / Munkres for square/rectangular min-cost matching
  // First pad to square if n != m
  const size = Math.max(n, m);
  const matrix: number[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      if (r < n && c < m) return costMatrix[r][c];
      return 10000; // Big penalty for dummy
    })
  );

  const u = new Array(size + 1).fill(0);
  const v = new Array(size + 1).fill(0);
  const p = new Array(size + 1).fill(0);
  const way = new Array(size + 1).fill(0);

  const steps: {
    iteration: number;
    description: string;
    selectedPairs: [number, number][];
    currentCost: number;
  }[] = [];

  for (let i = 1; i <= size; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(size + 1).fill(Infinity);
    const used = new Array(size + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= size; j++) {
        if (!used[j]) {
          const cur = matrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= size; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);

    // Current partial matching
    const currentPairs: [number, number][] = [];
    let partialCost = 0;
    for (let j = 1; j <= size; j++) {
      if (p[j] > 0 && p[j] - 1 < n && j - 1 < m) {
        currentPairs.push([p[j] - 1, j - 1]);
        partialCost += costMatrix[p[j] - 1][j - 1];
      }
    }

    steps.push({
      iteration: i,
      description: `Worker ${workerNames[i - 1] || `W${i}`} assigned along minimum augmenting path in potential reduced cost network.`,
      selectedPairs: currentPairs,
      currentCost: partialCost,
    });
  }

  const assignments: {
    worker: string;
    workerIdx: number;
    task: string;
    taskIdx: number;
    cost: number;
  }[] = [];

  let totalCost = 0;
  for (let j = 1; j <= size; j++) {
    const workerIdx = p[j] - 1;
    const taskIdx = j - 1;
    if (workerIdx < n && taskIdx < m) {
      const c = costMatrix[workerIdx][taskIdx];
      totalCost += c;
      assignments.push({
        worker: workerNames[workerIdx] || `Worker ${workerIdx + 1}`,
        workerIdx,
        task: taskNames[taskIdx] || `Task ${taskIdx + 1}`,
        taskIdx,
        cost: c,
      });
    }
  }

  // Sort by worker index for clarity
  assignments.sort((a, b) => a.workerIdx - b.workerIdx);

  return {
    assignments,
    totalCost,
    costMatrix,
    workerNames,
    taskNames,
    steps,
  };
}

/**
 * Standard Presets for Flow Networks
 */
export const FLOW_PRESETS: { name: string; description: string; graph: FlowGraph }[] = [
  {
    name: 'Classic 6-Node Flow Network',
    description: 'Standard textbook network demonstrating Ford-Fulkerson and Edmonds-Karp with multiple augmenting paths and reverse flow.',
    graph: {
      source: 's',
      sink: 't',
      nodes: [
        { id: 's', label: 'Source (s)', x: 80, y: 200 },
        { id: 'v1', label: 'v1', x: 260, y: 90 },
        { id: 'v2', label: 'v2', x: 260, y: 310 },
        { id: 'v3', label: 'v3', x: 500, y: 90 },
        { id: 'v4', label: 'v4', x: 500, y: 310 },
        { id: 't', label: 'Sink (t)', x: 680, y: 200 },
      ],
      edges: [
        { id: 'e1', from: 's', to: 'v1', capacity: 16, flow: 0 },
        { id: 'e2', from: 's', to: 'v2', capacity: 13, flow: 0 },
        { id: 'e3', from: 'v1', to: 'v2', capacity: 10, flow: 0 },
        { id: 'e4', from: 'v1', to: 'v3', capacity: 12, flow: 0 },
        { id: 'e5', from: 'v2', to: 'v1', capacity: 4, flow: 0 },
        { id: 'e6', from: 'v2', to: 'v4', capacity: 14, flow: 0 },
        { id: 'e7', from: 'v3', to: 'v2', capacity: 9, flow: 0 },
        { id: 'e8', from: 'v3', to: 't', capacity: 20, flow: 0 },
        { id: 'e9', from: 'v4', to: 'v3', capacity: 7, flow: 0 },
        { id: 'e10', from: 'v4', to: 't', capacity: 4, flow: 0 },
      ],
    },
  },
  {
    name: 'Diamond Network with Bottleneck',
    description: 'A 4-node network showing reverse residual edge utilization when an suboptimal initial path is chosen.',
    graph: {
      source: 'A',
      sink: 'D',
      nodes: [
        { id: 'A', label: 'Source (A)', x: 90, y: 200 },
        { id: 'B', label: 'Node B', x: 380, y: 80 },
        { id: 'C', label: 'Node C', x: 380, y: 320 },
        { id: 'D', label: 'Sink (D)', x: 670, y: 200 },
      ],
      edges: [
        { id: 'e1', from: 'A', to: 'B', capacity: 10, flow: 0 },
        { id: 'e2', from: 'A', to: 'C', capacity: 10, flow: 0 },
        { id: 'e3', from: 'B', to: 'C', capacity: 1, flow: 0 },
        { id: 'e4', from: 'B', to: 'D', capacity: 10, flow: 0 },
        { id: 'e5', from: 'C', to: 'D', capacity: 10, flow: 0 },
      ],
    },
  },
  {
    name: 'Data Center Throughput Grid',
    description: 'Server cluster with multiple parallel routing links and tight core backbone constraints.',
    graph: {
      source: 'Ingress',
      sink: 'Egress',
      nodes: [
        { id: 'Ingress', label: 'Ingress Gateway', x: 80, y: 200 },
        { id: 'R1', label: 'Router 1', x: 270, y: 100 },
        { id: 'R2', label: 'Router 2', x: 270, y: 300 },
        { id: 'S1', label: 'Switch A', x: 470, y: 100 },
        { id: 'S2', label: 'Switch B', x: 470, y: 300 },
        { id: 'Egress', label: 'Egress Gateway', x: 670, y: 200 },
      ],
      edges: [
        { id: 'e1', from: 'Ingress', to: 'R1', capacity: 25, flow: 0 },
        { id: 'e2', from: 'Ingress', to: 'R2', capacity: 20, flow: 0 },
        { id: 'e3', from: 'R1', to: 'S1', capacity: 15, flow: 0 },
        { id: 'e4', from: 'R1', to: 'S2', capacity: 15, flow: 0 },
        { id: 'e5', from: 'R2', to: 'S1', capacity: 10, flow: 0 },
        { id: 'e6', from: 'R2', to: 'S2', capacity: 15, flow: 0 },
        { id: 'e7', from: 'S1', to: 'Egress', capacity: 20, flow: 0 },
        { id: 'e8', from: 'S2', to: 'Egress', capacity: 25, flow: 0 },
      ],
    },
  },
];
