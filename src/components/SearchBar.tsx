import React from 'react';
import { useAppStore } from '../store';
import SearchDropdown from './SearchDropdown';
import { AISearchIcon } from './icons';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, nodes, setIsolatedNodeId, setSelectedNodeId } = useAppStore();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search: Cmd+K or / (if not typing in input)
      if ((e.key === 'k' && e.metaKey) || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Escape
      if (e.key === 'Escape') {
        if (document.activeElement?.tagName === 'INPUT') {
          (document.activeElement as HTMLElement).blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim().toLowerCase().replace(/\s+/g, '');
      if (!q) return;

      const match = nodes.find(n => {
        const title = n.name.toLowerCase().replace(/\s+/g, '');
        return title === q || title.includes(q) || q.includes(title);
      });
      
      if (match) {
        setIsolatedNodeId(match.id);
        setSelectedNodeId(match.id);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    }
  };

  return (
    <div className="relative group w-full min-w-0 md:min-w-[450px]">
      <AISearchIcon className="absolute z-10 pointer-events-none left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black group-focus-within:drop-shadow-[0_0_4px_rgba(0,0,0,0.3)] transition-all transform group-focus-within:scale-110" />
      <input 
        ref={searchInputRef}
        type="text" 
        placeholder="Search nodes, companies, models..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        onKeyDown={handleKeyDown}
        className="w-full h-10 lg:h-12 bg-white/70 backdrop-blur-sm border border-gray-200 focus:border-black focus:ring-0 rounded-full pl-12 pr-16 font-sans text-sm lg:text-base focus:outline-none transition-all pointer-events-auto shadow-inner hover:bg-white"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
        <kbd className="font-mono text-[11px] lg:text-xs px-2 py-0.5 border border-gray-200 text-gray-400 bg-white shadow-sm">⌘</kbd>
        <kbd className="font-mono text-[11px] lg:text-xs px-2 py-0.5 border border-gray-200 text-gray-400 bg-white shadow-sm">K</kbd>
      </div>
      <SearchDropdown isFocused={isSearchFocused} />
    </div>
  );
}
