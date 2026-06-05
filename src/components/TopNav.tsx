import React from 'react';
import { Compass, BookOpen, Clock, Database, Info, Network } from 'lucide-react';
import { useAppStore } from '../store';
import { Link, useLocation } from 'react-router-dom';
import SearchDropdown from './SearchDropdown';

export default function TopNav() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const location = useLocation();

  const navClass = (path: string) => `flex items-center gap-2 text-sm font-sans transition-colors ${location.pathname === path ? 'text-black font-medium' : 'text-gray-600 hover:text-black'}`;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape
      if (e.key === 'Escape') {
        const { selectedNodeId, setSelectedNodeId, isolatedNodeId, setIsolatedNodeId } = useAppStore.getState();
        if (selectedNodeId || isolatedNodeId) {
          setSelectedNodeId(null);
          setIsolatedNodeId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 flex items-center justify-between px-3 md:px-6">
      <Link to="/" className="flex items-center gap-2 md:gap-3">
        <img src="/assets/logo.png" alt="OpenConstellation logo" className="w-7 h-7 rounded-md object-contain shrink-0" />
        <h1 className="font-serif text-sm md:text-lg font-medium tracking-tight whitespace-nowrap hidden sm:block">OpenConstellation</h1>
      </Link>

      <div className="flex-1"></div>

      <div className="flex items-center gap-3 md:gap-6 overflow-x-auto no-scrollbar pr-2">
        <Link to="/" className={navClass('/')}>
          <Compass className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline">Explore</span>
        </Link>
        <Link to="/tech" className={navClass('/tech')}>
          <Network className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline">Tech Tree</span>
        </Link>
        <Link to="/timeline" className={navClass('/timeline')}>
          <Clock className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline">Timeline</span>
        </Link>
        <Link to="/saved" className={navClass('/saved')}>
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline">Saved</span>
        </Link>
        <Link to="/review" className={navClass('/review')}>
          <Database className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline">Review</span>
        </Link>
        <div className="w-px h-4 bg-gray-200 shrink-0 hidden sm:block"></div>
        <Link to="/about" className={`transition-colors shrink-0 ${location.pathname === '/about' ? 'text-black' : 'text-gray-400 hover:text-black'}`} title="Help / About">
          <Info className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  );
}
