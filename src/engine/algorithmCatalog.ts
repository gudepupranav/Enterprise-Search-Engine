import type { SearchAlgorithmId, SearchResult } from '../types';
import { kmpSearch, naiveSearch, rabinKarpSearch, zAlgorithmSearch } from './stringSearch';
import { buildSuffixArray, searchSuffixArray } from './multiPattern';

export type SearchMode = 'single' | 'repeated' | 'multi-pattern';

export type AlgorithmMetadata = {
  id: SearchAlgorithmId;
  name: string;
  paradigm: 'Brute Force' | 'Dynamic Programming' | 'String Matching' | 'Suffix Structures';
  summary: string;
  timeComplexity: string;
  spaceComplexity: string;
  bestCase?: string;
  averageCase?: string;
  worstCase?: string;
};

export const algorithmCatalog: AlgorithmMetadata[] = [
  {
    id: 'kmp',
    name: 'Knuth-Morris-Pratt (KMP)',
    paradigm: 'Dynamic Programming',
    summary: 'Precomputes the Longest Prefix Suffix (LPS) array to achieve linear search with zero backtracking.',
    timeComplexity: 'O(N + M)',
    spaceComplexity: 'O(M)',
    bestCase: 'O(N + M)',
    averageCase: 'O(N + M)',
    worstCase: 'O(N + M)',
  },
  {
    id: 'rabin',
    name: 'Rabin-Karp Rolling Hash',
    paradigm: 'String Matching',
    summary: 'Computes rolling polynomial hashes across sliding windows, verifying candidate matches character-by-character.',
    timeComplexity: 'O(N + M) avg, O(N * M) worst',
    spaceComplexity: 'O(1)',
    bestCase: 'O(N + M)',
    averageCase: 'O(N + M)',
    worstCase: 'O(N * M) with spurious hash collisions',
  },
  {
    id: 'z',
    name: 'Z-Algorithm',
    paradigm: 'String Matching',
    summary: 'Builds a Z-box array mapping the longest substring starting at each position matching the pattern prefix.',
    timeComplexity: 'O(N + M)',
    spaceComplexity: 'O(N + M)',
    bestCase: 'O(N + M)',
    averageCase: 'O(N + M)',
    worstCase: 'O(N + M)',
  },
  {
    id: 'suffix-array',
    name: 'Suffix Array (Binary Search)',
    paradigm: 'Suffix Structures',
    summary: 'Constructs a lexicographically sorted suffix index to search any pattern in logarithmic time.',
    timeComplexity: 'O(M * log N + K)',
    spaceComplexity: 'O(N)',
    bestCase: 'O(M * log N)',
    averageCase: 'O(M * log N + K)',
    worstCase: 'O(M * log N + K)',
  },
  {
    id: 'naive',
    name: 'Naïve Scan',
    paradigm: 'Brute Force',
    summary: 'Direct sliding window character comparison. Baseline verification model without auxiliary index precomputation.',
    timeComplexity: 'O(N * M)',
    spaceComplexity: 'O(1)',
    bestCase: 'O(N) when mismatches occur immediately',
    averageCase: 'O(N * M) upper-bound for direct comparison',
    worstCase: 'O(N * M)',
  },
];

export function getAlgorithmMetadata(id: SearchAlgorithmId): AlgorithmMetadata {
  return algorithmCatalog.find(item => item.id === id) ?? algorithmCatalog[0];
}

export function runSearchAlgorithm(id: SearchAlgorithmId, text: string, pattern: string): SearchResult {
  switch (id) {
    case 'naive':
      return naiveSearch(text, pattern);
    case 'rabin':
      return rabinKarpSearch(text, pattern);
    case 'z':
      return zAlgorithmSearch(text, pattern);
    case 'suffix-array': {
      const sa = buildSuffixArray(text);
      return searchSuffixArray(text, sa, pattern);
    }
    case 'kmp':
    default:
      return kmpSearch(text, pattern);
  }
}

export function estimateSearchMemoryBytes(id: SearchAlgorithmId, textLength: number, patternLength: number): number {
  if (id === 'kmp') return patternLength * 8;
  if (id === 'z') return (textLength + patternLength + 1) * 8;
  if (id === 'suffix-array') return textLength * 8;
  return 0;
}

export function recommendAlgorithm(input: {
  documentSize: number;
  patternLength: number;
  numberOfPatterns: number;
  mode: SearchMode;
}): { algorithm: AlgorithmMetadata; reason: string } {
  const { documentSize, patternLength, numberOfPatterns, mode } = input;

  if (numberOfPatterns > 1 || mode === 'multi-pattern') {
    return {
      algorithm: getAlgorithmMetadata('suffix-array'),
      reason: 'Suffix Array indexes the document once, enabling sub-millisecond logarithmic binary search across multiple pattern queries without repeatedly scanning the raw corpus.',
    };
  }

  if (patternLength <= 2 && documentSize <= 5000 && mode === 'single') {
    return {
      algorithm: getAlgorithmMetadata('naive'),
      reason: 'For very small patterns in short documents, zero preprocessing overhead makes direct sliding window comparison fast and memory-free.',
    };
  }

  if (documentSize > 50000 || patternLength > 8) {
    return {
      algorithm: getAlgorithmMetadata('kmp'),
      reason: 'Longer patterns or medium-to-large documents benefit from KMP’s precomputed LPS table, ensuring guaranteed linear execution with zero character backtracking.',
    };
  }

  return {
    algorithm: getAlgorithmMetadata('z'),
    reason: 'The Z-Algorithm computes exact prefix-match boxes across the concatenated payload in a single unified linear pass, optimal for standard document queries.',
  };
}
