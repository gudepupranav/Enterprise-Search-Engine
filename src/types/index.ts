export interface SearchResult {
  pattern: string;
  matches: number[];
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
