import React, { useState } from 'react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { AISearchIcon } from './icons';

export default function LandingScreen() {
  const { setAppState, setSearchQuery } = useAppStore();
  const [localQuery, setLocalQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localQuery.trim()) return;
    
    // Set query and transition to generating
    setSearchQuery(localQuery);
    setAppState('generating');
  };

  return (
    <div className="relative w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden">
      {/* Subtle background grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      <div className="z-10 w-full max-w-3xl px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
        
        {/* Soft white glow behind text to cover grid dots */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,1)_30%,rgba(255,255,255,0.7)_50%,transparent_75%)] -z-10 pointer-events-none scale-150"></div>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-center text-black mb-6">
          Atlas of<br />Intelligence
        </h1>
        
        <p className="font-sans text-gray-500 mb-12 text-center max-w-lg mx-auto text-lg">
          Map the topology of artificial intelligence, foundational models, and corporate networks.
        </p>

        <form onSubmit={handleSubmit} className="w-full relative group">
          <AISearchIcon className={`absolute z-10 pointer-events-none left-4 md:left-6 top-1/2 -translate-y-1/2 w-5 md:w-6 h-5 md:h-6 transition-all duration-500 ${isFocused ? 'text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.3)] scale-110' : 'text-gray-400 scale-100'}`} />
          <input 
            type="text" 
            placeholder="Search for an entity, model, or concept to begin..." 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-16 md:h-20 bg-white/80 backdrop-blur-md border border-gray-200 focus:border-black shadow-xl focus:shadow-2xl rounded-2xl pl-12 md:pl-16 pr-28 md:pr-36 font-serif text-base md:text-2xl focus:outline-none transition-all placeholder:text-gray-400"
            autoFocus
          />
          <button 
            type="submit"
            className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all ${
              localQuery.trim() ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            Launch
          </button>
        </form>

        <div className="mt-12 flex gap-4 text-gray-400 font-mono text-[10px] uppercase tracking-widest">
           <span>Suggested:</span>
           <button onClick={() => setLocalQuery('Transformer')} className="hover:text-black hover:underline cursor-pointer transition-colors">Transformer</button>
           <span>·</span>
           <button onClick={() => setLocalQuery('OpenAI')} className="hover:text-black hover:underline cursor-pointer transition-colors">OpenAI</button>
           <span>·</span>
           <button onClick={() => setLocalQuery('Agent')} className="hover:text-black hover:underline cursor-pointer transition-colors">Agent</button>
        </div>
      </div>
    </div>
  );
}
