import type { SearchResult } from '../types';

export type SuffixEntry = {
  index: number;
  suffix: string;
};

export type MultiPatternResult = SearchResult & {
  algorithmName: 'Suffix Array Multi-Pattern';
};

export function buildSuffixes(text: string): SuffixEntry[] {
  return Array.from({ length: text.length }, (_, index) => ({
    index,
    suffix: text.slice(index),
  }));
}

export function buildSuffixArray(text: string): number[] {
  return buildSuffixes(text)
    .sort((a, b) => a.suffix.localeCompare(b.suffix))
    .map(entry => entry.index);
}

export function getSortedSuffixes(text: string): SuffixEntry[] {
  return buildSuffixArray(text).map(index => ({ index, suffix: text.slice(index) }));
}

export function buildLCPArray(text: string, suffixArray: number[]): number[] {
  const n = text.length;
  if (n === 0 || suffixArray.length === 0) return [];

  const rank = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    rank[suffixArray[i]] = i;
  }

  let h = 0;
  const lcp = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    if (rank[i] > 0) {
      const k = suffixArray[rank[i] - 1];
      while (i + h < n && k + h < n && text[i + h] === text[k + h]) {
        h++;
      }
      lcp[rank[i]] = h;
      if (h > 0) h--;
    }
  }

  return lcp;
}

export function searchSuffixArray(text: string, suffixArray: number[], pattern: string): SearchResult {
  const t0 = performance.now();
  const matches: number[] = [];
  let comparisons = 0;
  const n = suffixArray.length;

  if (!pattern) {
    return {
      algorithmName: 'Suffix Array Search',
      pattern,
      matches,
      positions: matches,
      matchCount: 0,
      executionTimeMs: 0,
      comparisons: 0,
      timeComplexity: 'O(M*logN + K)',
      spaceComplexity: 'O(N)',
    };
  }

  let left = 0;
  let right = n - 1;
  let first = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const suffix = text.slice(suffixArray[mid]);
    const prefix = suffix.slice(0, pattern.length);
    const cmp = prefix.localeCompare(pattern);
    comparisons++;

    if (cmp >= 0) {
      if (cmp === 0) first = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  if (first !== -1) {
    let cursor = first;
    while (cursor < n && text.slice(suffixArray[cursor]).startsWith(pattern)) {
      comparisons++;
      matches.push(suffixArray[cursor]);
      cursor++;
    }
  }

  matches.sort((a, b) => a - b);
  const t1 = performance.now();

  return {
    algorithmName: 'Suffix Array Search',
    pattern,
    matches,
    positions: matches,
    matchCount: matches.length,
    executionTimeMs: t1 - t0,
    comparisons,
    timeComplexity: 'O(M*logN + K)',
    spaceComplexity: 'O(N)',
  };
}

export function suffixArrayMultiSearch(text: string, patterns: string[]): Record<string, MultiPatternResult> {
  const suffixArray = buildSuffixArray(text);
  const results: Record<string, MultiPatternResult> = {};

  for (const pattern of patterns.filter(Boolean)) {
    const result = searchSuffixArray(text, suffixArray, pattern);
    results[pattern] = {
      ...result,
      algorithmName: 'Suffix Array Multi-Pattern',
      timeComplexity: 'O(P*M*logN + K)',
      spaceComplexity: 'O(N + P)',
    };
  }

  return results;
}

export function runNaiveMultiPatternSearch(text: string, patterns: string[]): Record<string, MultiPatternResult> {
  const results: Record<string, MultiPatternResult> = {};
  for (const pattern of patterns.filter(Boolean)) {
    const t0 = performance.now();
    const matches: number[] = [];
    let comparisons = 0;

    for (let i = 0; i <= text.length - pattern.length; i++) {
      let j = 0;
      while (j < pattern.length) {
        comparisons++;
        if (text[i + j] !== pattern[j]) break;
        j++;
      }
      if (j === pattern.length) matches.push(i);
    }

    const t1 = performance.now();
    results[pattern] = {
      algorithmName: 'Suffix Array Multi-Pattern',
      pattern,
      matches,
      positions: matches,
      matchCount: matches.length,
      executionTimeMs: t1 - t0,
      comparisons,
      timeComplexity: 'O(P*N*M)',
      spaceComplexity: 'O(P)',
    };
  }

  return results;
}
