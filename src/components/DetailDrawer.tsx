import React, { useState } from 'react';
import { useAppStore } from '../store';
import { X, ExternalLink, Zap, Maximize2, Bookmark, BookmarkPlus, FolderPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import AIGenerationBlock from './AIGenerationBlock';

export default function DetailDrawer() {
  const { selectedNodeId, setSelectedNodeId, nodes, edges, setSelectedNodeId: navigateNode, exploreMode, setExploreMode, favorites, addFavorite, removeFavorite, collections, addNodeToCollection } = useAppStore();
  const [showColDrop, setShowColDrop] = useState(false);

  if (!selectedNodeId) return null;

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const incomingEdges = edges.filter(e => e.targetId === node.id);
  const outgoingEdges = edges.filter(e => e.sourceId === node.id);

  const getRelatedNode = (id: string) => nodes.find(n => n.id === id);
  const isFav = favorites.includes(node.id);

  const handleToggleFav = () => {
    if (isFav) removeFavorite(node.id);
    else addFavorite(node.id);
  };

  return (
    <div className="fixed top-14 bottom-0 right-0 w-full md:w-[400px] bg-white border-l border-gray-200 z-30 overflow-y-auto transform transition-transform duration-300 shadow-2xl flex flex-col">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Record #{node.id.split('-')[0].substring(0,6)}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setExploreMode(!exploreMode)}
            className={`p-1.5 transition-colors border text-[10px] font-mono tracking-widest uppercase flex items-center gap-1 ${exploreMode ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:text-black hover:border-gray-300 border-gray-200'}`}
            title="Toggle Local Cluster Map"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Explore</span>
          </button>
          <Link 
            to={`/node/${node.id}`}
            onClick={() => setSelectedNodeId(null)}
            className="p-1.5 hover:bg-gray-100 transition-colors text-gray-600 hover:text-black border border-transparent hover:border-gray-200"
            title="Expand to Full Profile"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => setSelectedNodeId(null)} className="p-1.5 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
            <X className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-block px-2 py-0.5 border border-black text-[10px] font-mono uppercase tracking-widest">
              {node.type}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleToggleFav}
                className={`p-1.5 border transition-colors ${isFav ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-black hover:border-black'}`}
              >
                {isFav ? <Bookmark className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowColDrop(!showColDrop)}
                  className="p-1.5 border border-gray-200 bg-gray-50 text-gray-500 hover:text-black hover:border-black transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                {showColDrop && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-xl z-50 py-1">
                    <p className="px-3 py-1 text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-1">Add to...</p>
                    {collections.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => { addNodeToCollection(c.id, node.id); setShowColDrop(false); }}
                        className="w-full text-left px-3 py-1.5 text-sm font-sans hover:bg-gray-50 text-gray-700 hover:text-black"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <h1 className="font-serif text-3xl font-medium text-black leading-tight mb-2">
            {node.name}
          </h1>
          <p className="font-sans text-lg text-gray-500 italic">
            {node.subtitle}
          </p>
        </div>

        {/* AI Insight */}
        <AIGenerationBlock 
          content={node.aiSummary || `${node.name} holds a central position in the ecosystem, primarily distinguished by its ${node.tags[0]?.toLowerCase() || 'core'} capabilities. It serves as a foundational node for multiple downstream applications.`}
          confidence={node.aiConfidence || 0.85}
          label="Entity Synthesis"
        />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
          {node.foundedAt && (
            <div>
              <p className="font-mono text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Founded</p>
              <p className="font-sans text-sm text-black">{node.foundedAt}</p>
            </div>
          )}
          {node.status && (
            <div>
              <p className="font-mono text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Status</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'Active' ? 'bg-black' : 'bg-gray-400'}`}></span>
                <p className="font-sans text-sm text-black">{node.status}</p>
              </div>
            </div>
          )}
          {node.website && (
            <div>
              <p className="font-mono text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Website</p>
              <a href={node.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-sans text-sm text-black hover:underline group">
                Visit Link <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="border-t border-gray-200 pt-6">
          <p className="font-sans text-sm text-gray-800 leading-relaxed">
            {node.description}
          </p>
        </div>

        {/* Relations Network */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mb-4">Ecosystem Edges</h3>
          
          <div className="space-y-4">
            {outgoingEdges.length > 0 && (
              <div>
                <h4 className="font-serif text-xs italic mb-2 text-gray-600">Outgoing</h4>
                <div className="space-y-2">
                  {outgoingEdges.map(edge => {
                    const target = getRelatedNode(edge.targetId);
                    if (!target) return null;
                    return (
                      <div key={edge.id} className="flex flex-col border border-gray-200 p-2 hover:border-black cursor-pointer bg-white transition-colors" onClick={() => navigateNode(target.id)}>
                        <span className="font-mono text-[10px] text-gray-400 mb-1">{edge.relationType.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-medium">{target.name}</span>
                          <span className="pt-0.5 px-1 bg-gray-100 text-[8px] font-mono text-gray-500 uppercase tracking-widest group-hover:bg-black group-hover:text-white transition-colors">{target.type}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {incomingEdges.length > 0 && (
              <div>
                <h4 className="font-serif text-xs italic mb-2 text-gray-600">Incoming</h4>
                <div className="space-y-2">
                  {incomingEdges.map(edge => {
                    const source = getRelatedNode(edge.sourceId);
                    if (!source) return null;
                    return (
                      <div key={edge.id} className="flex flex-col border border-gray-200 p-2 hover:border-black cursor-pointer bg-white transition-colors" onClick={() => navigateNode(source.id)}>
                        <span className="font-mono text-[10px] text-gray-400 mb-1">{edge.relationType.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-medium">{source.name}</span>
                          <span className="py-0.5 px-1 bg-gray-100 text-[8px] font-mono text-gray-500 uppercase tracking-widest">{source.type}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="border-t border-gray-200 pt-6 pb-8">
          <div className="flex flex-wrap gap-2">
            {node.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 font-mono text-[10px] uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
