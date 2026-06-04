import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Check } from 'lucide-react';

const mockTree = [
  { name: 'Projects', isDir: true, path: undefined, children: [
    { name: 'my-app', isDir: true, path: '/Users/admin/Projects/my-app' },
    { name: 'taobao-demo', isDir: true, path: '/Users/admin/Projects/taobao-demo' },
    { name: 'portfolio', isDir: true, path: '/Users/admin/Projects/portfolio' },
  ]},
  { name: 'Downloads', isDir: true, path: undefined, children: [] },
  { name: 'Documents', isDir: true, path: undefined, children: [] },
];

export default function FileTreePicker({ onSelect, onClose }: { onSelect: (path: string) => void, onClose: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({'Projects': true});
  const [selectedPath, setSelectedPath] = useState('');

  const toggle = (name: string) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[100] flex justify-center items-center p-4">
      <div className="bg-paper border-2 border-solid border-ink w-[400px] shadow-2xl flex flex-col font-mono text-sm">
        <div className="bg-ink text-paper p-3 flex justify-between items-center uppercase">
          <span>Select Directory</span>
          <button className="hover:text-red-400" onClick={onClose}>[X]</button>
        </div>
        
        <div className="p-4 h-[300px] overflow-y-auto space-y-1">
          {mockTree.map(node => (
            <div key={node.name}>
              <div 
                className={`flex items-center gap-2 p-1 cursor-pointer hover:bg-blueprint-blue-dim ${selectedPath === node.name ? 'bg-blueprint-grid' : ''}`}
                onClick={() => node.isDir ? toggle(node.name) : setSelectedPath(node.path || '')}
              >
                {node.isDir && (expanded[node.name] ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                {expanded[node.name] ? <FolderOpen size={14} /> : <Folder size={14} />}
                {node.name}
              </div>
              
              {expanded[node.name] && node.children && (
                <div className="ml-4 border-l border-dotted border-border-subtle pl-2">
                  {node.children.map(child => (
                    <div 
                      key={child.name}
                      onClick={() => setSelectedPath(child.path)}
                      className={`flex items-center gap-2 p-1 mt-1 cursor-pointer hover:bg-blueprint-blue-dim ${selectedPath === child.path ? 'bg-ink text-paper' : ''}`}
                    >
                      <Folder size={14} />
                      {child.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="border-t border-solid border-ink p-3 flex justify-between">
           <div className="truncate flex-1 font-bold">{selectedPath}</div>
           <button 
             className="btn-terminal primary px-4 py-1 ml-4"
             disabled={!selectedPath}
             onClick={() => onSelect(selectedPath)}
           >
             CONFIRM
           </button>
        </div>
      </div>
    </div>
  );
}
