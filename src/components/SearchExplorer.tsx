import React from 'react';
import { useAppStore } from '../store';
import { Link, useSearchParams } from 'react-router-dom';
import { Zap, Box, Compass } from 'lucide-react';
import AIGenerationBlock from './AIGenerationBlock';

export default function SearchExplorer() {
  const { nodes } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim().toLowerCase();

  const results = query ? nodes.filter(n => 
    n.name.toLowerCase().includes(query) ||
    n.type.toLowerCase().includes(query) ||
    n.subtitle.toLowerCase().includes(query) ||
    n.tags.some(t => t.toLowerCase().includes(query))
  ) : [];

  return (
    <div className="w-full h-full pt-14 flex overflow-hidden grid-bg">
      
      {/* Left Sidebar - Result Type Filters (UI only for MVP) */}
      <div className="w-64 border-r border-gray-200 bg-white/50 backdrop-blur-sm p-6 hidden md:block overflow-y-auto">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mb-6">Filter Results</h3>
        <div className="space-y-2">
          <button className="block w-full text-left font-sans text-sm text-black font-medium border-l-2 border-black pl-3 py-1">All Results ({results.length})</button>
          <button className="block w-full text-left font-sans text-sm text-gray-500 hover:text-black border-l-2 border-transparent hover:border-gray-300 pl-3 py-1">Companies</button>
          <button className="block w-full text-left font-sans text-sm text-gray-500 hover:text-black border-l-2 border-transparent hover:border-gray-300 pl-3 py-1">Products</button>
          <button className="block w-full text-left font-sans text-sm text-gray-500 hover:text-black border-l-2 border-transparent hover:border-gray-300 pl-3 py-1">Models</button>
        </div>
      </div>

      {/* Main Results Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-3xl">
          <div className="mb-10">
            <h1 className="font-serif text-4xl mb-2">Search Results</h1>
            <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
              Query: [{rawQuery || 'None'}] // {results.length} records found
            </p>
          </div>

          {!query ? (
             <div className="border border-gray-200 p-12 text-center bg-white">
                <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-serif text-2xl mb-2 text-gray-400">Search the Universe</h3>
                <p className="font-sans text-gray-500">Enter a query above to explore entities, people, and technologies.</p>
             </div>
          ) : results.length === 0 ? (
             <div className="border border-gray-200 p-12 text-center bg-white">
                <Box className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-serif text-2xl mb-2">Null Sector</h3>
                <p className="font-sans text-gray-500">No entities match your specific coordinates.</p>
             </div>
          ) : (
            <div className="space-y-6">
              {results.map(r => (
                <div key={r.id} className="block border border-white/50 bg-white/30 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] hover:bg-white/50 hover:border-white/80 transition-all duration-500 group relative overflow-hidden">
                  {/* Subtle cosmic glow effect inside the card */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/30 to-purple-50/10 rounded-full blur-3xl -z-10 group-hover:opacity-100 opacity-40 transition-opacity duration-500 pointer-events-none"></div>

                  <Link to={`/node/${r.id}`} className="block z-10 relative">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 gap-3">
                      <h2 className="font-serif text-2xl md:text-3xl font-medium text-black drop-shadow-sm group-hover:text-indigo-950 transition-colors md:pr-28 break-words">{r.name}</h2>
                      <span className="font-mono text-[10px] uppercase tracking-widest bg-white/60 backdrop-blur-md border border-white/50 shadow-sm rounded-full px-3 py-1.5 text-gray-700 font-medium self-start">{r.type}</span>
                    </div>
                    <p className="font-sans text-base text-gray-600 mb-6 max-w-2xl leading-relaxed">{r.subtitle}</p>
                    <div className="flex items-center gap-3">
                      {r.tags.slice(0,3).map(t => (
                        <span key={t} className="font-mono text-[10px] uppercase tracking-widest text-gray-500 bg-white/40 px-3 py-1.5 rounded-full border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </Link>
                  <div className="md:absolute static mt-6 md:mt-0 flex justify-end bottom-8 right-8 md:top-8 md:bottom-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 transform md:translate-y-2 md:group-hover:translate-y-0 z-20">
                    <Link 
                      to="/" 
                      onClick={() => useAppStore.getState().setSelectedNodeId(r.id)}
                      className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] border border-gray-200 md:border-white/80 bg-white/80 backdrop-blur-md shadow-sm md:shadow-lg rounded-full px-5 py-2.5 hover:scale-105 hover:bg-white text-black transition-all"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Locate Map
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - AI Interpretation */}
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 hidden lg:block overflow-y-auto">
        <div className="sticky top-0">
          
          {query ? (
             <div className="space-y-6">
               <AIGenerationBlock 
                 content={`The concept of "${query}" appears frequently within foundational layers of the model ecosystem. Entities returning in this cluster generally represent high-visibility infrastructure or primary application interfaces.`}
                 confidence={0.92}
                 label="Cluster Synthesis"
               />
              <div className="border border-gray-200 p-4 bg-white mt-6">
                <h4 className="font-serif italic text-sm text-gray-500 mb-3">Suggested Exploration Vectors</h4>
                <ul className="space-y-2 font-sans text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">·</span>
                    <span>Trace structural derivations to <Link to="/tech" className="underline">Tech Tree branches</Link></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">·</span>
                    <span>Observe parallel competitor topologies.</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                 <Zap className="w-4 h-4 text-gray-400" />
                 <h3 className="font-mono text-[10px] uppercase tracking-widest font-medium text-gray-400">AI Interpretation</h3>
              </div>
              <p className="font-sans text-sm text-gray-500 italic">
                Awaiting query coordinates to begin synthesis...
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
