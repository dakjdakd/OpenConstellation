import React, { useEffect, useState } from 'react';
import { soundEngine } from '../utils/useSound';

const LOGS = [
  'BIOS CHECK ... OK',
  'LOADING KERNEL ... RAMDISK MOUNTED',
  'INITIALIZING SKILLGATE V1.0',
  'CHECKING AUDIO INTERFACES ... DETECTED',
  'LOADING VECTOR MODULES ... DONE',
  'SYNCING PROFILE REPOSITORIES ... STANDBY',
  'WELCOME TO SKILLGATE.'
];

export default function BootSplash({ onComplete }: { onComplete: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    let index = 0;
    
    // Auto-init audio ctx trick on first mount isn't fully reliable without user interaction,
    // but works if they previously interacted.
    // So we just play the visual logs fast.
    
    const interval = setInterval(() => {
      if (index < LOGS.length) {
        setLogs(prev => [...prev, LOGS[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setGlitch(true);
          soundEngine.playSuccess();
          setTimeout(() => onComplete(), 200); // 200ms glitch out
        }, 300);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-ink z-[99999] flex flex-col justify-end p-8 text-paper ${glitch ? 'animate-glitch' : ''}`}>
      <div className="flex flex-col gap-2 boot-splash-text">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
        {logs.length < LOGS.length && <div className="animate-pulse">_</div>}
      </div>
    </div>
  );
}
