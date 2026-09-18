import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type DocumentData = {
  name: string;
  content: string;
  sizeBytes: number;
};

export type SearchRecord = {
  algorithm: string;
  timeMs: number;
  matches: number;
};

type AppContextType = {
  documents: DocumentData[];
  searchHistory: SearchRecord[];
  addDocuments: (docs: DocumentData[]) => void;
  removeDocument: (index: number) => void;
  addSearchRecord: (record: SearchRecord) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchRecord[]>([]);

  const addDocuments = (docs: DocumentData[]) => {
    setDocuments(prev => [...prev, ...docs]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const addSearchRecord = (record: SearchRecord) => {
    setSearchHistory(prev => [...prev, record]);
  };

  return (
    <AppContext.Provider value={{ documents, searchHistory, addDocuments, removeDocument, addSearchRecord }}>
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
