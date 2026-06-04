import React, { useState, useEffect } from 'react';
import { soundEngine } from '../utils/useSound';

export default function TypewriterText({ text, speed = 30, className = '', onComplete }: { text: string; speed?: number; className?: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    
    // Tiny delay before starting to feel natural
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.substring(0, i + 1));
        i++;
        
        if (i % 3 === 0) {
           soundEngine.playClick();
        }

        if (i >= text.length) {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, 200);

    return () => clearTimeout(startDelay);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}<span className="animate-pulse">_</span>
    </span>
  );
}
