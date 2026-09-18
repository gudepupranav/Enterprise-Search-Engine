import { useState, useEffect, useMemo } from 'react';
import { Play, SkipForward, SkipBack, RotateCcw, Pause } from 'lucide-react';
import { computeLPSArray } from '../engine/stringSearch';

type KMPStep = {
  i: number;
  j: number;
  match: boolean;
  message: string;
  found: boolean;
};

function generateKMPTrace(text: string, pattern: string, lps: number[]): KMPStep[] {
  const steps: KMPStep[] = [];
  if (!pattern || !text) return steps;
  
  let i = 0; 
  let j = 0; 
  
  steps.push({ i: 0, j: 0, match: false, message: 'Starting search...', found: false });

  while (i < text.length) {
    if (pattern[j] === text[i]) {
      steps.push({ i, j, match: true, message: `Match at text[${i}] and pattern[${j}] ('${text[i]}')`, found: false });
      i++;
      j++;
    } else {
      steps.push({ i, j, match: false, message: `Mismatch at text[${i}] ('${text[i]}') and pattern[${j}] ('${pattern[j]}')`, found: false });
      if (j !== 0) {
        j = lps[j - 1];
        steps.push({ i, j, match: false, message: `Fallback: updating pattern index j to lps[${j}] = ${j}`, found: false });
      } else {
        i++;
      }
    }
    
    if (j === pattern.length) {
      steps.push({ i: i - 1, j: j - 1, match: true, message: `Pattern found at index ${i - j}`, found: true });
      j = lps[j - 1];
    }
  }
  
  steps.push({ i: Math.min(i, text.length - 1), j: 0, match: false, message: 'Search complete.', found: false });
  return steps;
}

export default function AlgorithmLab() {
  const [text, setText] = useState('ABABDABACDABABCABAB');
  const [pattern, setPattern] = useState('ABABCABAB');
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const lps = useMemo(() => computeLPSArray(pattern), [pattern]);
  const trace = useMemo(() => generateKMPTrace(text, pattern, lps), [text, pattern, lps]);
  
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [trace]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && stepIndex < trace.length - 1) {
      timer = setTimeout(() => {
        setStepIndex(s => s + 1);
      }, 800);
    } else if (stepIndex >= trace.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, trace.length]);

  const currentStep = trace[stepIndex] || { i: 0, j: 0, match: false, message: '', found: false };
  const offset = Math.max(0, currentStep.i - currentStep.j);

  return (
    <div className="py-6 flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
        <h2 className="text-lg font-bold mb-4">String Matching Visualizer (KMP)</h2>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-outline uppercase">Text Buffer</label>
            <input 
              type="text" 
              value={text} 
              onChange={e => setText(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-md font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-outline uppercase">Pattern</label>
            <input 
              type="text" 
              value={pattern} 
              onChange={e => setPattern(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-md font-mono"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 font-mono overflow-x-auto">
        <h3 className="font-semibold mb-4 text-primary">LPS Array (Failure Function)</h3>
        <div className="flex gap-2">
          {pattern.split('').map((char, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-10 h-10 flex items-center justify-center border font-bold ${
                i === currentStep.j ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container border-outline-variant/30'
              }`}>{char}</div>
              <div className={`w-10 h-10 flex items-center justify-center border-t-0 border font-bold ${
                i === currentStep.j ? 'bg-primary/20 border-primary text-primary' : 'bg-primary/10 text-primary border-outline-variant/30'
              }`}>{lps[i]}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 overflow-x-auto">
        <div className="flex justify-between items-center mb-6 min-w-[600px]">
          <h3 className="font-semibold">Execution Trace <span className="text-outline text-sm font-normal ml-2">Step {stepIndex + 1} of {trace.length}</span></h3>
          <div className="flex gap-2">
            <button 
              onClick={() => { setStepIndex(0); setIsPlaying(false); }}
              className="p-2 bg-surface-container hover:bg-surface-container-high rounded transition-colors"
            >
              <RotateCcw size={16}/>
            </button>
            <button 
              onClick={() => { setStepIndex(s => Math.max(0, s - 1)); setIsPlaying(false); }}
              className="p-2 bg-surface-container hover:bg-surface-container-high rounded transition-colors"
              disabled={stepIndex === 0}
            >
              <SkipBack size={16}/>
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-primary text-white hover:bg-primary/90 rounded transition-colors"
            >
              {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
            </button>
            <button 
              onClick={() => { setStepIndex(s => Math.min(trace.length - 1, s + 1)); setIsPlaying(false); }}
              className="p-2 bg-surface-container hover:bg-surface-container-high rounded transition-colors"
              disabled={stepIndex === trace.length - 1}
            >
              <SkipForward size={16}/>
            </button>
          </div>
        </div>
        
        <div className="min-w-[600px]">
          <div className="font-mono text-lg flex gap-1">
            {text.split('').map((c, idx) => (
              <div key={idx} className={`w-8 h-8 flex items-center justify-center border ${
                idx === currentStep.i ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-transparent'
              }`}>
                {c}
              </div>
            ))}
          </div>
          
          <div className="font-mono text-lg flex gap-1 mt-2">
            {Array.from({ length: offset }).map((_, idx) => (
              <div key={`space-${idx}`} className="w-8 h-8"></div>
            ))}
            {pattern.split('').map((c, idx) => {
              const isCurrentJ = idx === currentStep.j;
              const isMatch = isCurrentJ && currentStep.match && !currentStep.found;
              const isMismatch = isCurrentJ && !currentStep.match && !currentStep.found && currentStep.message.startsWith('Mismatch');
              
              let classes = 'border-transparent text-primary/70';
              if (isMatch) classes = 'border-green-500 text-green-700 bg-green-50 font-bold';
              else if (isMismatch) classes = 'border-red-500 text-red-700 bg-red-50 font-bold';
              else if (currentStep.found && idx <= currentStep.j) classes = 'border-green-500 text-white bg-green-500 font-bold';
              else if (isCurrentJ) classes = 'border-primary text-primary bg-primary/10 font-bold';

              return (
                <div key={idx} className={`w-8 h-8 flex items-center justify-center border ${classes}`}>
                  {c}
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 text-sm font-medium">
            {currentStep.message}
          </div>
        </div>
      </div>
    </div>
  );
}
