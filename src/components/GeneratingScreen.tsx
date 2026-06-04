import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Hexagon, Boxes, Sparkles } from 'lucide-react';

const MESSAGES = [
  "Initializing Atlas subroutines...",
  "Routing neural pathways...",
  "Querying knowledge graph: [Entity Extraction]",
  "Resolving corporate structures...",
  "Mapping topological relationships...",
  "Calibrating boundaries...",
  "Synthesizing node clusters...",
  "Rendering Universe Map."
];

export default function GeneratingScreen() {
  const { setAppState, searchQuery } = useAppStore();
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Advance text messages rapidly
    const textInterval = setInterval(() => {
      setMsgIdx(prev => {
        if (prev < MESSAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 400); // 400ms per text line

    // 2. Smooth progress bar
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) return 100;
        return p + (Math.random() * 15 + 5); 
      });
    }, 200);

    // 3. Complete and swap state
    const completeTimeout = setTimeout(() => {
      const q = searchQuery.trim().toLowerCase().replace(/\s+/g, '');
      const match = useAppStore.getState().nodes.find(n => {
        const title = n.name.toLowerCase().replace(/\s+/g, '');
        return title === q || title.includes(q) || q.includes(title);
      });
      
      if (match) {
        useAppStore.getState().setIsolatedNodeId(match.id);
        useAppStore.getState().setSelectedNodeId(match.id);
      }
      
      useAppStore.getState().setSearchQuery(''); // clear query so input is ready for next
      setAppState('exploring');
    }, 4000); // 4-second loading sequence

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
    };
  }, [setAppState]);

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center overflow-hidden">
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      ></div>
      
      <motion.div 
        className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
      >
         <motion.div 
            className="w-full h-px bg-black shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            animate={{ y: ["0vh", "100vh"] }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
         />
      </motion.div>

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center text-center">
        {/* Central Geometric Core */}
        <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
           <motion.div
             animate={{ rotate: 360 }}
             transition={{ duration: 6, ease: "linear", repeat: Infinity }}
             className="absolute inset-0 border border-black/10 rounded-full"
           />
           <motion.div
             animate={{ rotate: -360 }}
             transition={{ duration: 8, ease: "linear", repeat: Infinity }}
             className="absolute -inset-4 border border-dashed border-black/20 rounded-full"
           />
           <Sparkles className="w-10 h-10 text-black drop-shadow-sm" strokeWidth={1.5} />
        </div>

        {/* Text Sequence */}
        <div className="h-12 flex items-center justify-center mb-8 relative w-full overflow-hidden">
           <AnimatePresence mode="popLayout">
             <motion.p
               key={msgIdx}
               initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
               animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
               exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
               transition={{ duration: 0.25 }}
               className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500 whitespace-nowrap absolute"
             >
               {MESSAGES[msgIdx]}
             </motion.p>
           </AnimatePresence>
        </div>

        {/* Query Focus Target */}
        <motion.div 
           initial={{ scale: 0.95, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.3, duration: 0.6 }}
           className="border border-gray-200 bg-white shadow-sm py-4 px-10 mb-12 flex flex-col items-center gap-2 min-w-[240px]"
        >
           <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Target Vector</span>
           <span className="font-serif text-3xl text-black tracking-tight font-medium">{searchQuery || 'ALL ENTITIES'}</span>
        </motion.div>

        {/* Progress Bar Line */}
        <div className="w-full max-w-md h-px bg-gray-200 relative mb-3">
          <motion.div 
            className="absolute left-0 top-0 bottom-0 bg-black"
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ ease: "linear", duration: 0.2 }}
          />
        </div>
        <div className="w-full max-w-md flex justify-between font-mono text-[9px] text-gray-400 uppercase tracking-widest">
           <span>System Boot</span>
           <motion.span>
               {Math.min(Math.round(progress), 100)}%
           </motion.span>
        </div>
      </div>
    </div>
  );
}
