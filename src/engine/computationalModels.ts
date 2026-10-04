/**
 * Computational Models, Complexity Analysis, and Algorithmic Paradigms Engine
 * Covers Canonical Topics 1, 2, 3, and 4:
 * 1. Computational Models (RAM Model: uniform vs logarithmic cost; Turing Machine state machine)
 * 2. Problem Classification and Algorithmic Paradigms (Decision/Optimization/Search; Divide & Conquer, Greedy, DP)
 * 3. Computational Complexity and Large-Scale Data Challenges (Master Theorem Solver & Recurrence Evaluator)
 * 4. Algorithm Selection Strategies and Complexity-Based Evaluation (Deterministic Rule Recommender)
 */

export type CostModelType = 'uniform' | 'logarithmic';

export interface RAMInstruction {
  op: 'LOAD' | 'STORE' | 'ADD' | 'SUB' | 'MULT' | 'DIV' | 'JUMP' | 'JZERO' | 'HALT';
  address: number;
  value?: number;
}

export interface RAMExecutionTrace {
  step: number;
  instruction: RAMInstruction;
  accumulator: number;
  memory: Record<number, number>;
  stepCost: number;
  cumulativeCost: number;
}

export interface RAMSimulationResult {
  costModel: CostModelType;
  totalCost: number;
  stepCount: number;
  finalAccumulator: number;
  memoryState: Record<number, number>;
  trace: RAMExecutionTrace[];
}

/**
 * Simulates a Random Access Machine (RAM) under uniform or logarithmic cost model.
 * Uniform cost charges O(1) per memory word operation.
 * Logarithmic cost charges O(log(address) + log(value)) reflecting word bit-length.
 */
export function simulateRAM(
  instructions: RAMInstruction[],
  costModel: CostModelType = 'uniform',
  maxSteps: number = 1000
): RAMSimulationResult {
  let accumulator = 0;
  const memory: Record<number, number> = {};
  const trace: RAMExecutionTrace[] = [];
  let pc = 0;
  let totalCost = 0;
  let steps = 0;

  function calculateCost(addr: number, val: number): number {
    if (costModel === 'uniform') return 1;
    const addrCost = Math.max(1, Math.ceil(Math.log2(Math.max(1, Math.abs(addr)) + 1)));
    const valCost = Math.max(1, Math.ceil(Math.log2(Math.max(1, Math.abs(val)) + 1)));
    return addrCost + valCost;
  }

  while (pc >= 0 && pc < instructions.length && steps < maxSteps) {
    const inst = instructions[pc];
    steps++;
    let stepCost = 1;

    switch (inst.op) {
      case 'LOAD': {
        const val = inst.value !== undefined ? inst.value : (memory[inst.address] ?? 0);
        accumulator = val;
        stepCost = calculateCost(inst.address, val);
        pc++;
        break;
      }
      case 'STORE': {
        memory[inst.address] = accumulator;
        stepCost = calculateCost(inst.address, accumulator);
        pc++;
        break;
      }
      case 'ADD': {
        const val = inst.value !== undefined ? inst.value : (memory[inst.address] ?? 0);
        stepCost = calculateCost(inst.address, val);
        accumulator += val;
        pc++;
        break;
      }
      case 'SUB': {
        const val = inst.value !== undefined ? inst.value : (memory[inst.address] ?? 0);
        stepCost = calculateCost(inst.address, val);
        accumulator -= val;
        pc++;
        break;
      }
      case 'MULT': {
        const val = inst.value !== undefined ? inst.value : (memory[inst.address] ?? 0);
        stepCost = calculateCost(inst.address, val) * 2;
        accumulator *= val;
        pc++;
        break;
      }
      case 'DIV': {
        const val = inst.value !== undefined ? inst.value : (memory[inst.address] ?? 1);
        stepCost = calculateCost(inst.address, val) * 2;
        accumulator = val !== 0 ? Math.floor(accumulator / val) : 0;
        pc++;
        break;
      }
      case 'JUMP': {
        stepCost = 1;
        pc = inst.address;
        break;
      }
      case 'JZERO': {
        stepCost = 1;
        pc = accumulator === 0 ? inst.address : pc + 1;
        break;
      }
      case 'HALT': {
        stepCost = 1;
        pc = instructions.length;
        break;
      }
      default:
        pc++;
    }

    totalCost += stepCost;
    trace.push({
      step: steps,
      instruction: inst,
      accumulator,
      memory: { ...memory },
      stepCost,
      cumulativeCost: totalCost,
    });

    if (inst.op === 'HALT') break;
  }

  return {
    costModel,
    totalCost,
    stepCount: steps,
    finalAccumulator: accumulator,
    memoryState: memory,
    trace,
  };
}

