import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Search, 
  GitCompare, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Table,
  Layers,
  X
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { processDocumentFile, type ProcessedDocument } from '../engine/documentProcessing';

export default function DocumentsPage() {
  const { documents, addDocuments, removeDocument, clearDocuments, resetToSampleCorpus } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocument | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'content' | 'tokens' | 'metadata'>('content');
  const [filterQuery, setFilterQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        addDocuments([processDocumentFile(file.name, content, file.size)]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        addDocuments([processDocumentFile(file.name, content, file.size)]);
      };
      reader.readAsText(file);
    });
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const getFormatIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'json': return <FileCode size={18} className="text-amber-600" />;
      case 'csv': return <Table size={18} className="text-emerald-600" />;
      default: return <FileText size={18} className="text-blue-600" />;
    }
  };

  return (
    <div className="py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Document Repository</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Upload, preprocess, and manage text corpus files for indexing, multi-pattern search, and structural analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetToSampleCorpus}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant bg-surface hover:bg-surface-container transition-colors text-on-surface"
          >
            <RotateCcw size={14} />
            Reset Sample Corpus
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Upload size={14} />
            Upload Documents
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.json,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragActive 
            ? 'border-primary bg-primary/5 scale-[1.005]' 
            : 'border-outline-variant/50 hover:border-primary/50 bg-surface-container-low/40'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Upload size={20} />
          </div>
          <span className="text-sm font-semibold text-on-surface">Drag and drop documents here, or click upload</span>
          <span className="text-xs text-on-surface-variant">Supports standard UTF-8 text documents: .txt, .json, .csv</span>
        </div>
      </div>

      {/* Document Pipeline Flow Card */}
      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-semibold text-on-surface flex items-center gap-1.5">
          <Layers size={15} className="text-primary" />
          Automated Ingestion Pipeline:
        </span>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-white border border-outline-variant/30 text-on-surface">1. Raw Document</span>
          <span className="text-outline">→</span>
          <span className="px-2 py-0.5 rounded bg-white border border-outline-variant/30 text-on-surface">2. Text Extraction</span>
          <span className="text-outline">→</span>
          <span className="px-2 py-0.5 rounded bg-white border border-outline-variant/30 text-on-surface">3. Tokenization & Offsets</span>
          <span className="text-outline">→</span>
          <span className="px-2 py-0.5 rounded bg-white border border-outline-variant/30 text-on-surface">4. Normalization</span>
          <span className="text-outline">→</span>
          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary font-bold">5. Suffix Indexing</span>
        </div>
      </div>

      {/* Document List Table */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-on-surface">Uploaded Documents ({filteredDocs.length})</span>
            {documents.length > 0 && (
              <button 
                onClick={clearDocuments}
                className="text-xs text-error hover:underline flex items-center gap-1"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-outline" size={14} />
            <input
              type="text"
              placeholder="Filter by name..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs outline-none focus:border-primary w-56"
            />
          </div>
        </div>

        {filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold border-b border-outline-variant/30 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Characters</th>
                  <th className="py-3 px-4">Tokens</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-on-surface flex items-center gap-2">
                      {getFormatIcon(doc.extension)}
                      <span className="truncate max-w-xs">{doc.name}</span>
                    </td>
                    <td className="py-3 px-4 uppercase font-mono text-[11px] text-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant/30 font-bold">
                        {doc.extension}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{doc.measuredCharacters.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{doc.tokenCount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-on-surface-variant">
                      {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        <CheckCircle2 size={12} /> Ready
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="p-1.5 text-outline hover:text-primary rounded hover:bg-surface-container transition-colors"
                          title="Inspect Document"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/search?docId=${encodeURIComponent(doc.id)}`)}
                          className="p-1.5 text-outline hover:text-primary rounded hover:bg-surface-container transition-colors"
                          title="Search in this document"
                        >
                          <Search size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/compare?docA=${idx}`)}
                          className="p-1.5 text-outline hover:text-primary rounded hover:bg-surface-container transition-colors"
                          title="Compare with another document"
                        >
                          <GitCompare size={15} />
                        </button>
                        <button
                          onClick={() => removeDocument(idx)}
                          className="p-1.5 text-outline hover:text-error rounded hover:bg-surface-container transition-colors"
                          title="Remove document"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle size={28} className="text-outline" />
            <span className="text-sm font-semibold text-on-surface">No documents found</span>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Upload text documents (.txt, .json, .csv) or click "Reset Sample Corpus" to test the system with enterprise benchmark records.
            </p>
          </div>
        )}
      </div>

      {/* Document Inspector Modal / Drawer */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-outline-variant/30 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2 min-w-0">
                {getFormatIcon(selectedDoc.extension)}
                <span className="font-bold text-sm text-on-surface truncate">{selectedDoc.name}</span>
                <span className="text-xs font-mono text-outline">({(selectedDoc.fileSizeBytes / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-outline-variant/30 px-4 bg-surface text-xs font-semibold">
              <button
                onClick={() => setInspectorTab('content')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  inspectorTab === 'content'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Raw Content View
              </button>
              <button
                onClick={() => setInspectorTab('tokens')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  inspectorTab === 'tokens'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tokenized Stream ({selectedDoc.tokenCount})
              </button>
              <button
                onClick={() => setInspectorTab('metadata')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  inspectorTab === 'metadata'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Preprocessing Metadata
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 text-xs font-mono">
              {inspectorTab === 'content' && (
                <div className="bg-white p-4 rounded-lg border border-outline-variant/30 whitespace-pre-wrap leading-relaxed text-on-surface">
                  {selectedDoc.originalText || 'This document has no content.'}
                </div>
              )}

              {inspectorTab === 'tokens' && (
                <div className="flex flex-col gap-2">
                  <p className="text-on-surface-variant font-sans text-xs">
                    Discrete linguistic tokens generated by Unicode regex pattern matching with character start and end index offsets.
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-96 overflow-y-auto p-3 bg-white rounded-lg border border-outline-variant/30">
                    {selectedDoc.tokens.slice(0, 300).map((tok, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-surface border border-outline-variant/40 text-[11px] text-on-surface hover:bg-primary/10 transition-colors"
                        title={`Offset [${tok.start}..${tok.end}], Normalized: '${tok.normalized}'`}
                      >
                        {tok.value}
                      </span>
                    ))}
                    {selectedDoc.tokens.length > 300 && (
                      <span className="text-outline text-xs self-center px-2">
                        + {selectedDoc.tokens.length - 300} additional tokens...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {inspectorTab === 'metadata' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-sans">
                  <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
                    <span className="text-[11px] text-outline uppercase font-semibold">Total Characters</span>
                    <p className="text-base font-bold font-mono mt-1 text-on-surface">{selectedDoc.measuredCharacters.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
                    <span className="text-[11px] text-outline uppercase font-semibold">Exact Token Count</span>
                    <p className="text-base font-bold font-mono mt-1 text-on-surface">{selectedDoc.tokenCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
                    <span className="text-[11px] text-outline uppercase font-semibold">Alphanumeric Words</span>
                    <p className="text-base font-bold font-mono mt-1 text-on-surface">{selectedDoc.wordCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
                    <span className="text-[11px] text-outline uppercase font-semibold">Line Breaks</span>
                    <p className="text-base font-bold font-mono mt-1 text-on-surface">{selectedDoc.lineCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
                    <span className="text-[11px] text-outline uppercase font-semibold">File Payload</span>
                    <p className="text-base font-bold font-mono mt-1 text-on-surface">{selectedDoc.fileSizeBytes.toLocaleString()} bytes</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-outline-variant/30">
                    <span className="text-[11px] text-outline uppercase font-semibold">Normalization</span>
                    <p className="text-base font-bold font-mono mt-1 text-emerald-700">Case-Fold & Spaced</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-outline-variant/30 bg-white flex justify-end gap-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
