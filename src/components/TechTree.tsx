import React from 'react';
import { useAppStore } from '../store';
import { Lock, Unlock, Network, ArrowRight, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TechTree() {
  const tiers = [
    {
      level: 'Tier 1: Fundamental Constructs',
      nodes: [
        { id: 't1_1', name: 'Neural Networks', unlocked: true, type: 'core' },
        { id: 't1_2', name: 'Backpropagation', unlocked: true, type: 'math' },
      ]
    },
    {
      level: 'Tier 2: Paradigms',
      nodes: [
        { id: 't2_1', name: 'Attention Mechanism', unlocked: true, type: 'theory' },
        { id: 't2_2', name: 'Reinforcement Learning', unlocked: true, type: 'theory' },
      ]
    },
    {
      level: 'Tier 3: Formations',
      nodes: [
        { id: 'transformer', name: 'Transformer', unlocked: true, type: 'architecture', refId: 'transformer' },
        { id: 'diffusion', name: 'Diffusion Models', unlocked: true, type: 'architecture', refId: 'diffusion' },
      ]
    },
    {
      level: 'Tier 4: Ecosystems (Modern Era)',
      nodes: [
        { id: 'llm', name: 'Large Language Models (LLMs)', unlocked: true, type: 'application', refId: 'gpt4' },
        { id: 'agents', name: 'Autonomous Agents', unlocked: false, type: 'simulation' },
        { id: 'multimodal', name: 'Multi-modal Synthesis', unlocked: true, type: 'application', refId: 'midjourney' },
      ]
    }
  ];

  return (
    <div className="w-full h-full pt-14 pb-20 overflow-y-auto grid-bg relative">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
        <div className="text-center my-12 relative z-10 bg-white/80 px-8 py-6 border border-slate-200 backdrop-blur-sm shadow-sm inline-block">
           <h1 className="font-serif text-3xl md:text-4xl mb-2 text-slate-800">Technological Progression Tree</h1>
           <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Civilization Sub-routine :: Epoch 2024</p>
        </div>

        <div className="flex flex-col gap-12 relative w-full items-center">
          {tiers.map((tier, tIdx) => (
            <div key={tIdx} className="flex flex-col items-center w-full">
               
               {/* Tier Header */}
               <div className="bg-slate-900 border border-black shadow-md px-6 py-2 text-center relative mb-8 z-10 w-fit">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-200"><span className="text-emerald-400 mr-2">LVL {tIdx + 1}</span> {tier.level}</h3>
               </div>

               {/* Nodes Grid */}
               <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl relative z-20">
                  {tier.nodes.map(node => {
                    const NodeContent = (
                      <div className={`group relative p-5 border-2 w-64 h-full flex flex-col bg-white transition-all ${node.unlocked ? (node.refId ? 'border-slate-800 shadow-md hover:-translate-y-1 hover:shadow-lg focus:ring cursor-pointer hover:border-indigo-600' : 'border-slate-800 shadow-md') : 'border-slate-300 opacity-60'}`}>
                         <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                           <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{node.type}</span>
                           {node.unlocked ? <Unlock className="w-3.5 h-3.5 text-slate-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                         </div>
                         <h4 className={`font-serif text-lg leading-snug mb-3 flex-1 ${node.unlocked ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                           {node.name}
                         </h4>
                         {node.unlocked && node.refId && (
                           <div className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-indigo-600 group-hover:text-indigo-800 transition-colors mt-2">
                             <Network className="w-3.5 h-3.5" /> Inspect <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                         )}
                      </div>
                    );

                    return node.refId ? (
                      <Link to={`/node/${node.refId}`} key={node.id} className="block relative">
                        {NodeContent}
                      </Link>
                    ) : (
                      <div key={node.id} className="block relative">
                        {NodeContent}
                      </div>
                    );
                  })}
               </div>

               {/* Connection to Next Tier */}
               {tIdx < tiers.length - 1 && (
                 <div className="h-16 w-px bg-slate-300 relative mt-4">
                    <ArrowDown className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 text-slate-400 bg-white" />
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
