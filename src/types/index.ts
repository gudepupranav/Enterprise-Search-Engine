export type SearchAlgorithmId = 'auto' | 'naive' | 'kmp' | 'rabin' | 'z' | 'suffix-array';

export interface SearchResult {
  algorithmName: string;
  pattern: string;
  matches: number[];
  positions: number[];
  matchCount: number;
  executionTimeMs: number;
  comparisons: number;
  timeComplexity: string;
  spaceComplexity: string;
}

export interface StepVisualization {
  type: string;
  description: string;
  state: any;
}

export interface DocumentToken {
  value: string;
  normalized: string;
  start: number;
  end: number;
  index: number;
}

export interface ComparisonRecord {
  id: string;
  docAName: string;
  docBName: string;
  similarityScore: number;
  editDistance: number;
  lcsLength: number;
  alignmentMethod: 'Wagner-Fischer' | 'Needleman-Wunsch' | 'Smith-Waterman';
  timestamp: number;
}

export interface SearchQueryHistoryItem {
  id: string;
  query: string;
  docName: string;
  matchCount: number;
  executionTimeMs: number;
  algorithmName: string;
  comparisons: number;
  timestamp: number;
}
