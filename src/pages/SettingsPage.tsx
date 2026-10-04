import { 
  RotateCcw, 
  Trash2, 
  Layers, 
  Zap, 
  FileText 
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { SearchAlgorithmId } from '../types';

export default function SettingsPage() {
  const { settings, updateSettings, resetToSampleCorpus, clearDocuments, documents } = useApp();

  return (
    <div className="py-6 flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">System Settings & Engine Defaults</h1>
        <p className="text-sm text-on-surface-variant">
          Configure default search paradigms, text normalization filters, and corpus data stores.
        </p>
      </div>

      {/* Engine Defaults */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
        <div className="border-b border-outline-variant/30 pb-3 flex items-center gap-2">
          <Zap size={18} className="text-primary" />
          <span className="font-bold text-sm text-on-surface">Default Search Engine Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface uppercase tracking-wider">Default Search Method</label>
            <select
              value={settings.defaultEngine}
              onChange={e => updateSettings({ defaultEngine: e.target.value as SearchAlgorithmId })}
              className="px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface font-medium outline-none focus:border-primary"
            >
              <option value="auto">Auto (Adaptive Heuristic Selector)</option>
              <option value="kmp">Knuth-Morris-Pratt (KMP)</option>
              <option value="rabin">Rabin-Karp Rolling Hash</option>
              <option value="z">Z-Algorithm (Z-Box)</option>
              <option value="suffix-array">Suffix Array (Binary Search)</option>
              <option value="naive">Naïve Sliding Window Scan</option>
            </select>
            <span className="text-[11px] text-on-surface-variant">
              The algorithm selected by default when entering the Smart Search interface.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface uppercase tracking-wider">Stepper Playback Speed</label>
            <select
              value={settings.playbackSpeedMs}
              onChange={e => updateSettings({ playbackSpeedMs: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface font-medium outline-none focus:border-primary"
            >
              <option value={1000}>Relaxed (1000 ms / step)</option>
              <option value={600}>Normal (600 ms / step)</option>
              <option value={300}>High Speed (300 ms / step)</option>
            </select>
            <span className="text-[11px] text-on-surface-variant">
              Automated stepper speed across sequence and flow pipeline visualizers.
            </span>
          </div>
        </div>
      </div>

      {/* Preprocessing & Normalization */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
        <div className="border-b border-outline-variant/30 pb-3 flex items-center gap-2">
          <Layers size={18} className="text-secondary" />
          <span className="font-bold text-sm text-on-surface">Document Preprocessing & Ingestion Flags</span>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer">
            <div className="flex flex-col">
              <span className="font-bold text-on-surface">Case-Insensitive Search Normalization</span>
              <span className="text-[11px] text-on-surface-variant">
                Fold uppercase characters to lowercase during token matching while preserving original document casing.
              </span>
            </div>
            <input
              type="checkbox"
              checked={!settings.caseSensitive}
              onChange={e => updateSettings({ caseSensitive: !e.target.checked })}
              className="w-4 h-4 accent-primary rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer">
            <div className="flex flex-col">
              <span className="font-bold text-on-surface">Whitespace & Linefeed Normalization</span>
              <span className="text-[11px] text-on-surface-variant">
                Collapse repeated tab and space characters into single space tokens during indexing.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.collapseWhitespace}
              onChange={e => updateSettings({ collapseWhitespace: e.target.checked })}
              className="w-4 h-4 accent-primary rounded"
            />
          </label>
        </div>
      </div>

      {/* Corpus Management */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
        <div className="border-b border-outline-variant/30 pb-3 flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <span className="font-bold text-sm text-on-surface">Corpus Data Management</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-surface-container-low text-xs">
          <div className="flex flex-col">
            <span className="font-bold text-on-surface">Active Document Corpus ({documents.length} files)</span>
            <span className="text-on-surface-variant text-[11px] mt-0.5">
              Reset to pre-packaged benchmark enterprise datasets or clear active memory state.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={resetToSampleCorpus}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-on-surface transition-colors"
            >
              <RotateCcw size={14} /> Restore Sample Corpus
            </button>
            <button
              onClick={clearDocuments}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
