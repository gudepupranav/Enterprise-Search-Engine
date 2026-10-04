export type MatrixCell = {
  row: number;
  col: number;
};

export type EditOperationType = 'insert' | 'delete' | 'replace' | 'match';

export interface EditOperation {
  type: EditOperationType;
  from: MatrixCell;
  to: MatrixCell;
  description: string;
}

export interface EditDistanceResult {
  distance: number;
  matrix: number[][];
  operations: string[];
  operationDetails: EditOperation[];
  fillOrder: MatrixCell[];
  tracebackPath: MatrixCell[];
}

export function editDistance(source: string, target: string): EditDistanceResult {
  const m = source.length;
  const n = target.length;
  const matrix = createNumberMatrix(m + 1, n + 1, 0);
  const fillOrder: MatrixCell[] = [];

  for (let i = 0; i <= m; i++) {
    matrix[i][0] = i;
    fillOrder.push({ row: i, col: 0 });
  }
  for (let j = 1; j <= n; j++) {
    matrix[0][j] = j;
    fillOrder.push({ row: 0, col: j });
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === target[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
      }
      fillOrder.push({ row: i, col: j });
    }
  }

  const operationDetails: EditOperation[] = [];
  const tracebackPath: MatrixCell[] = [{ row: m, col: n }];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && source[i - 1] === target[j - 1] && matrix[i][j] === matrix[i - 1][j - 1]) {
      operationDetails.push({
        type: 'match',
        from: { row: i, col: j },
        to: { row: i - 1, col: j - 1 },
        description: `Match '${source[i - 1]}'`,
      });
      i--;
      j--;
    } else if (i > 0 && j > 0 && matrix[i][j] === matrix[i - 1][j - 1] + 1) {
      operationDetails.push({
        type: 'replace',
        from: { row: i, col: j },
        to: { row: i - 1, col: j - 1 },
        description: `Replace '${source[i - 1]}' with '${target[j - 1]}'`,
      });
      i--;
      j--;
    } else if (i > 0 && matrix[i][j] === matrix[i - 1][j] + 1) {
      operationDetails.push({
        type: 'delete',
        from: { row: i, col: j },
        to: { row: i - 1, col: j },
        description: `Delete '${source[i - 1]}'`,
      });
      i--;
    } else {
      operationDetails.push({
        type: 'insert',
        from: { row: i, col: j },
        to: { row: i, col: j - 1 },
        description: `Insert '${target[j - 1]}'`,
      });
      j--;
    }
    tracebackPath.push({ row: i, col: j });
  }

  operationDetails.reverse();
  return {
    distance: matrix[m][n],
    matrix,
    operations: operationDetails.map(op => op.description),
    operationDetails,
    fillOrder,
    tracebackPath,
  };
}

export interface LCSResult {
  length: number;
  matrix: number[][];
  lcs: string;
  tracebackPath: MatrixCell[];
  selectedCells: MatrixCell[];
  fillOrder: MatrixCell[];
}

export function longestCommonSubsequence(a: string, b: string): LCSResult {
  const matrix = createNumberMatrix(a.length + 1, b.length + 1, 0);
  const fillOrder: MatrixCell[] = [];

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = a[i - 1] === b[j - 1]
        ? matrix[i - 1][j - 1] + 1
        : Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      fillOrder.push({ row: i, col: j });
    }
  }

  let i = a.length;
  let j = b.length;
  let lcs = '';
  const tracebackPath: MatrixCell[] = [{ row: i, col: j }];
  const selectedCells: MatrixCell[] = [];

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs = a[i - 1] + lcs;
      selectedCells.push({ row: i, col: j });
      i--;
      j--;
    } else if (matrix[i - 1][j] >= matrix[i][j - 1]) {
      i--;
    } else {
      j--;
    }
    tracebackPath.push({ row: i, col: j });
  }

  return { length: matrix[a.length][b.length], matrix, lcs, tracebackPath, selectedCells, fillOrder };
}

export interface AlignmentResult {
  algorithm: 'Needleman-Wunsch' | 'Smith-Waterman';
  matrix: number[][];
  tracebackPath: MatrixCell[];
  fillOrder: MatrixCell[];
  alignedA: string;
  alignedB: string;
  score: number;
  maxCell?: MatrixCell;
  zeroResetCells: MatrixCell[];
}

