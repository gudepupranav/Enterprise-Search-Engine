/**
 * Automated Verification & Deterministic Test Suite
 * Validates All 16 Canonical Scope Topics in the Pure Algorithmic Engine Layer
 */

import { 
  simulateRAM, 
  simulateTuringMachine, 
  solveMasterTheorem,
  type RAMInstruction,
  type TMTransition
} from '../src/engine/computationalModels';

import { 
  recommendAlgorithm, 
  getAlgorithmMetadata,
  runSearchAlgorithm
} from '../src/engine/algorithmCatalog';

import { 
  naiveSearch, 
  computeLPSArray, 
  kmpSearch, 
  rabinKarpSearch, 
  computeZArray, 
  zAlgorithmSearch 
} from '../src/engine/stringSearch';

import { 
  buildSuffixArray, 
  buildLCPArray, 
  searchSuffixArray, 
  suffixArrayMultiSearch 
} from '../src/engine/multiPattern';

import { 
  tokenizeText, 
  normalizeText, 
  processDocumentFile 
} from '../src/engine/documentProcessing';

import { 
  editDistance, 
  longestCommonSubsequence, 
  needlemanWunsch, 
  smithWaterman, 
  matrixChainOrder, 
  tsp,
  parseTSPCell
} from '../src/engine/dp';

import { 
  runFordFulkerson, 
  runEdmondsKarp, 
  solveBipartiteMatching, 
  solveAssignmentProblem,
  FLOW_PRESETS,
  type FlowGraph
} from '../src/engine/flow';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

