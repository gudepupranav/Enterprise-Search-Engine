import { useState } from 'react';
import { editDistance } from '../engine/dp';
import { longestCommonSubsequence } from '../engine/dp';
import { tsp } from '../engine/dp';
import type { EditDistanceResult, LCSResult, TSPResult } from '../engine/dp';

export default function DPLab() {
  const [activeTab, setActiveTab] = useState<'ed' | 'lcs' | 'tsp'>('ed');

  return (
    <div className="py-6 flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="flex border-b border-outline-variant/30">
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'ed' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
            onClick={() => setActiveTab('ed')}
          >
            Edit Distance (Wagner-Fischer)
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-l border-outline-variant/30 ${activeTab === 'lcs' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
            onClick={() => setActiveTab('lcs')}
          >
            Longest Common Subsequence
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-l border-outline-variant/30 ${activeTab === 'tsp' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
            onClick={() => setActiveTab('tsp')}
          >
            Traveling Salesperson (Bitmask DP)
          </button>
        </div>
        
        <div className="p-6 bg-surface-container-lowest">
          {activeTab === 'ed' && <EditDistanceTab />}
          {activeTab === 'lcs' && <LCSTab />}
          {activeTab === 'tsp' && <TSPTab />}
        </div>
      </div>
    </div>
  );
}

function EditDistanceTab() {
  const [word1, setWord1] = useState('intention');
  const [word2, setWord2] = useState('execution');
  const [result, setResult] = useState<EditDistanceResult | null>(null);

  const handleRun = () => setResult(editDistance(word1, word2));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-outline uppercase">Source String</label>
          <input 
            type="text" 
            value={word1} 
            onChange={e => setWord1(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-md font-mono"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-outline uppercase">Target String</label>
          <input 
            type="text" 
            value={word2} 
            onChange={e => setWord2(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-md font-mono"
          />
        </div>
        <button onClick={handleRun} className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 font-semibold">Compute</button>
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 overflow-x-auto">
            <h3 className="font-semibold mb-4 text-primary">Wagner-Fischer Matrix</h3>
            <table className="border-collapse font-mono text-center">
              <thead>
                <tr>
                  <th className="p-3 border border-outline-variant bg-surface-container"></th>
                  <th className="p-3 border border-outline-variant bg-surface-container">Ø</th>
                  {word2.split('').map((c, i) => <th key={i} className="p-3 border border-outline-variant bg-surface-container">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.matrix.map((row, i) => (
                  <tr key={i}>
                    <th className="p-3 border border-outline-variant bg-surface-container">{i === 0 ? 'Ø' : word1[i-1]}</th>
                    {row.map((val, j) => (
                      <td key={j} className={`p-3 border border-outline-variant ${i === result.matrix.length-1 && j === row.length-1 ? 'bg-primary/20 text-primary font-bold' : ''}`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
             <h3 className="font-semibold mb-4 text-primary">Traceback Operations</h3>
             <div className="text-4xl font-bold mb-4">{result.distance} <span className="text-sm font-normal text-outline">edits</span></div>
             <ul className="space-y-2 font-mono text-sm max-h-[400px] overflow-y-auto">
                {result.operations.map((op, i) => (
                  <li key={i} className={`p-2 rounded ${
                    op.startsWith('Keep') ? 'bg-green-100 text-green-800' :
                    op.startsWith('Replace') ? 'bg-blue-100 text-blue-800' :
                    op.startsWith('Insert') ? 'bg-purple-100 text-purple-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {i+1}. {op}
                  </li>
                ))}
             </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function LCSTab() {
  const [word1, setWord1] = useState('AGGTAB');
  const [word2, setWord2] = useState('GXTXAYB');
  const [result, setResult] = useState<LCSResult | null>(null);

  const handleRun = () => setResult(longestCommonSubsequence(word1, word2));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-outline uppercase">String 1</label>
          <input 
            type="text" 
            value={word1} 
            onChange={e => setWord1(e.target.value.toUpperCase())}
            className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-md font-mono"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-outline uppercase">String 2</label>
          <input 
            type="text" 
            value={word2} 
            onChange={e => setWord2(e.target.value.toUpperCase())}
            className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-md font-mono"
          />
        </div>
        <button onClick={handleRun} className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 font-semibold">Compute LCS</button>
      </div>

      {result && (
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
            <div>
               <h3 className="font-semibold text-outline mb-1">Longest Common Subsequence</h3>
               <div className="font-mono text-3xl font-bold tracking-[0.2em] text-primary">{result.lcs || 'None'}</div>
            </div>
            <div className="text-right">
               <h3 className="font-semibold text-outline mb-1">Length</h3>
               <div className="font-mono text-3xl font-bold text-on-surface">{result.length}</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 overflow-x-auto">
            <h3 className="font-semibold mb-4 text-primary">DP Matrix</h3>
            <table className="border-collapse font-mono text-center">
              <thead>
                <tr>
                  <th className="p-3 border border-outline-variant bg-surface-container"></th>
                  <th className="p-3 border border-outline-variant bg-surface-container">Ø</th>
                  {word2.split('').map((c, i) => <th key={i} className="p-3 border border-outline-variant bg-surface-container">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.matrix.map((row, i) => (
                  <tr key={i}>
                    <th className="p-3 border border-outline-variant bg-surface-container">{i === 0 ? 'Ø' : word1[i-1]}</th>
                    {row.map((val, j) => {
                      const isLCSPath = i === result.matrix.length-1 && j === row.length-1; // simplistic highlight
                      return (
                        <td key={j} className={`p-3 border border-outline-variant ${isLCSPath ? 'bg-primary/20 text-primary font-bold' : ''}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TSPTab() {
  const N = 4;
  const [matrix, setMatrix] = useState<number[][]>([
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0]
  ]);
  const [result, setResult] = useState<TSPResult | null>(null);

  const handleChange = (i: number, j: number, val: string) => {
    const num = parseInt(val) || 0;
    const newMatrix = [...matrix.map(row => [...row])];
    newMatrix[i][j] = num;
    setMatrix(newMatrix);
  };

  const handleRun = () => {
    setResult(tsp(matrix));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold text-primary">Distance Matrix</h3>
             <button onClick={handleRun} className="bg-primary text-white px-4 py-1.5 rounded text-sm hover:bg-primary/90 font-semibold">Compute TSP</button>
          </div>
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr>
                <th className="p-2 border border-outline-variant bg-surface-container"></th>
                {Array(N).fill(0).map((_, i) => <th key={i} className="p-2 border border-outline-variant bg-surface-container">C{i}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <th className="p-2 border border-outline-variant bg-surface-container">C{i}</th>
                  {row.map((val, j) => (
                    <td key={j} className="p-1 border border-outline-variant">
                      <input 
                        type="number" 
                        value={val}
                        onChange={e => handleChange(i, j, e.target.value)}
                        disabled={i === j}
                        className="w-full text-center p-1 outline-none disabled:bg-surface-container-low disabled:text-outline"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
            <h3 className="font-semibold text-primary mb-4">Optimal Tour</h3>
            <div className="text-4xl font-bold mb-6 text-on-surface">
               {result.minCost === Infinity ? 'No Path' : result.minCost}
            </div>
            {result.minCost !== Infinity && (
               <div className="flex items-center gap-2 flex-wrap font-mono text-sm">
                 {result.path.map((node, i) => (
                   <span key={i} className="flex items-center gap-2">
                     <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">C{node}</span>
                     {i < result.path.length - 1 && <span className="text-outline">→</span>}
                   </span>
                 ))}
               </div>
            )}
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
          <h3 className="font-semibold mb-4 text-primary">Bitmask DP Table (Cost to reach state)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto font-mono text-xs">
            {Object.entries(result.dpTable).map(([key, val]) => (
              <div key={key} className="bg-surface-container p-2 rounded border border-outline-variant/30 flex justify-between">
                <span className="text-outline">{key}</span>
                <span className="font-bold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
