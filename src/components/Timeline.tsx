import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import AIGenerationBlock from './AIGenerationBlock';
import { AnimatePresence } from 'motion/react';
import TerminalPlayback from './TerminalPlayback';
import { fetchTimeline, type TimelineResponse } from '../api';
import type { GraphNode } from '../types';

export default function Timeline() {
  const { nodes, setIsolatedNodeId } = useAppStore();
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    void fetchTimeline().then((next) => {
      if (!cancelled) setTimeline(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const allEvents = (
    timeline?.items.map((event) => ({
      ...event,
      node: nodeById.get(event.node.id) ?? ({
        ...event.node,
        subtitle: '',
        description: '',
        popularity: 0,
        status: 'Active',
      } as GraphNode),
    })) ??
    nodes.flatMap(n =>
      (n.events || []).map(e => ({ ...e, node: n }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < allEvents.length) {
      setIsolatedNodeId(allEvents[currentIndex].node.id);
      if (itemRefs.current[currentIndex]) {
         itemRefs.current[currentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isPlaying, currentIndex, allEvents.length, setIsolatedNodeId]);

  const handleNext = () => {
    if (currentIndex < allEvents.length - 1) {
      setCurrentIndex(cur => cur + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePlayToggle = () => {
    if (!isPlaying) {
      if (currentIndex === allEvents.length - 1 || currentIndex === -1) {
        setCurrentIndex(0);
      } else {
        // If it was paused mid-way, just resume
      }
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full h-full pt-14 pb-32 px-6 overflow-y-auto grid-bg relative" ref={scrollRef}>
      <AnimatePresence>
        {isPlaying && currentIndex >= 0 && (
          <TerminalPlayback 
            events={allEvents} 
            currentIndex={currentIndex} 
            onNext={handleNext} 
            onExit={() => setIsPlaying(false)} 
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto mt-24">
        <h1 className="font-serif text-5xl font-bold tracking-tight mb-4">Chronology</h1>
        <p className="font-sans text-gray-500 mb-12">The evolution of AI over time. Events, releases, and milestones.</p>
        
        <div className="mb-16">
          <AIGenerationBlock 
            content="Historical analysis indicates accelerating breakthrough frequencies, notably compressing the interval between foundational architecture papers (2017) and consumer-scale deployments (2022+)."
            confidence={0.97}
            label="Epoch Synthesis"
          />
        </div>

        <div className="border-l border-black pl-8 space-y-16 relative">
          <div className="absolute top-0 bottom-0 left-[-1px] border-l border-gray-200 -z-10"></div>
          
          {allEvents.length === 0 && (
            <p className="font-sans text-gray-400">No events recorded in the current timeline.</p>
          )}

          {allEvents.map((evt, idx) => {
            const dateStr = new Date(evt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const isHighlighted = currentIndex === idx;
            return (
              <div key={idx} ref={el => itemRefs.current[idx] = el} className={`relative group transition-opacity duration-500 ${isPlaying && !isHighlighted ? 'opacity-30' : 'opacity-100'}`}>
                <div className={`absolute -left-10 w-4 h-4 border rounded-full shadow-sm mt-1 transition-all duration-300 ${isHighlighted ? 'bg-black border-black scale-125' : 'bg-white border-gray-300 hover:scale-125'}`}></div>
                <p className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-2">
                  {dateStr}
                  <span className="mx-2">·</span>
                  <Link to={`/node/${evt.node.id}`} className="text-gray-500 hover:text-black hover:underline">{evt.node.name}</Link>
                </p>
                <h3 className={`font-serif text-2xl font-medium mb-2 transition-colors ${isHighlighted ? 'text-indigo-600' : 'text-black'}`}>{evt.title}</h3>
                <p className="font-sans text-sm leading-relaxed text-gray-600 max-w-2xl">{evt.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Playback Controls Overlay */}
      {!isPlaying && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 p-4 shadow-xl flex items-center gap-4 z-40 transition-opacity duration-300">
          <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500 border-r border-gray-200 pr-4">
              Terminal Engine
          </div>
          <button 
            onClick={handlePlayToggle} 
            className="flex items-center gap-2 font-sans text-sm font-medium hover:text-emerald-600 transition-colors"
          >
              <Play className="w-4 h-4 fill-current"/> Initialize Cyber-Terminal
          </button>
          <div className="text-xs font-mono text-gray-400 text-right shrink-0">
            {currentIndex >= 0 ? `${currentIndex + 1}/${allEvents.length}` : `0/${allEvents.length}`}
          </div>
        </div>
      )}
    </div>
  );
}
