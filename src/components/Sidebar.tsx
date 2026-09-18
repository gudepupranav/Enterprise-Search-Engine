import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Network, 
  Grid3X3
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, badge: 'Core' },
    { name: 'Document Search', path: '/search', icon: <Search size={20} />, badge: 'Multi' },
    { name: 'Algorithm Lab', path: '/algorithm-lab', icon: <Network size={20} />, badge: 'String' },
    { name: 'DP Lab', path: '/dp-lab', icon: <Grid3X3 size={20} />, badge: 'DP' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-outline-variant/30">
      <div className="flex flex-col">
        <div className="h-14 px-space-base flex items-center gap-space-sm bg-surface-container-low border-b border-outline-variant/30">
          <div className="flex flex-col min-w-0 py-2">
            <span className="font-title-md text-title-md text-primary tracking-tight truncate leading-none font-bold">PatternLab</span>
            <span className="font-code-sm text-code-sm text-on-surface-variant uppercase tracking-wider truncate text-xs mt-1">Core v2.4</span>
          </div>
        </div>
        
        <div className="px-space-base pt-space-md pb-space-xs mt-4">
          <span className="font-table-header text-table-header uppercase text-outline tracking-wider text-xs font-semibold">Curriculum Modules</span>
        </div>
        
        <nav className="flex flex-col gap-1 px-3 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded transition-colors ${
                  isActive 
                    ? 'bg-primary-container text-on-primary font-medium' 
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-on-primary' : 'text-outline'}>{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  isActive ? 'bg-black/20 text-white' : 'bg-surface-container text-primary'
                }`}>
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
