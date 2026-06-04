import React, { useEffect, useState, useRef } from 'react';

export default function BlueprintIllustration() {
  const [key, setKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1, y: -1 });

  // Allow retriggering the draw animation occasionally or manually
  useEffect(() => {
    const timer = setInterval(() => setKey(k => k + 1), 10000); // Re-draw every 10 seconds for flavor
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -1, y: -1 });
  };

  const isHovered = mousePos.x >= 0 && mousePos.y >= 0;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[300px] border border-solid border-ink bg-blueprint-grid overflow-hidden flex items-center justify-center p-8 group cursor-crosshair"
    >
      <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase z-10">
        FIG_00: AXONOMETRIC CORE
      </div>
      
      {/* SVG drawing with Axonometric projection, pure blueprint blue */}
      <svg 
        key={key}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        className="stroke-blueprint-blue fill-transparent"
      >
        {isHovered && (
          <>
            <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="100%" stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="2 4" className="opacity-50" />
            <line x1="0" y1={mousePos.y} x2="100%" y2={mousePos.y} stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="2 4" className="opacity-50" />
            
            <circle cx={mousePos.x} cy={mousePos.y} r="3" fill="var(--color-ink)" stroke="none" />
            
            <rect x={mousePos.x + 10} y={mousePos.y + 10} width="95" height="40" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="1" />
            <text x={mousePos.x + 15} y={mousePos.y + 25} fill="var(--color-ink)" stroke="none" fontSize="10" fontFamily="var(--font-mono)">
              X: {Math.round(mousePos.x)}
            </text>
            <text x={mousePos.x + 15} y={mousePos.y + 40} fill="var(--color-ink)" stroke="none" fontSize="10" fontFamily="var(--font-mono)">
              Y: {Math.round(mousePos.y)}
            </text>
          </>
        )}
      </svg>
      
      <svg 
        key={key + '-base'}
        viewBox="0 0 400 300" 
        className="w-full h-full stroke-blueprint-blue fill-transparent relative z-0 pointer-events-none"
        style={{ strokeWidth: '1.5px', vectorEffect: 'non-scaling-stroke' }}
      >
        {/* The Box Bottom (Isometric) */}
        <path 
          className="svg-draw-in animate-draw" 
          d="M 200 240 L 100 180 L 200 120 L 300 180 Z"
          style={{ strokeDasharray: '600', strokeDashoffset: '600' }}
        />
        {/* Vertical posts */}
        <line className="svg-draw-in animate-draw delay-200" x1="100" y1="180" x2="100" y2="100" />
        <line className="svg-draw-in animate-draw delay-200" x1="200" y1="240" x2="200" y2="160" />
        <line className="svg-draw-in animate-draw delay-200" x1="300" y1="180" x2="300" y2="100" />
        <line className="svg-draw-in animate-draw delay-200" x1="200" y1="120" x2="200" y2="40" strokeDasharray="4 4" />
        {/* The Box Top */}
        <path 
          className="svg-draw-in animate-draw delay-400" 
          d="M 200 160 L 100 100 L 200 40 L 300 100 Z"
        />
        {/* Center Platter - Exploded Up */}
        <path 
          className="svg-draw-in animate-draw delay-600" 
          d="M 200 110 L 140 75 L 200 40 L 260 75 Z"
          fill="var(--color-blueprint-blue-dim)"
        />
        <line className="svg-draw-in animate-draw delay-500" x1="200" y1="110" x2="200" y2="160" strokeDasharray="2 4" />

        {/* Leader Lines and Labels */}
        <line className="svg-draw-in animate-draw delay-1000" x1="140" y1="75" x2="60" y2="50" markerEnd="url(#dot)" />
        <line className="svg-draw-in animate-draw delay-1000" x1="260" y1="75" x2="340" y2="100" markerEnd="url(#dot)" />
        <line className="svg-draw-in animate-draw delay-1000" x1="200" y1="240" x2="300" y2="280" markerEnd="url(#dot)" />
        
        {/* Definition for leader line dots */}
        <defs>
          <marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4">
            <circle cx="5" cy="5" r="3" fill="var(--color-border-solid)" />
          </marker>
        </defs>

        <text x="50" y="45" className="font-mono text-[8px] fill-ink stroke-none uppercase reveal-text" style={{ animationDelay: '1.2s' }}>POLICY BASE</text>
        <text x="345" y="105" className="font-mono text-[8px] fill-ink stroke-none uppercase reveal-text" style={{ animationDelay: '1.2s' }}>SKILL REPOSITORY</text>
        <text x="305" y="285" className="font-mono text-[8px] fill-ink stroke-none uppercase reveal-text" style={{ animationDelay: '1.2s' }}>PROJECT FOUNDATION</text>
      </svg>
    </div>
  );
}
