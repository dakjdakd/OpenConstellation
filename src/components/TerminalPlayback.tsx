import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Square, SkipForward } from 'lucide-react';
import { GraphNode } from '../types';

export interface TimelineEvent {
  title?: string;
  date: string;
  description: string;
  node: GraphNode;
}

interface TerminalPlaybackProps {
  events: TimelineEvent[];
  currentIndex: number;
  onExit: () => void;
  onNext: () => void;
}

const TypewriterText = ({ text, delay = 0, speed = 20 }: { text: string, delay?: number, speed?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setStarted(false);
    
    const timeout = setTimeout(() => {
      setStarted(true);
      let currentIndex = 0;
      const interval = setInterval(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
        if (currentIndex === text.length) {
          clearInterval(interval);
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay, speed]);

  return (
    <span>
      {displayText}
      {started && displayText.length < text.length && (
        <span className="inline-block w-2 bg-emerald-500 h-4 ml-1 animate-pulse"></span>
      )}
    </span>
  );
};

export default function TerminalPlayback({ events, currentIndex, onExit, onNext }: TerminalPlaybackProps) {
  const event = events[currentIndex];

  useEffect(() => {
    if (!event) return;
    
    // Auto advance timeline
    const readDelay = event.description.length * 50 + 4000; 
    
    const timer = setTimeout(() => {
      onNext();
    }, readDelay);
    
    return () => clearTimeout(timer);
  }, [currentIndex, event, onNext]);

  if (!event) return null;

  const dateStr = new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-neutral-950 text-emerald-500 font-mono flex flex-col overflow-hidden"
    >
      {/* Scanlines and vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] z-10" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 z-20" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full relative z-30">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
             <div className="flex items-center gap-4 text-xs font-semibold tracking-[0.2em] uppercase text-emerald-700 mb-6">
                <span className="w-2 h-2 bg-emerald-500 animate-pulse"></span>
                <span><TypewriterText text="SYSTEM // DECRYPTING ARCHIVE_ENTRY" delay={100} speed={40} /></span>
                <span className="ml-auto opacity-50">[{currentIndex + 1}/{events.length}]</span>
             </div>

             <div className="border border-emerald-900/50 bg-emerald-950/20 p-8 backdrop-blur-sm relative">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-500"></div>

                <div className="text-emerald-400 opacity-60 text-sm mb-4 flex items-center gap-2">
                  <span>&gt;</span>
                  <TypewriterText text={`${dateStr} :: NODE_REF[${event.node.name.replace(/ /g, '_').toUpperCase()}]`} delay={1000} speed={40} />
                </div>
                
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-emerald-50 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                  <TypewriterText text={event.title || 'UNKNOWN_EVENT'} delay={2000} speed={30} />
                </h2>
                
                <div className="text-emerald-300/80 leading-relaxed text-lg whitespace-pre-wrap min-h-[100px]">
                  <TypewriterText text={event.description} delay={3000} speed={25} />
                </div>
             </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 inset-x-0 h-16 border-t border-emerald-900/30 flex items-center justify-between px-8 z-40 bg-neutral-950/80">
         <div className="text-emerald-600 text-xs flex items-center gap-2">
            <span className="inline-block w-1 h-3 bg-emerald-700 animate-pulse"></span>
            CONNECTION: SECURE
         </div>
         <div className="flex items-center gap-6">
            <button 
              onClick={onNext}
              className="text-emerald-500 hover:text-white transition-colors flex items-center gap-2 text-sm group"
            >
              <SkipForward className="w-4 h-4" /> 
              <span className="hidden sm:inline">FORCE_NEXT_ENTRY</span>
            </button>
            <button 
              onClick={onExit}
              className="text-emerald-500 hover:text-red-400 transition-colors flex items-center gap-2 text-sm group"
            >
              <Square className="w-4 h-4" /> 
              <span className="hidden sm:inline">TERMINATE_LINK</span>
            </button>
         </div>
      </div>
    </motion.div>
  );
}