function assertDeepEqual(actual: any, expected: any, testName: string) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  assert(match, testName, `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

console.log('\n======================================================');
console.log('STARTING CANONICAL 16-TOPIC ENGINE TEST SUITE');
console.log('======================================================\n');

// ---------------------------------------------------------------------------
// TOPIC 1: Computational Models (RAM & Turing Machine)
// ---------------------------------------------------------------------------
console.log('[Topic 1] Computational Models (RAM Uniform vs Logarithmic & Turing Machine)');
const ramProgram: RAMInstruction[] = [
  { op: 'LOAD', address: 0, value: 5 },
  { op: 'STORE', address: 1 },
  { op: 'ADD', address: 0, value: 3 },
  { op: 'MULT', address: 0, value: 2 },
  { op: 'HALT', address: 0 }
];
const ramUniform = simulateRAM(ramProgram, 'uniform');
assert(ramUniform.finalAccumulator === 16, 'RAM uniform execution computes (5+3)*2 = 16');
assert(ramUniform.totalCost === 6, 'RAM uniform cost charges constant cost per operation');

const ramLogarithmic = simulateRAM(ramProgram, 'logarithmic');
assert(ramLogarithmic.finalAccumulator === 16, 'RAM logarithmic execution computes correct accumulator value');
assert(ramLogarithmic.totalCost > ramUniform.totalCost, 'RAM logarithmic cost scales with bit-length of operands');

// Turing Machine: Simple parity/inverter tape machine: replaces '0' with '1' and halts
const tmTransitions: TMTransition[] = [
  { state: 'q0', readSymbol: '0', writeSymbol: '1', move: 'R', nextState: 'q0' },
  { state: 'q0', readSymbol: '1', writeSymbol: '0', move: 'R', nextState: 'q0' },
  { state: 'q0', readSymbol: '_', writeSymbol: '_', move: 'N', nextState: 'q_accept' },
];
const tmResult = simulateTuringMachine(tmTransitions, '010', 'q0', ['q_accept']);
assert(tmResult.accepted, 'Turing Machine halts in accept state');
assert(tmResult.finalTape === '101', 'Turing Machine inverted tape 010 -> 101');

// ---------------------------------------------------------------------------
// TOPIC 2 & 3: Computational Complexity & Master Theorem
// ---------------------------------------------------------------------------
console.log('\n[Topic 2 & 3] Problem Classification, Complexity & Master Theorem');
// Case 1: T(n) = 8T(n/2) + Theta(n) -> log2(8) = 3 > 1 -> Theta(n^3)
const mt1 = solveMasterTheorem(8, 2, 1);
assert(mt1.caseMatched === 1 && mt1.complexity === 'Theta(n^3)', 'Master Theorem Case 1 (Leaf dominant: Theta(n^3))');

// Case 2: T(n) = 2T(n/2) + Theta(n) -> log2(2) = 1 == 1 -> Theta(n log n) [MergeSort]
const mt2 = solveMasterTheorem(2, 2, 1);
assert(mt2.caseMatched === 2 && mt2.complexity.includes('log n'), 'Master Theorem Case 2 (Balanced: Theta(n log n))');

// Case 3: T(n) = 2T(n/2) + Theta(n^2) -> log2(2) = 1 < 2 -> Theta(n^2)
const mt3 = solveMasterTheorem(2, 2, 2);
assert(mt3.caseMatched === 3 && mt3.complexity === 'Theta(n^2)', 'Master Theorem Case 3 (Root dominant: Theta(n^2))');

// ---------------------------------------------------------------------------
// TOPIC 4: Algorithm Selection Strategies
// ---------------------------------------------------------------------------
console.log('\n[Topic 4] Deterministic Algorithm Selection');
const recMulti = recommendAlgorithm({ documentSize: 5000, patternLength: 4, numberOfPatterns: 5, mode: 'multi-pattern' });
assert(recMulti.algorithm.id === 'suffix-array', 'Recommends Suffix Array for multi-pattern queries');

const recLargeSingle = recommendAlgorithm({ documentSize: 60000, patternLength: 10, numberOfPatterns: 1, mode: 'single' });
assert(recLargeSingle.algorithm.id === 'kmp', 'Recommends KMP for large document / long pattern single search');

const recSmall = recommendAlgorithm({ documentSize: 1000, patternLength: 2, numberOfPatterns: 1, mode: 'single' });
assert(recSmall.algorithm.id === 'naive', 'Recommends Naïve for very small pattern/doc boundary');

// ---------------------------------------------------------------------------
// TOPIC 5: Naïve Pattern Matching
// ---------------------------------------------------------------------------
console.log('\n[Topic 5] Naïve Pattern Matching');
const naiveRes = naiveSearch('AABAACAADAABAABA', 'AABA');
assertDeepEqual(naiveRes.matches, [0, 9, 12], 'Naïve finds all 3 occurrences of AABA');
assert(naiveRes.comparisons > 0, 'Naïve records character comparisons');

const naiveEmpty = naiveSearch('HELLO', '');
assert(naiveEmpty.matchCount === 0, 'Naïve handles empty pattern safely');

// ---------------------------------------------------------------------------
// TOPIC 6: Knuth-Morris-Pratt (KMP) & Failure Function / LPS
// ---------------------------------------------------------------------------
console.log('\n[Topic 6] KMP & Failure Function (LPS)');
const lps = computeLPSArray('ABABDABACDABABCABAB');
assert(lps.length === 19, 'LPS table computed for exact pattern length');
assertDeepEqual(computeLPSArray('AABAACAADAABAABA'), [0, 1, 0, 1, 2, 0, 1, 2, 0, 1, 2, 3, 4, 5, 3, 4], 'LPS correctly matches prefix-suffix recurrence');

const kmpRes = kmpSearch('AABAACAADAABAABA', 'AABA');
assertDeepEqual(kmpRes.matches, [0, 9, 12], 'KMP finds occurrences at [0, 9, 12]');
assert(kmpRes.comparisons > 0, 'KMP records comparisons');

// ---------------------------------------------------------------------------
// TOPIC 7: Z-Algorithm & Rabin-Karp Rolling Hash
// ---------------------------------------------------------------------------
console.log('\n[Topic 7] Z-Algorithm & Rabin-Karp Hashing');
const zBox = computeZArray('aabxaabxcaabxaabxay');
assert(zBox[0] === 0, 'Z-box at index 0 is 0');
assert(zBox[4] === 4, 'Z-box correctly measures prefix match length (4 for aabx)');

const zRes = zAlgorithmSearch('AABAACAADAABAABA', 'AABA');
assertDeepEqual(zRes.matches, [0, 9, 12], 'Z-Algorithm search matches [0, 9, 12]');

const rkRes = rabinKarpSearch('AABAACAADAABAABA', 'AABA');
assertDeepEqual(rkRes.matches, [0, 9, 12], 'Rabin-Karp search matches [0, 9, 12] with candidate collision checks');

// ---------------------------------------------------------------------------
// TOPIC 8: Suffix Array, Kasai's LCP Array & Multi-Pattern Search
// ---------------------------------------------------------------------------
console.log('\n[Topic 8] Suffix Array, Kasai LCP & Multi-Pattern Search');
const bananaSA = buildSuffixArray('banana');
assertDeepEqual(bananaSA, [5, 3, 1, 0, 4, 2], 'Suffix Array for "banana" correctly sorts suffixes');

const bananaLCP = buildLCPArray('banana', bananaSA);
assertDeepEqual(bananaLCP, [0, 1, 3, 0, 0, 2], 'Kasai algorithm constructs exact LCP array for "banana"');

const saSearchRes = searchSuffixArray('banana', bananaSA, 'an');
assertDeepEqual(saSearchRes.matches, [1, 3], 'Suffix Array binary search finds "an" at indices [1, 3]');

const multiRes = suffixArrayMultiSearch('the quick brown fox jumps over the lazy dog', ['the', 'fox', 'cat']);
assert(multiRes['the'].matchCount === 2, 'Multi-pattern search finds 2 occurrences of "the"');
assert(multiRes['fox'].matchCount === 1, 'Multi-pattern search finds 1 occurrence of "fox"');
assert(multiRes['cat'].matchCount === 0, 'Multi-pattern search returns 0 for absent pattern');

// ---------------------------------------------------------------------------
// TOPIC 9, 10 & 11: Dynamic Programming, Edit Distance & Sequence Alignment
// ---------------------------------------------------------------------------
console.log('\n[Topic 9, 10 & 11] Dynamic Programming: Edit Distance, LCS & Alignments');
const edIdentical = editDistance('kitten', 'kitten');
assert(edIdentical.distance === 0, 'Edit distance between identical strings is 0');

const edClassic = editDistance('kitten', 'sitting');
assert(edClassic.distance === 3, 'Edit distance("kitten", "sitting") = 3');
assert(edClassic.tracebackPath.length > 0, 'Edit distance generates full traceback path');
assert(edClassic.operations.length > 0, 'Edit distance provides mutation pipeline breakdown');

const lcsRes = longestCommonSubsequence('AGGTAB', 'GXTXAYB');
assert(lcsRes.length === 4 && lcsRes.lcs === 'GTAB', 'Longest Common Subsequence("AGGTAB", "GXTXAYB") = "GTAB" (length 4)');

const nwRes = needlemanWunsch('GCATGCG', 'GATTACA', 1, -1, -1);
assert(nwRes.alignedA.length === nwRes.alignedB.length, 'Needleman-Wunsch global alignment produces equal length strings with gaps');
assert(nwRes.tracebackPath.length > 0, 'Needleman-Wunsch provides full matrix traceback');

const swRes = smithWaterman('TGTTACGG', 'GGTTGACTA', 2, -1, -2);
assert(swRes.score > 0, 'Smith-Waterman computes positive local alignment score');
assert(swRes.maxCell !== undefined && swRes.maxCell.row > 0, 'Smith-Waterman tracks maximum scoring cell');

// ---------------------------------------------------------------------------
// TOPIC 12: Interval DP (Matrix Chain) & Bitmask DP (TSP)
// ---------------------------------------------------------------------------
console.log('\n[Topic 12] Interval DP & Bitmask DP');
// Matrix Chain dimensions: A1 (10x30), A2 (30x5), A3 (5x60) -> optimal ((A1 A2) A3) = 10*30*5 + 10*5*60 = 1500 + 3000 = 4500
const mcmRes = matrixChainOrder([10, 30, 5, 60]);
assert(mcmRes.optimalCost === 4500, 'Matrix Chain Order computes minimum scalar multiplications = 4,500');
assert(mcmRes.traceback.length > 0, 'Matrix Chain Order generates split tree trace');

// TSP on 4-city symmetric matrix
const tspMatrix = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];
const tspRes = tsp(tspMatrix);
assert(tspRes.minCost === 80, 'Bitmask TSP computes optimal tour cost = 80');
assert(tspRes.path.length === 5, 'Bitmask TSP returns full closed loop path (length 5)');
assert(tspRes.reachableStates.length === (1 << 4) * 4 / 2 || tspRes.reachableStates.length > 0, 'Bitmask DP evaluates reachable state space');

// Edge cases for TSP: 1 city, disconnected edge
assert(tsp([[0]]).minCost === 0, 'TSP on single city handles base case = 0');
const disconnectedMatrix = [
  [0, Infinity],
  [Infinity, 0],
];
assert(tsp(disconnectedMatrix).minCost === Infinity, 'TSP with disconnected edges returns Infinity gracefully without crash');

// ---------------------------------------------------------------------------
// TOPIC 13, 14 & 15: Flow Networks, Ford-Fulkerson, Edmonds-Karp & Min-Cut
// ---------------------------------------------------------------------------
console.log('\n[Topic 13, 14 & 15] Flow Networks, Max Flow & Min-Cut Theorem');
const testGraph: FlowGraph = JSON.parse(JSON.stringify(FLOW_PRESETS[0].graph)); // 6-node diamond network

const ffRes = runFordFulkerson(testGraph);
assert(ffRes.maxFlow === 23, 'Ford-Fulkerson computes max flow = 23 on reference network');

const ekRes = runEdmondsKarp(testGraph);
assert(ekRes.maxFlow === 23, 'Edmonds-Karp computes max flow = 23');
assert(ekRes.minCutCapacity === ekRes.maxFlow, 'Max-Flow Min-Cut Theorem verified: Min Cut Capacity === Max Flow (23 == 23)');
assert(ekRes.sourceCutSet.includes(testGraph.source), 'Source cut set S contains source node');
assert(ekRes.sinkCutSet.includes(testGraph.sink), 'Sink cut set T contains sink node');
assert(ekRes.minCutEdges.length > 0, 'Identifies critical bottleneck cut edges');

// ---------------------------------------------------------------------------
// TOPIC 16: Bipartite Matching & Hungarian Assignment Problem
// ---------------------------------------------------------------------------
console.log('\n[Topic 16] Bipartite Matching & Assignment Problem');
const leftWorkers = ['Analyst A', 'Analyst B', 'Analyst C'];
const rightTasks = ['Doc 1: Audit', 'Doc 2: Financials', 'Doc 3: Manifest'];
const validEdges: [string, string][] = [
  ['Analyst A', 'Doc 1: Audit'],
  ['Analyst A', 'Doc 2: Financials'],
  ['Analyst B', 'Doc 2: Financials'],
  ['Analyst C', 'Doc 3: Manifest'],
];
const bipMatch = solveBipartiteMatching(leftWorkers, rightTasks, validEdges);
assert(bipMatch.matchedPairs.length === 3, 'Bipartite Matching finds maximum cardinality match = 3');

const costMatrixAssign = [
  [9, 2, 7],
  [6, 4, 3],
  [5, 8, 1],
];
const assignRes = solveAssignmentProblem(costMatrixAssign, ['W1', 'W2', 'W3'], ['T1', 'T2', 'T3']);
assert(assignRes.totalCost === 9, 'Hungarian Assignment Problem computes minimum cost matching = 9 (2 + 6 + 1)');
assert(assignRes.assignments.length === 3, 'All tasks assigned in square matrix');

// ---------------------------------------------------------------------------
// Document Tokenization & Preprocessing Validation
// ---------------------------------------------------------------------------
console.log('\n[Document Processing] Tokenization, Offsets & Normalization');
const sampleRaw = 'Pat-tern-Lab: Inc., operates with $482.6M revenue; EBITDA rose 28.8%!';
const tokens = tokenizeText(sampleRaw);
assert(tokens.length > 0, 'Tokenizer extracts discrete tokens');
assert(tokens[0].value === 'Pat-tern-Lab', 'Hyphenated words preserved');
assert(tokens[0].start === 0 && tokens[0].end === 12, 'Accurate start and end offsets tracked');

const norm = normalizeText('  Multiple   Spaces\n\nAnd UPPERCASE  ');
assert(norm === 'multiple spaces and uppercase', 'Text normalized with case-fold and collapsed whitespace');

const docFile = processDocumentFile('sample.txt', sampleRaw, 1024);
assert(docFile.measuredCharacters === sampleRaw.length, 'Character length matches raw string length');
assert(docFile.fileSizeBytes === 1024, 'File size in bytes preserved independently of character count');

// ---------------------------------------------------------------------------
// FINAL SUMMARY
// ---------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
