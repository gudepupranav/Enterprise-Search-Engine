
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DocumentSearch from './pages/DocumentSearch';
import AlgorithmLab from './pages/AlgorithmLab';
import DPLab from './pages/DPLab';
import { AppProvider } from './store/AppContext';

function App() {
  return (
    <AppProvider>
      <div className="flex h-screen bg-surface font-body-md text-on-surface">
      <Sidebar />
      <main className="flex-1 overflow-auto pl-72 pt-14">
        <header className="fixed top-0 left-72 right-0 h-14 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg">
          <div className="flex flex-col">
            <span className="font-title-md text-title-md text-on-surface tracking-tight leading-tight">PatternLab Engine</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-none">Algorithmic Computing Suite</span>
          </div>
        </header>
        <div className="p-gutter-lg">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<DocumentSearch />} />
            <Route path="/algorithm-lab" element={<AlgorithmLab />} />
            <Route path="/dp-lab" element={<DPLab />} />
          </Routes>
        </div>
      </main>
    </div>
    </AppProvider>
  );
}

export default App;