export function needlemanWunsch(a: string, b: string, matchScore: number, mismatchPenalty: number, gapPenalty: number): AlignmentResult {
  const matrix = createNumberMatrix(a.length + 1, b.length + 1, 0);
  const fillOrder: MatrixCell[] = [];

  for (let i = 1; i <= a.length; i++) {
    matrix[i][0] = matrix[i - 1][0] + gapPenalty;
    fillOrder.push({ row: i, col: 0 });
  }
  for (let j = 1; j <= b.length; j++) {
    matrix[0][j] = matrix[0][j - 1] + gapPenalty;
    fillOrder.push({ row: 0, col: j });
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const diagonal = matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? matchScore : mismatchPenalty);
      const up = matrix[i - 1][j] + gapPenalty;
      const left = matrix[i][j - 1] + gapPenalty;
      matrix[i][j] = Math.max(diagonal, up, left);
      fillOrder.push({ row: i, col: j });
    }
  }

  let i = a.length;
  let j = b.length;
  let alignedA = '';
  let alignedB = '';
  const tracebackPath: MatrixCell[] = [{ row: i, col: j }];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const score = a[i - 1] === b[j - 1] ? matchScore : mismatchPenalty;
      if (matrix[i][j] === matrix[i - 1][j - 1] + score) {
        alignedA = a[i - 1] + alignedA;
        alignedB = b[j - 1] + alignedB;
        i--;
        j--;
        tracebackPath.push({ row: i, col: j });
        continue;
      }
    }
    if (i > 0 && matrix[i][j] === matrix[i - 1][j] + gapPenalty) {
      alignedA = a[i - 1] + alignedA;
      alignedB = '-' + alignedB;
      i--;
    } else {
      alignedA = '-' + alignedA;
      alignedB = b[j - 1] + alignedB;
      j--;
    }
    tracebackPath.push({ row: i, col: j });
  }

  return {
    algorithm: 'Needleman-Wunsch',
    matrix,
    tracebackPath,
    fillOrder,
    alignedA,
    alignedB,
    score: matrix[a.length][b.length],
    zeroResetCells: [],
  };
}

export function smithWaterman(a: string, b: string, matchScore: number, mismatchPenalty: number, gapPenalty: number): AlignmentResult {
  const matrix = createNumberMatrix(a.length + 1, b.length + 1, 0);
  const fillOrder: MatrixCell[] = [];
  const zeroResetCells: MatrixCell[] = [];
  let maxCell: MatrixCell = { row: 0, col: 0 };
  let maxScore = 0;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const diagonal = matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? matchScore : mismatchPenalty);
      const up = matrix[i - 1][j] + gapPenalty;
      const left = matrix[i][j - 1] + gapPenalty;
      matrix[i][j] = Math.max(0, diagonal, up, left);
      if (matrix[i][j] === 0) zeroResetCells.push({ row: i, col: j });
      if (matrix[i][j] > maxScore) {
        maxScore = matrix[i][j];
        maxCell = { row: i, col: j };
      }
      fillOrder.push({ row: i, col: j });
    }
  }

  let i = maxCell.row;
  let j = maxCell.col;
  let alignedA = '';
  let alignedB = '';
  const tracebackPath: MatrixCell[] = [{ row: i, col: j }];

  while (i > 0 && j > 0 && matrix[i][j] > 0) {
    const score = a[i - 1] === b[j - 1] ? matchScore : mismatchPenalty;
    if (matrix[i][j] === matrix[i - 1][j - 1] + score) {
      alignedA = a[i - 1] + alignedA;
      alignedB = b[j - 1] + alignedB;
      i--;
      j--;
    } else if (matrix[i][j] === matrix[i - 1][j] + gapPenalty) {
      alignedA = a[i - 1] + alignedA;
      alignedB = '-' + alignedB;
      i--;
    } else {
      alignedA = '-' + alignedA;
      alignedB = b[j - 1] + alignedB;
      j--;
    }
    tracebackPath.push({ row: i, col: j });
  }

  return {
    algorithm: 'Smith-Waterman',
    matrix,
    tracebackPath,
    fillOrder,
    alignedA,
    alignedB,
    score: maxScore,
    maxCell,
    zeroResetCells,
  };
}

export interface IntervalDPResult {
  values: number[][];
  split: number[][];
  fillOrder: MatrixCell[];
  optimalCost: number;
  recurrence: string;
  traceback: string[];
}

