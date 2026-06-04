import React from 'react';
import { useAppStore } from '../store';
import { clsx } from 'clsx';
import { Filter, X, RotateCcw } from 'lucide-react';

const ENTITY_TYPES = ['Company', 'Product', 'Model', 'Person', 'Technology', 'Open Source', 'Research', 'Investor'];
const RELATION_TYPES = ['competes_with', 'founded_by', 'built_on', 'powered_by', 'uses', 'related_to'];
const POPULARITY_TYPES = ['hot', 'rising', 'classic'];
const CATEGORY_TYPES = ['AI coding', 'image', 'video', 'agent', 'infra', 'search', 'devtools', 'robotics'];

export default function FilterPanel() {
  const { 
    activeFilterType, 
    setActiveFilterType, 
    activeRelationFilter,
    setActiveRelationFilter,
    activePopularityFilter,
    setActivePopularityFilter,
    activeCategoryFilter,
    setActiveCategoryFilter,
    showFilters, 
    setShowFilters,
    resetAllFilters,
    pathStartNodeId,
    setPathStartNodeId,
    pathEndNodeId,
    setPathEndNodeId,
    nodes,
    edges
  } = useAppStore();

  if (!showFilters) {
    return (
      <button 
        onClick={() => setShowFilters(true)}
        className="fixed top-20 left-6 z-30 flex items-center justify-center w-8 h-8 bg-white border border-gray-200 hover:border-black transition-colors shadow-sm"
      >
        <Filter className="w-4 h-4 text-black" />
      </button>
    );
  }

  return (
    <div className="fixed top-[4.5rem] left-6 z-30 w-64 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl flex flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-mono text-xs uppercase tracking-widest font-medium text-black">Index Filters</h3>
        <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-black transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h4 className="font-serif text-sm italic text-gray-500 mb-3 border-b border-gray-100 pb-1">Path Highlight</h4>
          <div className="flex flex-col gap-2">
            <select 
              value={pathStartNodeId || ''} 
              onChange={e => setPathStartNodeId(e.target.value || null)}
              className="w-full border border-gray-200 px-2 py-1.5 text-sm font-sans bg-gray-50 focus:border-black outline-none"
            >
              <option value="">Select Start Point...</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <select 
              value={pathEndNodeId || ''} 
              onChange={e => setPathEndNodeId(e.target.value || null)}
              className="w-full border border-gray-200 px-2 py-1.5 text-sm font-sans bg-gray-50 focus:border-black outline-none"
            >
              <option value="">Select Target Point...</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <h4 className="font-serif text-sm italic text-gray-500 mb-3">By Entity</h4>
          <div className="flex flex-col gap-1">
            {ENTITY_TYPES.map(t => (
              <button 
                key={t}
                onClick={() => setActiveFilterType(activeFilterType === t ? null : t)}
                className={clsx("text-left px-2 py-1.5 text-sm font-sans transition-colors border-l-2 flex justify-between", activeFilterType === t ? 'border-black text-black bg-gray-50' : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50')}
              >
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-serif text-sm italic text-gray-500 mb-3">By Relation</h4>
          <div className="flex flex-col gap-1">
            {RELATION_TYPES.map(r => (
              <button 
                key={r}
                onClick={() => setActiveRelationFilter(activeRelationFilter === r ? null : r)}
                className={clsx("text-left px-2 py-1.5 text-sm font-sans transition-colors border-l-2 flex justify-between", activeRelationFilter === r ? 'border-black text-black bg-gray-50' : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50')}
              >
                <span>{r}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-serif text-sm italic text-gray-500 mb-3">By Trend</h4>
          <div className="flex flex-wrap gap-2">
            {POPULARITY_TYPES.map(p => (
              <button 
                key={p}
                onClick={() => setActivePopularityFilter(activePopularityFilter === p ? null : p)}
                className={clsx("px-3 py-1 text-xs font-mono uppercase tracking-widest border transition-colors", activePopularityFilter === p ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500 hover:border-black hover:text-black')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-serif text-sm italic text-gray-500 mb-3">By Category</h4>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TYPES.map(c => (
              <button 
                key={c}
                onClick={() => setActiveCategoryFilter(activeCategoryFilter === c ? null : c)}
                className={clsx("px-3 py-1 border text-xs font-sans transition-colors rounded-full", activeCategoryFilter === c ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-black')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button 
          onClick={resetAllFilters}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono uppercase tracking-widest text-black bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>
    </div>
  );
}
