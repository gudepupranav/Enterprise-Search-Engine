import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import SmartSearchPage from './pages/SmartSearchPage';
import DocumentComparePage from './pages/DocumentComparePage';
import InsightsPage from './pages/InsightsPage';
import ProcessingOptimizerPage from './pages/ProcessingOptimizerPage';
import NetworkPlannerPage from './pages/NetworkPlannerPage';
import PerformancePage from './pages/PerformancePage';
import SettingsPage from './pages/SettingsPage';
import { AppProvider, useApp } from './store/AppContext';

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { documents } = useApp();

  return (
    <div className="flex h-screen bg-surface font-body-md text-on-surface">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <main className="flex-1 overflow-auto lg:pl-64 pt-14">
        {/* Top Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-surface/90 backdrop-blur-md shadow-xs z-30 flex items-center justify-between px-4 sm:px-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              title="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-on-surface tracking-tight leading-tight">
                PatternLab Enterprise
              </span>
              <span className="text-[11px] text-on-surface-variant leading-none hidden sm:inline">
                Intelligent Multi-Pattern Search & Analytics Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {documents.length} Docs Indexed
            </div>
          </div>
        </header>

        {/* Primary Page Canvas */}
        <div className="p-4 sm:p-6 max-w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/search" element={<SmartSearchPage />} />
            <Route path="/compare" element={<DocumentComparePage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/optimizer" element={<ProcessingOptimizerPage />} />
            <Route path="/network-planner" element={<NetworkPlannerPage />} />
            <Route path="/network" element={<Navigate to="/network-planner" replace />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Backwards compatibility redirects */}
            <Route path="/algorithm-lab" element={<Navigate to="/search" replace />} />
            <Route path="/foundations" element={<Navigate to="/performance" replace />} />
            <Route path="/suffix-array" element={<Navigate to="/search" replace />} />
            <Route path="/dp-lab" element={<Navigate to="/compare" replace />} />
            <Route path="/co3-co4-labs" element={<Navigate to="/network-planner" replace />} />
            <Route path="/syllabus" element={<Navigate to="/insights" replace />} />
            <Route path="/syllabus-coverage" element={<Navigate to="/insights" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
