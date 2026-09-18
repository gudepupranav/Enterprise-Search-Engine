export interface EditDistanceResult {
  distance: number;
  matrix: number[][];
  operations: string[];
}

export function editDistance(word1: string, word2: string): EditDistanceResult {
  const m = word1.length;
  const n = word2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // Delete
          dp[i][j - 1],    // Insert
          dp[i - 1][j - 1] // Replace
        );
      }
    }
  }

  // Traceback
  const operations: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (word1[i - 1] === word2[j - 1]) {
      operations.push(`Keep '${word1[i - 1]}'`);
      i--;
      j--;
    } else {
      if (dp[i][j] === dp[i - 1][j - 1] + 1) {
        operations.push(`Replace '${word1[i - 1]}' with '${word2[j - 1]}'`);
        i--;
        j--;
      } else if (dp[i][j] === dp[i - 1][j] + 1) {
        operations.push(`Delete '${word1[i - 1]}'`);
        i--;
      } else {
        operations.push(`Insert '${word2[j - 1]}'`);
        j--;
      }
    }
  }
  while (i > 0) {
    operations.push(`Delete '${word1[i - 1]}'`);
    i--;
  }
  while (j > 0) {
    operations.push(`Insert '${word2[j - 1]}'`);
    j--;
  }

  return {
    distance: dp[m][n],
    matrix: dp,
    operations: operations.reverse()
  };
}

export interface LCSResult {
  length: number;
  matrix: number[][];
  lcs: string;
}

export function longestCommonSubsequence(word1: string, word2: string): LCSResult {
  const m = word1.length;
  const n = word2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Traceback
  let i = m, j = n;
  let lcs = "";
  while (i > 0 && j > 0) {
    if (word1[i - 1] === word2[j - 1]) {
      lcs = word1[i - 1] + lcs;
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return {
    length: dp[m][n],
    matrix: dp,
    lcs
  };
}

export interface TSPResult {
  minCost: number;
  path: number[];
  dpTable: Record<string, number>;
}

export function tsp(graph: number[][]): TSPResult {
  const n = graph.length;
  if (n === 0) return { minCost: 0, path: [], dpTable: {} };
  
  const VISITED_ALL = (1 << n) - 1;
  const dp: number[][] = Array(1 << n).fill(0).map(() => Array(n).fill(Infinity));
  const parent: number[][] = Array(1 << n).fill(0).map(() => Array(n).fill(-1));
  
  // Start at node 0
  dp[1][0] = 0;
  
  for (let mask = 1; mask < (1 << n); mask += 2) { // Must include start node (mask bit 0 = 1)
    for (let u = 0; u < n; u++) {
      if ((mask & (1 << u)) !== 0) {
        for (let v = 0; v < n; v++) {
          if ((mask & (1 << v)) === 0 && graph[u][v] !== Infinity) {
            const nextMask = mask | (1 << v);
            const cost = dp[mask][u] + graph[u][v];
            if (cost < dp[nextMask][v]) {
              dp[nextMask][v] = cost;
              parent[nextMask][v] = u;
            }
          }
        }
      }
    }
  }
  
  let minCost = Infinity;
  let lastNode = -1;
  for (let i = 1; i < n; i++) {
    if (graph[i][0] !== Infinity && dp[VISITED_ALL][i] + graph[i][0] < minCost) {
      minCost = dp[VISITED_ALL][i] + graph[i][0];
      lastNode = i;
    }
  }
  
  const path: number[] = [];
  if (minCost !== Infinity) {
    path.push(0);
    let mask = VISITED_ALL;
    let curr = lastNode;
    while (curr !== -1 && curr !== 0) {
      path.push(curr);
      const prev = parent[mask][curr];
      mask = mask ^ (1 << curr);
      curr = prev;
    }
    path.push(0);
    path.reverse();
  }
  
  const dpTable: Record<string, number> = {};
  for (let mask = 0; mask < (1 << n); mask++) {
    for (let u = 0; u < n; u++) {
      if (dp[mask][u] !== Infinity) {
        dpTable[`Mask:${mask.toString(2).padStart(n, '0')} Node:${u}`] = dp[mask][u];
      }
    }
  }

  return { minCost, path, dpTable };
}
