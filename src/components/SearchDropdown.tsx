import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Search, History, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SearchDropdown({ isFocused }: { isFocused: boolean }) {
  const { searchQuery, nodes, setSearchQuery, searchHistory, addSearchHistory, clearSearchHistory } = useAppStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isFocused) setIsOpen(true);
    else setTimeout(() => setIsOpen(false), 200); // delay to allow clicks
  }, [isFocused]);

  const queryStr = searchQuery || '';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'Enter' && queryStr.trim()) {
         addSearchHistory(queryStr.trim());
         navigate(`/search?q=${encodeURIComponent(queryStr.trim())}`);
         setSearchQuery('');
         setIsOpen(false);
       }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queryStr, navigate, setSearchQuery, addSearchHistory]);

  const handleFullSearch = () => {
    if (queryStr.trim()) {
      addSearchHistory(queryStr.trim());
    }
    navigate(`/search?q=${encodeURIComponent(queryStr.trim())}`);
    setSearchQuery('');
    setIsOpen(false);
  };

  // Keep dropdown open if it's explicitly focused/open
  const isVisible = isOpen;

  const results = queryStr.trim() ? nodes.filter(n => 
    n.name.toLowerCase().includes(queryStr.toLowerCase()) ||
    n.type.toLowerCase().includes(queryStr.toLowerCase()) ||
    n.subtitle.toLowerCase().includes(queryStr.toLowerCase())
  ).slice(0, 8) : []; // Top 8 results

  const trending = ['OpenAI', 'Transformer', 'Agent', 'Claude 3', 'RAG'];

  return (
    <div 
      className={`absolute top-14 left-0 right-0 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl z-50 pointer-events-auto transition-all duration-300 transform origin-top ${
        isVisible ? 'opacity-100 translate-y-0 scale-y-100' : 'opacity-0 -translate-y-2 scale-y-95 pointer-events-none'
      }`}
    >
      {!queryStr.trim() ? (
        <div className="p-4 space-y-6">
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 text-gray-500">
                <span className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"><History className="w-3 h-3" /> Recent Searches</span>
                <button onClick={clearSearchHistory} className="font-sans text-[10px] hover:text-black">Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map(q => (
                  <button 
                    key={q} 
                    onClick={() => { setSearchQuery(q); setIsOpen(true); }}
                    className="font-sans text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full hover:border-black hover:text-black transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
             <div className="flex items-center mb-3 text-gray-500">
                <span className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Trending Topics</span>
             </div>
             <div className="flex flex-wrap gap-2">
                {trending.map(q => (
                  <button 
                    key={q} 
                    onClick={() => { setSearchQuery(q); setIsOpen(true); }}
                    className="font-sans text-xs bg-indigo-50/50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full hover:border-indigo-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 font-sans text-sm text-gray-500">
          No records found for "{searchQuery}". Press Enter to view full search analysis.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {results.map((r, i) => (
            <button 
              key={r.id} 
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start justify-between cursor-pointer group transition-all duration-300"
              style={{ animation: `slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
              onClick={() => {
                navigate(`/node/${r.id}`);
                setSearchQuery('');
              }}
            >
              <div>
                <span className="font-sans text-sm font-medium text-black group-hover:underline">{r.name}</span>
                <span className="ml-2 font-mono text-[10px] uppercase text-gray-400 bg-gray-50 px-1 py-0.5 border border-gray-100">{r.type}</span>
                <p className="font-serif text-xs italic text-gray-500 mt-1">{r.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <button 
        onClick={handleFullSearch}
        className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-2 border-t border-gray-200 font-mono text-[10px] text-gray-400 hover:text-black uppercase tracking-widest text-center transition-colors cursor-pointer"
      >
        Explore full index <Search className="w-3 h-3 inline-block ml-1 opacity-50" />
      </button>
    </div>
  );
}
