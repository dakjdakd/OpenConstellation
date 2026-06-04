import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, Settings, LayoutDashboard, Wrench, FolderGit2, ScrollText, FileTerminal, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ProjectSetup from './pages/ProjectSetup';
import SkillRegistry from './pages/SkillRegistry';
import PolicyBuilder from './pages/PolicyBuilder';
import OutputPreview from './pages/OutputPreview';
import SettingsPage from './pages/Settings';
import BootSplash from './components/BootSplash';
import { useStore } from './store';
import { soundEngine } from './utils/useSound';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/setup', icon: Wrench, label: 'Project Setup' },
    { to: '/registry', icon: FolderGit2, label: 'Skill Registry' },
    { to: '/policy', icon: ScrollText, label: 'Policy Builder' },
    { to: '/preview', icon: FileTerminal, label: 'Output Preview' },
    { to: '/settings', icon: Settings, label: 'Settings', mobileOnly: true },
  ];

  return (
    <div className={`w-full ${isCollapsed ? 'md:w-[68px]' : 'md:w-64'} border-b md:border-b-0 md:border-r border-solid border-ink md:h-screen bg-paper flex flex-col md:pt-8 shrink-0 transition-all duration-300 relative`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-8 border border-solid border-ink bg-paper text-ink p-1 z-10 md:block hidden hover:bg-ink hover:text-paper"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`px-6 py-4 md:py-0 md:mb-12 flex justify-between items-center md:block ${isCollapsed ? 'md:px-2 md:mb-6 md:text-center overflow-hidden' : ''}`}>
        <div className={`flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
          <h1 className="text-title flex items-center gap-2">
            <Terminal className="text-blueprint-blue shrink-0" size={24} />
            {!isCollapsed && <span>SKILLGATE</span>}
          </h1>
          {!isCollapsed && (
            <div className="font-mono text-caption text-muted mt-2 uppercase tracking-wide hidden md:block whitespace-nowrap">
              V1.0 - Soft Policy
            </div>
          )}
        </div>
      </div>

      <nav className={`flex-1 flex flex-row md:flex-col gap-2 px-4 overflow-x-auto pb-4 md:pb-0 ${isCollapsed ? 'md:px-2 md:items-center' : ''}`}>
        {links.map(link => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              title={isCollapsed ? link.label : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 px-0' : 'gap-3 px-3'} py-2 whitespace-nowrap font-mono text-sm uppercase transition-none ${link.mobileOnly ? 'md:hidden' : ''} ${
                isActive 
                  ? 'bg-ink text-paper border border-solid border-ink' 
                  : 'text-ink hover:border hover:border-solid hover:border-blueprint-blue'
              }`}
            >
              <link.icon size={16} className="shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
              {!isCollapsed && isActive && <span className="ml-2 md:ml-auto animate-pulse shrink-0">█</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`hidden md:block ${isCollapsed ? 'p-2' : 'p-4'} border-t border-solid border-[--color-border-solid]`}>
        <button 
          onClick={() => navigate('/settings')}
          title={isCollapsed ? 'Settings' : undefined}
          className={`w-full flex ${isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'items-center justify-between px-3'} py-2 font-mono text-caption uppercase transition-none ${
            location.pathname === '/settings' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
          }`}
        >
          {isCollapsed ? (
             <Settings size={14} />
          ) : (
            <>
              <span className="flex items-center gap-2">
                <Settings size={14} />
                Settings
              </span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { settings, updateSettings } = useStore();
  const location = useLocation();

  const handleBootComplete = () => {
    updateSettings({ hasBooted: true });
  };

  if (!settings.hasBooted) {
    return (
      <div>
        <BootSplash onComplete={handleBootComplete} />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      
      <Sidebar />
      <main className="flex-1 max-h-screen overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<ProjectSetup />} />
            <Route path="/registry" element={<SkillRegistry />} />
            <Route path="/policy" element={<PolicyBuilder />} />
            <Route path="/preview" element={<OutputPreview />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
