import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { ExternalLink, ArrowLeft, ArrowRight, Zap, Box, Boxes, Share2, Bookmark, ArrowDown, Network, Sparkles } from 'lucide-react';
import AIGenerationBlock from './AIGenerationBlock';

export default function NodeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { nodes, edges } = useAppStore();
  const [syllabusExpanded, setSyllabusExpanded] = useState(false);
  const [errataSubmitted, setErrataSubmitted] = useState(false);
  
  const node = nodes.find(n => n.id === id);
  
  if (!node) {
    return (
      <div className="w-full h-full flex items-center justify-center font-sans text-gray-500 bg-transparent">
        <div className="text-center bg-white p-8 border border-gray-200">
          <h2 className="font-serif text-2xl mb-2 text-black">Record Not Found</h2>
          <p className="mb-4">The entity [{id}] does not exist in the current index.</p>
          <button onClick={() => navigate(-1)} className="text-sm underline hover:text-black">Return</button>
        </div>
      </div>
    );
  }

  const incomingEdges = edges.filter(e => e.targetId === node.id);
  const outgoingEdges = edges.filter(e => e.sourceId === node.id);
  const getRelatedNode = (nid: string) => nodes.find(n => n.id === nid);

  return (
    <div className="w-full h-full overflow-y-auto bg-white grid-bg">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 md:py-16 bg-white border border-gray-200 shadow-sm mt-8 relative z-10">
        
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-black font-sans text-sm transition-colors group pb-0.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Return</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-black border border-gray-200 p-2 bg-white">
              <Bookmark className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-black border border-gray-200 p-2 bg-white">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-b border-gray-200 pb-16">
          <div className="lg:col-span-2">
            <div className="inline-block px-3 py-1 border border-black text-xs font-mono uppercase tracking-[0.2em] mb-6">
              {node.type}
            </div>
            <h1 className="font-serif text-6xl md:text-8xl font-bold tracking-tight text-black leading-none mb-6">
              {node.name}
            </h1>
            <p className="font-sans text-2xl text-gray-600 font-light max-w-2xl">
              {node.subtitle}
            </p>
          </div>
          
          <div className="flex flex-col justify-end space-y-6">
            {node.website && (
              <a href={node.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 font-sans text-sm border-b border-gray-200 pb-3 hover:border-black transition-colors group">
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-black" />
                <span className="flex-1">Official Website</span>
                <span className="font-mono text-[10px] text-gray-400">{node.website.replace('https://', '')}</span>
              </a>
            )}
             {node.foundedAt && (
              <div className="flex items-center gap-3 font-sans text-sm border-b border-gray-200 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 w-24">Date</span>
                <span className="flex-1 text-black font-medium">{node.foundedAt}</span>
              </div>
            )}
            {node.founders && (
              <div className="flex items-center gap-3 font-sans text-sm border-b border-gray-200 pb-3">
                 <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 w-24">Founders</span>
                 <span className="flex-1 text-black">{node.founders.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16">
          <div className="lg:col-span-2 space-y-16">
            
            <section>
              <h2 className="font-mono text-sm uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-2 mb-6">Overview</h2>
              <p className="font-sans text-lg text-gray-800 leading-relaxed font-light">
                {node.description}
              </p>
              
              <div className="mt-8">
                <AIGenerationBlock
                  content={node.aiSummary || `Within the broader ecosystem, ${node.name} acts as a vital structural component. Observing its connection density reveals significant dependencies from downstream layers.`}
                  confidence={node.aiConfidence || 0.88}
                  label="Strategic Position Analysis"
                />
              </div>
            </section>

             <section>
              <h2 className="font-mono text-sm uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-2 mb-6">Relationship Vector</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <h3 className="font-serif italic text-gray-500 mb-4">Outgoing Influence</h3>
                   <div className="space-y-3">
                      {outgoingEdges.length === 0 && <p className="text-sm font-sans text-gray-400">No outgoing vectors recorded.</p>}
                      {outgoingEdges.map(edge => {
                        const target = getRelatedNode(edge.targetId);
                        if(!target) return null;
                        return (
                          <Link key={edge.id} to={`/node/${target.id}`} className="block border border-gray-200 p-3 bg-white hover:border-black group transition-all">
                            <p className="font-mono text-[10px] text-gray-400 uppercase mb-1">{edge.relationType}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-medium text-black group-hover:underline">{target.name}</span>
                              <span className="font-mono text-[8px] bg-gray-100 px-1 py-0.5">{target.type}</span>
                            </div>
                          </Link>
                        )
                      })}
                   </div>
                 </div>
                 <div>
                   <h3 className="font-serif italic text-gray-500 mb-4">Incoming Dependencies</h3>
                   <div className="space-y-3">
                      {incomingEdges.length === 0 && <p className="text-sm font-sans text-gray-400">No incoming vectors recorded.</p>}
                      {incomingEdges.map(edge => {
                        const source = getRelatedNode(edge.sourceId);
                        if(!source) return null;
                        return (
                          <Link key={edge.id} to={`/node/${source.id}`} className="block border border-gray-200 p-3 bg-white hover:border-black group transition-all">
                            <p className="font-mono text-[10px] text-gray-400 uppercase mb-1">{edge.relationType}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-medium text-black group-hover:underline">{source.name}</span>
                              <span className="font-mono text-[8px] bg-gray-100 px-1 py-0.5">{source.type}</span>
                            </div>
                          </Link>
                        )
                      })}
                   </div>
                 </div>
              </div>
            </section>

            {node.events && node.events.length > 0 && (
              <section>
                <h2 className="font-mono text-sm uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-2 mb-6">Historical Events</h2>
                <div className="relative border-l border-black ml-3 space-y-8 pb-8 pt-4">
                  {node.events.map((event, idx) => (
                    <div key={idx} className="relative pl-8">
                       <div className="absolute w-2 h-2 bg-white border border-black rounded-full -left-[4.5px] top-1"></div>
                       <p className="font-mono text-[10px] text-gray-500 tracking-widest uppercase mb-1">{event.date}</p>
                       <h4 className="font-serif text-lg text-black mb-2">{event.title}</h4>
                       <p className="font-sans text-sm text-gray-700 leading-relaxed max-w-xl">{event.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-6">
                <h2 className="font-mono text-sm uppercase tracking-widest text-gray-900">Data Flow Pipeline</h2>
                <Network className="w-4 h-4 text-gray-400" />
              </div>

              <div className="border border-gray-200 bg-gray-100/50 p-6 sm:p-8 overflow-hidden">
                {/* Horizontal Scroll Area */}
                <div className="overflow-x-auto pb-4 no-scrollbar">
                   <div className="flex items-center justify-center sm:justify-start min-w-max gap-16 py-8 px-4">
                      
                      {/* UPSTREAM COLUMN */}
                      <div className="flex flex-col justify-center gap-4 relative w-64 shrink-0">
                         {incomingEdges.map((edge, idx) => {
                            const src = getRelatedNode(edge.sourceId);
                            if (!src) return null;
                            const isFirst = idx === 0;
                            const isLast = idx === incomingEdges.length - 1;
                            const isOnly = incomingEdges.length === 1;
                            return (
                               <div key={edge.id} className="relative group w-full bg-white border border-gray-200 p-4 hover:border-black transition-all z-20 hover:shadow-md">
                                  <div className="absolute -top-2.5 right-2 bg-white px-1.5 border border-gray-200 font-mono text-[8px] uppercase tracking-widest text-gray-400 group-hover:text-black group-hover:border-black transition-colors z-30">
                                    {edge.relationType.replace(/_/g, ' ')}
                                  </div>
                                  
                                  <Link to={`/node/${src.id}`} className="block">
                                     <h4 className="font-serif text-sm text-black mb-1 group-hover:underline decoration-1 underline-offset-4">{src.name}</h4>
                                     <p className="font-sans text-xs text-gray-500 line-clamp-2 leading-relaxed">{src.description}</p>
                                  </Link>

                                  {/* Wire to bus */}
                                  <div className="absolute top-[50%] -right-8 w-8 h-px bg-gray-300 z-10 transition-colors group-hover:bg-black"></div>
                                  
                                  {/* Vertical Bus Segment */}
                                  {!isOnly && (
                                     <div className={`absolute -right-8 w-px bg-gray-300 z-10 transition-colors group-hover:bg-black
                                       ${isFirst ? 'top-[50%] bottom-[-1rem]' : 
                                         isLast ? 'top-0 bottom-[50%]' : 
                                         'top-0 bottom-[-1rem]'}`
                                     }></div>
                                  )}
                               </div>
                            );
                         })}
                         {incomingEdges.length === 0 && (
                            <div className="w-full border border-dashed border-gray-300 bg-transparent p-4 text-center">
                               <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">No Upstream Data</p>
                            </div>
                         )}
                      </div>

                      {/* CENTER NODE */}
                      <div className="relative w-64 shrink-0 z-30 group">
                         {incomingEdges.length > 0 && (
                            <>
                               <div className="absolute top-1/2 -left-8 w-8 h-px bg-gray-300 z-10 transition-colors group-hover:bg-black"></div>
                               {/* Arrow head */}
                               <div className="absolute top-1/2 left-[-4px] w-1.5 h-1.5 border-t border-r border-gray-400 rotate-45 -translate-y-[2.5px] z-20 transition-colors group-hover:border-black"></div>
                            </>
                         )}
                         <div className="bg-black text-white p-6 shadow-2xl border border-black cursor-default transition-transform hover:-translate-y-1">
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                  <span className="font-mono text-[8px] uppercase tracking-widest text-gray-400">Current Scope</span>
                                </div>
                                <span className="font-mono text-[8px] border border-gray-800 bg-gray-900 px-1.5 py-0.5 text-gray-400 uppercase tracking-widest">{node.type}</span>
                             </div>
                             <h2 className="font-serif text-xl font-bold mb-2 tracking-tight drop-shadow-sm">{node.name}</h2>
                             <p className="font-sans text-xs text-gray-400 line-clamp-3 leading-relaxed opacity-90">{node.description}</p>
                         </div>
                         {outgoingEdges.length > 0 && (
                            <div className="absolute top-1/2 -right-8 w-8 h-px bg-gray-300 z-10 transition-colors group-hover:bg-black"></div>
                         )}
                      </div>

                      {/* DOWNSTREAM COLUMN */}
                      {outgoingEdges.length > 0 ? (
                         <div className="flex flex-col justify-center gap-4 relative w-64 shrink-0">
                            {outgoingEdges.map((edge, idx) => {
                               const tgt = getRelatedNode(edge.targetId);
                               if (!tgt) return null;
                               const isFirst = idx === 0;
                               const isLast = idx === outgoingEdges.length - 1;
                               const isOnly = outgoingEdges.length === 1;
                               return (
                                  <div key={edge.id} className="relative group/card w-full bg-white border border-gray-200 p-4 hover:border-black transition-all z-20 hover:shadow-md">
                                     <div className="absolute -top-2.5 left-2 bg-white px-1.5 border border-gray-200 font-mono text-[8px] uppercase tracking-widest text-gray-400 group-hover/card:text-black group-hover/card:border-black transition-colors z-30">
                                       {edge.relationType.replace(/_/g, ' ')}
                                     </div>
                                     
                                     <Link to={`/node/${tgt.id}`} className="block">
                                        <h4 className="font-serif text-sm text-black mb-1 group-hover/card:underline decoration-1 underline-offset-4">{tgt.name}</h4>
                                        <p className="font-sans text-xs text-gray-500 line-clamp-2 leading-relaxed">{tgt.description}</p>
                                     </Link>

                                     {/* Wire from bus */}
                                     <div className="absolute top-[50%] -left-8 w-8 h-px bg-gray-300 z-10 transition-colors group-hover/card:bg-black"></div>
                                     
                                     {/* Vertical Bus Segment */}
                                     {!isOnly && (
                                        <div className={`absolute -left-8 w-px bg-gray-300 z-10 transition-colors group-hover/card:bg-black
                                          ${isFirst ? 'top-[50%] bottom-[-1rem]' : 
                                            isLast ? 'top-0 bottom-[50%]' : 
                                            'top-0 bottom-[-1rem]'}`
                                        }></div>
                                     )}
                                     
                                     {/* Arrow into target */}
                                     <div className="absolute top-1/2 left-[-4px] w-1.5 h-1.5 border-t border-r border-gray-400 rotate-45 -translate-y-[2.5px] z-20 bg-white transition-colors group-hover/card:border-black"></div>
                                  </div>
                               );
                            })}
                         </div>
                      ) : (
                         <div className="flex flex-col justify-center gap-4 relative w-64 shrink-0">
                            <div className="w-full border border-dashed border-gray-300 bg-transparent p-4 text-center">
                               <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Terminal Node</p>
                            </div>
                         </div>
                      )}

                   </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-2 border-b border-black pb-2 mb-6 mt-16">
                 <Boxes className="w-4 h-4 text-black" />
                 <h3 className="font-mono text-sm uppercase tracking-widest text-black">AI Synthesis Path</h3>
              </div>
              <div className="border border-dashed border-gray-300 bg-gray-50/50 p-6 space-y-4">
                 <p className="font-sans text-sm text-gray-500">Prerequisite cognitive steps for <span className="font-medium text-black">{node.name}</span></p>
                 <ol className="list-decimal list-inside space-y-3 font-sans text-sm text-gray-800">
                   <li>Understand the core philosophy of {node.tags[0] || 'AI'}.</li>
                   <li>Review the upstream dependencies on the map.</li>
                   <li>Analyze architectural departure from classical norms.</li>
                   {syllabusExpanded && (
                     <>
                       <li>Examine historical impact and ecosystem adoption.</li>
                       <li>Evaluate current research frontiers.</li>
                       <li>Synthesize alternative topologies (e.g., non-transformer designs).</li>
                     </>
                   )}
                 </ol>
                 <button 
                    onClick={() => setSyllabusExpanded(!syllabusExpanded)}
                    className="mt-4 font-mono text-[10px] uppercase tracking-widest hover:underline decoration-1 underline-offset-4 text-black cursor-pointer transition-all"
                 >
                    {syllabusExpanded ? '− Close Expanded View' : '+ Expand Full Syllabus'}
                 </button>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 border-b border-black pb-2 mb-6">
                 <Sparkles className="w-4 h-4 text-black" />
                 <h3 className="font-mono text-sm uppercase tracking-widest text-black">Human Verification</h3>
              </div>
              <div className="border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
                 <p className="font-sans text-sm text-gray-600 leading-relaxed">
                   Notice hallucinatory or outdated taxonomy? Contribute corrections to the unified matrix.
                 </p>
                 {errataSubmitted ? (
                    <div className="w-full font-mono text-[10px] bg-black text-white py-2 uppercase tracking-widest text-center">
                      Errata Logged
                    </div>
                 ) : (
                    <button 
                      onClick={() => setErrataSubmitted(true)}
                      className="w-full font-mono text-[10px] border border-black bg-white py-2 text-black hover:bg-black hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Submit Errata
                    </button>
                 )}
              </div>
            </section>

            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-4">Tags / Taxonomy</h3>
              <div className="flex flex-wrap gap-2">
                {node.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 border border-gray-200 font-mono text-[10px] uppercase tracking-widest bg-gray-50 text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-4">Entity Statistics</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                   <span className="font-sans text-sm text-gray-600">Ecosystem Popularity</span>
                   <span className="font-mono text-sm text-black">{node.popularity} / 10</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                   <span className="font-sans text-sm text-gray-600">Total Graph Degrees</span>
                   <span className="font-mono text-sm text-black">{incomingEdges.length + outgoingEdges.length}</span>
                 </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
