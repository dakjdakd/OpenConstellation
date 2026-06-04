import React, { useState } from 'react';
import { Bookmark, Folder, FolderPlus, Clock, Plus, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';

export default function Saved() {
  const { favorites, collections, recentViews, nodes, createCollection } = useAppStore();
  const [newColName, setNewColName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const favNodes = nodes.filter(n => favorites.includes(n.id));
  const recentNodes = recentViews.map(id => nodes.find(n => n.id === id)).filter(Boolean);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim()) {
      createCollection(newColName.trim());
      setNewColName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full h-full pt-20 pb-12 px-6 overflow-y-auto grid-bg relative">
      <div className="max-w-5xl mx-auto mt-12 relative z-10">
        <h1 className="font-serif text-5xl font-bold tracking-tight mb-4 text-black">My Constellation</h1>
        <p className="font-sans text-gray-500 mb-12">Collections, bookmarked explorations, and chronological history.</p>
        
        <div className="w-full flex justify-between items-end mb-6 border-b border-gray-200 pb-2">
          <h2 className="font-mono text-sm uppercase tracking-widest text-black flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Custom Collections
          </h2>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="text-xs font-mono uppercase tracking-widest border border-gray-200 px-3 py-1 hover:border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1 bg-white"
          >
            <FolderPlus className="w-3 h-3" />
            New Collection
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="mb-6 flex gap-2">
            <input 
              autoFocus
              type="text" 
              placeholder="Collection name..."
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              className="border border-gray-300 px-3 py-2 font-sans text-sm focus:border-black focus:outline-none flex-1 max-w-sm"
            />
            <button type="submit" className="bg-black text-white px-4 py-2 font-mono text-xs uppercase tracking-widest">
              Create
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-20 mb-12">
          {collections.map(col => (
            <div key={col.id} className="border border-gray-200 bg-white p-6 hover:border-black hover:shadow-lg transition-all flex flex-col group">
              <div className="flex items-center gap-2 mb-4 text-gray-400 group-hover:text-black">
                <Folder className="w-5 h-5" />
                <h3 className="font-sans font-medium text-black">{col.name}</h3>
              </div>
              <p className="font-sans text-sm text-gray-500 mb-6 flex-1">
                {col.nodes.length} nodes saved in this collection.
              </p>
              <div className="flex gap-2 font-mono text-[10px] uppercase text-gray-400 tracking-widest">
                <button className="border border-gray-200 px-2 py-1 hover:border-black hover:text-black transition-colors bg-gray-50">View List</button>
                <button className="border border-gray-200 px-2 py-1 hover:border-black hover:text-black transition-colors bg-gray-50">View in Map</button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Favorites */}
          <div>
            <h2 className="font-mono text-sm uppercase tracking-widest text-black flex items-center gap-2 border-b border-gray-200 pb-2 mb-6">
              <Bookmark className="w-4 h-4" />
              Bookmarked Nodes
            </h2>
            <div className="space-y-3">
              {favNodes.length === 0 ? (
                <p className="text-sm font-sans text-gray-400 italic">No bookmarks yet. Explore the universe to find nodes.</p>
              ) : (
                favNodes.map(n => (
                  <Link key={n.id} to={`/node/${n.id}`} className="block border border-gray-100 bg-white p-4 hover:border-black group transition-colors shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-lg text-black group-hover:underline">{n.name}</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest bg-gray-50 px-2 py-1 text-gray-500">{n.type}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* History */}
          <div>
            <h2 className="font-mono text-sm uppercase tracking-widest text-black flex items-center gap-2 border-b border-gray-200 pb-2 mb-6">
              <Clock className="w-4 h-4" />
              Recent Exploration
            </h2>
            <div className="space-y-3">
              {recentNodes.length === 0 ? (
                <p className="text-sm font-sans text-gray-400 italic">No recent history.</p>
              ) : (
                recentNodes.map((n, idx) => (
                  <div key={`${n!.id}-${idx}`} className="flex items-center gap-4 text-sm font-sans group">
                    <span className="text-gray-300 font-mono text-[10px]">0{idx + 1}</span>
                    <Link to={`/node/${n!.id}`} className="text-gray-600 hover:text-black hover:underline flex-1">{n!.name}</Link>
                    <Link to="/" onClick={() => useAppStore.getState().setIsolatedNodeId(n!.id)} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-black">
                      <Compass className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
