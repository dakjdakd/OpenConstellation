interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  isSimulating?: boolean;
}

export default function ProgressBar({ progress, label, isSimulating }: ProgressBarProps) {
  const displayProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="flex flex-col gap-1 w-full max-w-sm">
      {label && (
        <div className="font-mono text-caption uppercase flex justify-between">
          <span>{label} {isSimulating && <span className="animate-pulse ml-1 text-blueprint-blue">_</span>}</span>
          <span>{Math.round(displayProgress)}%</span>
        </div>
      )}
      <div 
        className="w-full inline-flex h-4 bg-blueprint-grid" 
        style={{ border: '1px solid var(--color-blueprint-blue)', padding: '2px' }}
      >
        <div 
          className="h-full bg-blueprint-blue transition-none" 
          style={{ 
            width: `${displayProgress}%`, 
            borderRight: displayProgress > 0 && displayProgress < 100 ? '1px solid var(--color-paper)' : 'none' 
          }}
        />
        <div 
          className="h-full bg-blueprint-blue-dim"
          style={{
            width: `${100 - displayProgress}%`,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, var(--color-blueprint-blue-dim) 2px, var(--color-blueprint-blue-dim) 4px)'
          }}
        />
      </div>
    </div>
  );
}
