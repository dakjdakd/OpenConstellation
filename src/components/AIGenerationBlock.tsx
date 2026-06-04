import React, { useState, useEffect } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface AIGenerationBlockProps {
  content: string;
  confidence?: number;
  label?: string;
  className?: string;
}

export default function AIGenerationBlock({ content, confidence, label = "AI Insight", className }: AIGenerationBlockProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    setDisplayedContent('');
    setIsGenerating(true);
    let currentIndex = 0;
    
    // Simulate thinking delay
    const initialDelay = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < content.length) {
          setDisplayedContent(content.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsGenerating(false);
        }
      }, 15); // typing speed
      
      return () => clearInterval(interval);
    }, 600); // 600ms initial thinking
    
    return () => clearTimeout(initialDelay);
  }, [content]);

  return (
    <div className={clsx("relative p-6 border border-gray-200 bg-white shadow-sm overflow-hidden", className)}>
      {/* Brand line */}
      <div className={clsx(
        "absolute top-0 left-0 w-1 rounded-l-sm transition-all duration-1000",
        isGenerating ? "h-1/2 bg-gray-400 animate-pulse" : "h-full bg-black"
      )} />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 text-black" />
          )}
          <h3 className="font-mono text-[10px] uppercase tracking-widest font-medium text-gray-500">
            {isGenerating ? 'Synthesizing...' : label}
          </h3>
        </div>
        
        {confidence !== undefined && !isGenerating && (
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-gray-400 uppercase tracking-widest">Confidence</span>
            <span className="bg-gray-100 px-1.5 py-0.5 text-black">{(confidence * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="relative min-h-[60px]">
        {/* Skeleton while empty */}
        {displayedContent === '' && isGenerating && (
          <div className="space-y-2 animate-pulse mt-2">
            <div className="h-2 bg-gray-100 rounded w-full"></div>
            <div className="h-2 bg-gray-100 rounded w-5/6"></div>
            <div className="h-2 bg-gray-100 rounded w-4/6"></div>
          </div>
        )}
        
        {displayedContent !== '' && (
          <p className="font-sans text-sm leading-relaxed text-gray-800">
            {displayedContent}
            {isGenerating && <span className="inline-block w-1.5 h-3 ml-1 bg-black animate-pulse"></span>}
          </p>
        )}
      </div>
    </div>
  );
}
