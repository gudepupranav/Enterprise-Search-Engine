import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Files, 
  Search, 
  GitCompare, 
  TrendingUp, 
  Zap, 
  Network, 
  Gauge, 
  Sliders, 
  X,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Documents', path: '/documents', icon: <Files size={18} /> },
    { name: 'Smart Search', path: '/search', icon: <Search size={18} /> },
    { name: 'Document Compare', path: '/compare', icon: <GitCompare size={18} /> },
    { name: 'Processing Optimizer', path: '/optimizer', icon: <Zap size={18} /> },
    { name: 'Network Planner', path: '/network-planner', icon: <Network size={18} /> },
    { name: 'Insights', path: '/insights', icon: <TrendingUp size={18} /> },
    { name: 'Performance', path: '/performance', icon: <Gauge size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Sliders size={18} /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col justify-between shadow-xs border-r border-outline-variant/30 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & Platform Branding */}
          <div className="h-16 px-5 flex items-center justify-between bg-surface-container-low border-b border-outline-variant/30">
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base text-primary tracking-tight truncate leading-none">
                PatternLab
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-on-surface-variant mt-1 truncate">
                Enterprise Intelligence
              </span>
            </div>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation Section */}
          <div className="px-5 pt-4 pb-2">
            <span className="uppercase text-outline tracking-wider text-[10px] font-bold">
              Product Workflows
            </span>
          </div>

          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-outline'}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Engine Status Footer */}
        <div className="p-3 m-3 rounded-lg bg-surface-container border border-outline-variant/30 text-xs">
          <div className="font-bold text-on-surface flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Deterministic Engine</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
            All text indexes, alignments, and network flows are computed directly in client memory.
          </p>
        </div>
      </aside>
    </>
  );
}
