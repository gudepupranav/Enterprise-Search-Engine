import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ProcessedDocument } from '../engine/documentProcessing';
import { getSampleDocuments } from '../engine/sampleData';
import type { ComparisonRecord, SearchQueryHistoryItem, SearchAlgorithmId } from '../types';

export type DocumentData = ProcessedDocument;

export interface AppSettings {
  defaultEngine: SearchAlgorithmId;
  caseSensitive: boolean;
  collapseWhitespace: boolean;
  highlightColor: string;
  playbackSpeedMs: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultEngine: 'auto',
  caseSensitive: false,
  collapseWhitespace: true,
  highlightColor: '#fef08a',
  playbackSpeedMs: 400,
};

type AppContextType = {
  documents: DocumentData[];
  searchHistory: SearchQueryHistoryItem[];
  comparisonHistory: ComparisonRecord[];
  settings: AppSettings;
  addDocuments: (docs: DocumentData[]) => void;
  removeDocument: (index: number) => void;
  clearDocuments: () => void;
  resetToSampleCorpus: () => void;
  addSearchRecord: (record: Omit<SearchQueryHistoryItem, 'id' | 'timestamp'>) => void;
  addComparisonRecord: (record: Omit<ComparisonRecord, 'id' | 'timestamp'>) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<DocumentData[]>(() => {
    return getSampleDocuments();
  });

  const [searchHistory, setSearchHistory] = useState<SearchQueryHistoryItem[]>(() => [
    {
      id: 'init-1',
      query: 'revenue',
      docName: 'financial-quarterly-analysis-q3.txt',
      matchCount: 4,
      executionTimeMs: 0.18,
      algorithmName: 'Knuth-Morris-Pratt (KMP)',
      comparisons: 1642,
      timestamp: Date.now() - 3600000 * 2,
    },
    {
      id: 'init-2',
      query: 'throughput',
      docName: 'cloud-infrastructure-audit.json',
      matchCount: 3,
      executionTimeMs: 0.12,
      algorithmName: 'Suffix Array (Binary Search)',
      comparisons: 48,
      timestamp: Date.now() - 3600000 * 1,
    },
    {
      id: 'init-3',
      query: 'Delivered',
      docName: 'supply-chain-dispatch-manifest.csv',
      matchCount: 4,
      executionTimeMs: 0.09,
      algorithmName: 'Rabin-Karp Rolling Hash',
      comparisons: 312,
      timestamp: Date.now() - 1800000,
    },
  ]);

  const [comparisonHistory, setComparisonHistory] = useState<ComparisonRecord[]>(() => [
    {
      id: 'comp-1',
      docAName: 'financial-quarterly-analysis-q3.txt',
      docBName: 'cloud-infrastructure-audit.json',
      similarityScore: 14.2,
      editDistance: 1420,
      lcsLength: 320,
      alignmentMethod: 'Wagner-Fischer',
      timestamp: Date.now() - 3600000,
    },
  ]);

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const addDocuments = (docs: DocumentData[]) => {
    setDocuments(prev => [...prev, ...docs]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const clearDocuments = () => {
    setDocuments([]);
  };

  const resetToSampleCorpus = () => {
    setDocuments(getSampleDocuments());
  };

  const addSearchRecord = (record: Omit<SearchQueryHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: SearchQueryHistoryItem = {
      ...record,
      id: `srch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    setSearchHistory(prev => [newItem, ...prev.slice(0, 49)]);
  };

  const addComparisonRecord = (record: Omit<ComparisonRecord, 'id' | 'timestamp'>) => {
    const newItem: ComparisonRecord = {
      ...record,
      id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    setComparisonHistory(prev => [newItem, ...prev.slice(0, 24)]);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider
      value={{
        documents,
        searchHistory,
        comparisonHistory,
        settings,
        addDocuments,
        removeDocument,
        clearDocuments,
        resetToSampleCorpus,
        addSearchRecord,
        addComparisonRecord,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
