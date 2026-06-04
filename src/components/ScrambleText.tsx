import { useEffect, useState, useRef } from 'react';

const CHARACTERS = '#$@%&!*?^~X<>[]/';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

export default function ScrambleText({ text, className }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    let chars = 0;
    const length = text.length;
    
    // Very quick mechanical scramble rate
    const interval = setInterval(() => {
      chars += 1.5; // Decrypt 1-2 characters per frame
      if (chars >= length) {
        clearInterval(interval);
        setDisplayText(text);
        isAnimating.current = false;
        return;
      }
      
      let newText = '';
      for (let i = 0; i < length; i++) {
        if (i < chars || text[i] === ' ') {
          newText += text[i];
        } else {
          newText += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        }
      }
      setDisplayText(newText);
    }, 40);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{displayText}</span>;
}
