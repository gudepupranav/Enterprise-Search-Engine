import type { SearchResult } from '../types';

function buildSearchResult(input: Omit<SearchResult, 'positions' | 'matchCount'>): SearchResult {
  return {
    ...input,
    positions: input.matches,
    matchCount: input.matches.length,
  };
}

export function naiveSearch(text: string, pattern: string): SearchResult {
  const t0 = performance.now();
  const matches: number[] = [];
  let comparisons = 0;

  const n = text.length;
  const m = pattern.length;

  if (m === 0) return buildSearchResult({ algorithmName: 'Naive Search', pattern, matches, executionTimeMs: 0, comparisons: 0, timeComplexity: 'O(N*M)', spaceComplexity: 'O(1)' });

  for (let i = 0; i <= n - m; i++) {
    let j = 0;
    while (j < m) {
      comparisons++;
      if (text[i + j] !== pattern[j]) {
        break;
      }
      j++;
    }
    if (j === m) {
      matches.push(i);
    }
  }

  const t1 = performance.now();
  
  return buildSearchResult({
    algorithmName: 'Naive Search',
    pattern,
    matches,
    executionTimeMs: t1 - t0,
    comparisons,
    timeComplexity: 'O(N*M)',
    spaceComplexity: 'O(1)'
  });
}

export function computeLPSArray(pattern: string): number[] {
  const m = pattern.length;
  const lps = new Array(m).fill(0);
  let length = 0;
  let i = 1;

  while (i < m) {
    if (pattern[i] === pattern[length]) {
      length++;
      lps[i] = length;
      i++;
    } else {
      if (length !== 0) {
        length = lps[length - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
  return lps;
}

export function kmpSearch(text: string, pattern: string): SearchResult {
  const t0 = performance.now();
  const matches: number[] = [];
  let comparisons = 0;

  const n = text.length;
  const m = pattern.length;

  if (m === 0) return buildSearchResult({ algorithmName: 'KMP', pattern, matches, executionTimeMs: 0, comparisons: 0, timeComplexity: 'O(N+M)', spaceComplexity: 'O(M)' });

  const lps = computeLPSArray(pattern);

  let i = 0; 
  let j = 0; 

  while (i < n) {
    comparisons++;
    if (pattern[j] === text[i]) {
      j++;
      i++;
    }
    if (j === m) {
      matches.push(i - j);
      j = lps[j - 1];
    } else if (i < n && pattern[j] !== text[i]) {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }

  const t1 = performance.now();

  return buildSearchResult({
    algorithmName: 'KMP',
    pattern,
    matches,
    executionTimeMs: t1 - t0,
    comparisons,
    timeComplexity: 'O(N+M)',
    spaceComplexity: 'O(M)'
  });
}

export function rabinKarpSearch(text: string, pattern: string, q: number = 101): SearchResult {
  const t0 = performance.now();
  const matches: number[] = [];
  let comparisons = 0;

  const n = text.length;
  const m = pattern.length;
  const d = 256; 

  if (m === 0) return buildSearchResult({ algorithmName: 'Rabin-Karp', pattern, matches, executionTimeMs: 0, comparisons: 0, timeComplexity: 'O(N+M)', spaceComplexity: 'O(1)' });

  let i, j;
  let p = 0;
  let t = 0;
  let h = 1;

  for (i = 0; i < m - 1; i++) {
    h = (h * d) % q;
  }

  for (i = 0; i < m; i++) {
    p = (d * p + pattern.charCodeAt(i)) % q;
    t = (d * t + text.charCodeAt(i)) % q;
  }

  for (i = 0; i <= n - m; i++) {
    if (p === t) {
      for (j = 0; j < m; j++) {
        comparisons++;
        if (text[i + j] !== pattern[j]) {
          break;
        }
      }
      if (j === m) {
        matches.push(i);
      }
    }
    if (i < n - m) {
      t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
      if (t < 0) {
        t = t + q;
      }
    }
  }

  const t1 = performance.now();

  return buildSearchResult({
    algorithmName: 'Rabin-Karp',
    pattern,
    matches,
    executionTimeMs: t1 - t0,
    comparisons,
    timeComplexity: 'O(N+M) avg, O(N*M) worst',
    spaceComplexity: 'O(1)'
  });
}

export function computeZArray(str: string): number[] {
  const n = str.length;
  const Z = new Array(n).fill(0);
  let L = 0, R = 0;
  for (let i = 1; i < n; i++) {
    if (i > R) {
      L = R = i;
      while (R < n && str[R - L] === str[R]) {
        R++;
      }
      Z[i] = R - L;
      R--;
    } else {
      let k = i - L;
      if (Z[k] < R - i + 1) {
        Z[i] = Z[k];
      } else {
        L = i;
        while (R < n && str[R - L] === str[R]) {
          R++;
        }
        Z[i] = R - L;
        R--;
      }
    }
  }
  return Z;
}

export function zAlgorithmSearch(text: string, pattern: string): SearchResult {
  const t0 = performance.now();
  const matches: number[] = [];
  let comparisons = 0; // Difficult to accurately track inside the Z array construction linearly without modifying computeZArray, estimating or tracking in a custom one.
  
  const m = pattern.length;
  if (m === 0) return buildSearchResult({ algorithmName: 'Z Algorithm', pattern, matches, executionTimeMs: 0, comparisons: 0, timeComplexity: 'O(N+M)', spaceComplexity: 'O(N+M)' });

  const concat = pattern + "$" + text;
  const l = concat.length;

  const Z = new Array(l).fill(0);
  let L = 0, R = 0;
  for (let i = 1; i < l; i++) {
    if (i > R) {
      L = R = i;
      while (R < l && concat[R - L] === concat[R]) {
        comparisons++;
        R++;
      }
      if (concat[R - L] !== concat[R]) {
        comparisons++;
      }
      Z[i] = R - L;
      R--;
    } else {
      let k = i - L;
      if (Z[k] < R - i + 1) {
        Z[i] = Z[k];
      } else {
        L = i;
        while (R < l && concat[R - L] === concat[R]) {
          comparisons++;
          R++;
        }
        if (concat[R - L] !== concat[R]) {
          comparisons++;
        }
        Z[i] = R - L;
        R--;
      }
    }
  }

  for (let i = 0; i < l; ++i) {
    if (Z[i] === m) {
      matches.push(i - m - 1);
    }
  }

  const t1 = performance.now();

  return buildSearchResult({
    algorithmName: 'Z Algorithm',
    pattern,
    matches,
    executionTimeMs: t1 - t0,
    comparisons,
    timeComplexity: 'O(N+M)',
    spaceComplexity: 'O(N+M)'
  });
}
