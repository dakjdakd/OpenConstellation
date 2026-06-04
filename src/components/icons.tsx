import React from 'react';

export const AISearchIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Magnifying glass handle */}
    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="square" />
    
    {/* Hexagon shape acting as the glass */}
    <path d="M10.5 17L5 13.5v-7L10.5 3l5.5 3.5v7z" strokeWidth="1.5" />
    
    {/* Center node */}
    <circle cx="10.5" cy="10" r="2" fill="currentColor"/>
    
    {/* Connections from center to vertices */}
    <path d="M10.5 10l5.5-3.5" strokeWidth="1" strokeDasharray="2 2"/>
    <path d="M10.5 10v7" strokeWidth="1" strokeDasharray="2 2"/>
    <path d="M10.5 10L5 6.5" strokeWidth="1" strokeDasharray="2 2"/>
  </svg>
);
