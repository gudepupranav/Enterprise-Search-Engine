import type { SearchResult } from '../types';

export function suffixArrayMultiSearch(text: string, patterns: string[]): Record<string, SearchResult> {

  const n = text.length;

  const suffixes: { index: number, suffix: string }[] = [];
  for (let i = 0; i < n; i++) {
    suffixes.push({ index: i, suffix: text.substring(i) });
  }

  suffixes.sort((a, b) => a.suffix.localeCompare(b.suffix));
  const sa = suffixes.map(s => s.index);

  const results: Record<string, SearchResult> = {};
  
  for (const pattern of patterns) {
    let t_start = performance.now();
    let l = 0, r = n - 1;
    let first = -1;
    let comparisons = 0;

    // Binary search for first occurrence
    while (l <= r) {
      const mid = Math.floor((l + r) / 2);
      const suffix = text.substring(sa[mid]);
      const cmp = suffix.localeCompare(pattern);
      comparisons++;
      if (suffix.startsWith(pattern)) {
        first = mid;
        r = mid - 1; // Look left
      } else if (cmp < 0) {
        l = mid + 1;
      } else {
        r = mid - 1;
      }
    }

    const matches: number[] = [];
    if (first !== -1) {
      // Collect all occurrences
      let idx = first;
      while (idx < n && text.substring(sa[idx]).startsWith(pattern)) {
        matches.push(sa[idx]);
        idx++;
      }
    }

    matches.sort((a, b) => a - b);
    let t_end = performance.now();
    
    results[pattern] = {
      pattern,
      matches,
      executionTimeMs: t_end - t_start,
      comparisons,
      timeComplexity: 'O(M * log N)',
      spaceComplexity: 'O(N)'
    };
  }
  
  return results;
}
