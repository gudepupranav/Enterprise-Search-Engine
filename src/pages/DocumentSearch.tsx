import { useState } from 'react';
import { Search, FileText, Upload, Trash2, Clock, Zap } from 'lucide-react';
import { kmpSearch, rabinKarpSearch, naiveSearch, zAlgorithmSearch } from '../engine/stringSearch';
import { useApp } from '../store/AppContext';

export default function DocumentSearch() {
  const { documents, addDocuments, removeDocument, addSearchRecord } = useApp();
  const [query, setQuery] = useState('');
  const [algorithm, setAlgorithm] = useState('kmp');
  const [results, setResults] = useState<any[]>([]);
  const [activeDoc, setActiveDoc] = useState(-1);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        addDocuments([{ name: file.name, content, sizeBytes: content.length }]);
      };
      reader.readAsText(file);
    });
  };

  const handleSearch = () => {
    if (!query || activeDoc === -1) return;
    
    const doc = documents[activeDoc];
    let res;
    switch(algorithm) {
      case 'naive': res = naiveSearch(doc.content, query); break;
      case 'kmp': res = kmpSearch(doc.content, query); break;
      case 'rabin': res = rabinKarpSearch(doc.content, query); break;
      case 'z': res = zAlgorithmSearch(doc.content, query); break;
      default: res = kmpSearch(doc.content, query);
    }
    
    addSearchRecord({
      algorithm,
      timeMs: res.executionTimeMs,
      matches: res.matches.length
    });
    
    setResults([res]);
  };

  return (
    <div className="py-6 h-[calc(100vh-80px)] flex gap-6">
      <div className="w-80 bg-white rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
          <h2 className="font-semibold text-on-surface">Documents</h2>
          <label className="cursor-pointer bg-primary text-white p-1.5 rounded-md hover:bg-primary/90 transition-colors">
            <Upload size={16} />
            <input type="file" multiple className="hidden" accept=".txt,.json,.csv" onChange={handleFileUpload} />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {documents.map((doc, idx) => (
            <div 
              key={idx} 
              onClick={() => setActiveDoc(idx)}
              className={`p-3 mb-2 rounded-lg cursor-pointer flex items-start gap-3 transition-colors ${
                activeDoc === idx ? 'bg-primary/10 border-primary/30 border' : 'hover:bg-surface-container border border-transparent'
              }`}
            >
              <FileText size={18} className={activeDoc === idx ? 'text-primary' : 'text-outline'} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate font-medium ${activeDoc === idx ? 'text-primary' : 'text-on-surface'}`}>
                  {doc.name}
                </div>
                <div className="text-xs text-outline mt-1">{doc.content.length} characters</div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeDocument(idx); setActiveDoc(-1); }}
                className="text-outline hover:text-error"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="text-center p-8 text-outline text-sm">
              No documents uploaded. Click the upload button to add text files.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-outline" size={20} />
              <input 
                type="text" 
                placeholder="Enter pattern to search..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <select 
              className="px-4 py-2.5 rounded-lg border border-outline-variant bg-surface outline-none focus:border-primary font-medium"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="kmp">KMP Algorithm</option>
              <option value="naive">Naïve Search</option>
              <option value="rabin">Rabin-Karp</option>
              <option value="z">Z-Function</option>
            </select>
            <button 
              onClick={handleSearch}
              disabled={activeDoc === -1 || !query}
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center">
            <h2 className="font-semibold text-on-surface">Document View & Results</h2>
            {results.length > 0 && (
              <div className="flex gap-4 text-sm font-mono text-on-surface-variant">
                <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded"><Zap size={14}/> {results[0].matches.length} matches</span>
                <span className="flex items-center gap-1 bg-secondary/10 text-secondary px-2 py-1 rounded"><Clock size={14}/> {results[0].executionTimeMs.toFixed(2)}ms</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap text-on-surface bg-gray-50">
            {activeDoc !== -1 && results.length > 0 ? (
              <HighlightedText text={documents[activeDoc].content} matches={results[0].matches} queryLength={query.length} />
            ) : activeDoc !== -1 ? (
              documents[activeDoc].content
            ) : (
              <div className="h-full flex items-center justify-center text-outline">
                Select a document to view its content and perform a search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightedText({ text, matches, queryLength }: { text: string, matches: number[], queryLength: number }) {
  if (matches.length === 0) return <>{text}</>;
  
  const parts = [];
  let lastIdx = 0;
  
  matches.forEach((matchIdx, i) => {
    parts.push(text.substring(lastIdx, matchIdx));
    parts.push(
      <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded-sm shadow-sm font-bold">
        {text.substring(matchIdx, matchIdx + queryLength)}
      </mark>
    );
    lastIdx = matchIdx + queryLength;
  });
  
  parts.push(text.substring(lastIdx));
  
  return <>{parts}</>;
}