export function matrixChainOrder(dimensions: number[]): IntervalDPResult {
  const n = Math.max(0, dimensions.length - 1);
  const values = createNumberMatrix(n, n, 0);
  const split = createNumberMatrix(n, n, -1);
  const fillOrder: MatrixCell[] = [];

  for (let length = 2; length <= n; length++) {
    for (let left = 0; left <= n - length; left++) {
      const right = left + length - 1;
      values[left][right] = Infinity;
      for (let k = left; k < right; k++) {
        const cost = values[left][k] + values[k + 1][right] + dimensions[left] * dimensions[k + 1] * dimensions[right + 1];
        if (cost < values[left][right]) {
          values[left][right] = cost;
          split[left][right] = k;
        }
      }
      fillOrder.push({ row: left, col: right });
    }
  }

  return {
    values,
    split,
    fillOrder,
    optimalCost: n === 0 ? 0 : values[0][n - 1],
    recurrence: 'dp[i][j] = min(dp[i][k] + dp[k+1][j] + dim[i]*dim[k+1]*dim[j+1])',
    traceback: n === 0 ? [] : buildMatrixChainTrace(split, 0, n - 1),
  };
}

export interface TSPTransition {
  fromMask: number;
  toMask: number;
  fromCity: number;
  toCity: number;
  cost: number;
}

export interface TSPResult {
  minCost: number;
  path: number[];
  dpTable: Record<string, number>;
  parentTable: Record<string, number>;
  transitions: TSPTransition[];
  reachableStates: { mask: number; city: number; cost: number }[];
  cityCount: number;
}

export function parseTSPCell(value: string, isDiagonal: boolean): number {
  if (isDiagonal) return 0;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === '' || trimmed === 'x' || trimmed === 'inf' || trimmed === '∞') return Infinity;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : Infinity;
}

export function tsp(graph: number[][]): TSPResult {
  const n = graph.length;
  if (n === 0) return { minCost: 0, path: [], dpTable: {}, parentTable: {}, transitions: [], reachableStates: [], cityCount: 0 };
  if (n === 1) return { minCost: 0, path: [0, 0], dpTable: { '0001 @ C0': 0 }, parentTable: {}, transitions: [], reachableStates: [{ mask: 1, city: 0, cost: 0 }], cityCount: 1 };

  const visitedAll = (1 << n) - 1;
  const dp = createNumberMatrix(1 << n, n, Infinity);
  const parent = createNumberMatrix(1 << n, n, -1);
  const transitions: TSPTransition[] = [];
  dp[1][0] = 0;

  for (let mask = 1; mask < (1 << n); mask++) {
    if ((mask & 1) === 0) continue;
    for (let city = 0; city < n; city++) {
      if ((mask & (1 << city)) === 0 || dp[mask][city] === Infinity) continue;
      for (let next = 0; next < n; next++) {
        if ((mask & (1 << next)) !== 0 || graph[city][next] === Infinity) continue;
        const nextMask = mask | (1 << next);
        const cost = dp[mask][city] + graph[city][next];
        if (cost < dp[nextMask][next]) {
          dp[nextMask][next] = cost;
          parent[nextMask][next] = city;
          transitions.push({ fromMask: mask, toMask: nextMask, fromCity: city, toCity: next, cost });
        }
      }
    }
  }

  let minCost = Infinity;
  let lastCity = -1;
  for (let city = 1; city < n; city++) {
    if (graph[city][0] === Infinity || dp[visitedAll][city] === Infinity) continue;
    const cost = dp[visitedAll][city] + graph[city][0];
    if (cost < minCost) {
      minCost = cost;
      lastCity = city;
    }
  }

  const path: number[] = [];
  if (lastCity !== -1) {
    const reversed = [0];
    let mask = visitedAll;
    let city = lastCity;
    while (city !== -1 && city !== 0) {
      reversed.push(city);
      const previous = parent[mask][city];
      mask ^= 1 << city;
      city = previous;
    }
    reversed.push(0);
    path.push(...reversed.reverse());
  }

  const dpTable: Record<string, number> = {};
  const parentTable: Record<string, number> = {};
  const reachableStates: { mask: number; city: number; cost: number }[] = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    for (let city = 0; city < n; city++) {
      if (dp[mask][city] !== Infinity) {
        const key = `${mask.toString(2).padStart(n, '0')} @ C${city}`;
        dpTable[key] = dp[mask][city];
        reachableStates.push({ mask, city, cost: dp[mask][city] });
        if (parent[mask][city] !== -1) parentTable[key] = parent[mask][city];
      }
    }
  }

  return { minCost, path, dpTable, parentTable, transitions, reachableStates, cityCount: n };
}

function createNumberMatrix(rows: number, cols: number, value: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(value));
}

function buildMatrixChainTrace(split: number[][], left: number, right: number): string[] {
  if (left === right) return [`A${left + 1}`];
  const k = split[left][right];
  if (k < 0) return [`A${left + 1}..A${right + 1}`];
  return [
    `Split A${left + 1}..A${right + 1} at k=${k + 1}`,
    ...buildMatrixChainTrace(split, left, k),
    ...buildMatrixChainTrace(split, k + 1, right),
  ];
}