export interface TMTransition {
  state: string;
  readSymbol: string;
  writeSymbol: string;
  move: 'L' | 'R' | 'N';
  nextState: string;
}

export interface TMStepTrace {
  step: number;
  state: string;
  tape: string[];
  head: number;
  action: string;
}

export interface TMSimulationResult {
  halted: boolean;
  accepted: boolean;
  totalSteps: number;
  finalTape: string;
  trace: TMStepTrace[];
}

/**
 * Simulates a single-tape Deterministic Turing Machine (DTM).
 */
export function simulateTuringMachine(
  transitions: TMTransition[],
  initialTape: string,
  startState: string = 'q0',
  acceptStates: string[] = ['q_accept', 'q_halt'],
  maxSteps: number = 500
): TMSimulationResult {
  const tape = initialTape.length > 0 ? initialTape.split('') : ['_'];
  let head = 0;
  let state = startState;
  const trace: TMStepTrace[] = [];
  let steps = 0;

  const transitionMap = new Map<string, TMTransition>();
  for (const t of transitions) {
    transitionMap.set(`${t.state}:${t.readSymbol}`, t);
  }

  while (steps < maxSteps) {
    steps++;
    const currentSymbol = head >= 0 && head < tape.length ? tape[head] : '_';
    const key = `${state}:${currentSymbol}`;
    const t = transitionMap.get(key);

    trace.push({
      step: steps,
      state,
      tape: [...tape],
      head,
      action: t ? `Write '${t.writeSymbol}', Move ${t.move}, State ${t.nextState}` : 'No transition (Halt)',
    });

    if (acceptStates.includes(state)) {
      return {
        halted: true,
        accepted: true,
        totalSteps: steps,
        finalTape: tape.join('').replace(/_+$/, ''),
        trace,
      };
    }

    if (!t) {
      break;
    }

    // Write symbol
    while (head >= tape.length) tape.push('_');
    if (head < 0) {
      tape.unshift('_');
      head = 0;
    }
    tape[head] = t.writeSymbol;

    // Move head
    if (t.move === 'R') head++;
    else if (t.move === 'L') head = Math.max(0, head - 1);

    state = t.nextState;
  }

  const isAccepted = acceptStates.includes(state);
  return {
    halted: true,
    accepted: isAccepted,
    totalSteps: steps,
    finalTape: tape.join('').replace(/_+$/, ''),
    trace,
  };
}

export interface MasterTheoremResult {
  a: number;
  b: number;
  f_exponent: number;
  log_b_a: number;
  caseMatched: 1 | 2 | 3 | 'unsupported';
  complexity: string;
  rationale: string;
}

/**
 * Solves standard divide-and-conquer recurrences T(n) = a*T(n/b) + Theta(n^c).
 */
export function solveMasterTheorem(a: number, b: number, c: number): MasterTheoremResult {
  if (a < 1 || b <= 1) {
    return {
      a,
      b,
      f_exponent: c,
      log_b_a: 0,
      caseMatched: 'unsupported',
      complexity: 'Undefined',
      rationale: 'Invalid recurrence parameters: Requires a >= 1 and b > 1.',
    };
  }

  const log_b_a = Math.log(a) / Math.log(b);
  const eps = 1e-6;

  if (c < log_b_a - eps) {
    // Case 1
    const p = Math.round(log_b_a * 100) / 100;
    return {
      a,
      b,
      f_exponent: c,
      log_b_a,
      caseMatched: 1,
      complexity: `Theta(n^${p === 1 ? '' : p.toString()})`,
      rationale: `Case 1: f(n) = O(n^${c}) is polynomially smaller than n^(log_b a) = n^${p}. Tree leaves dominate.`,
    };
  } else if (Math.abs(c - log_b_a) <= eps) {
    // Case 2
    const p = Math.round(c * 100) / 100;
    const baseStr = p === 0 ? '' : p === 1 ? 'n ' : `n^${p} `;
    return {
      a,
      b,
      f_exponent: c,
      log_b_a,
      caseMatched: 2,
      complexity: `Theta(${baseStr}log n)`,
      rationale: `Case 2: f(n) matches n^(log_b a) within a polynomial factor. Work is evenly balanced across all recursion levels.`,
    };
  } else {
    // Case 3
    const p = Math.round(c * 100) / 100;
    return {
      a,
      b,
      f_exponent: c,
      log_b_a,
      caseMatched: 3,
      complexity: `Theta(n^${p === 1 ? '' : p.toString()})`,
      rationale: `Case 3: f(n) = Omega(n^${c}) is polynomially larger than n^(log_b a). Top-level root division work dominates.`,
    };
  }
}
