import { useState } from 'react';
import { useStore, knownSkills } from '../store';
import { SkillEntry } from '../types';
import ScrambleText from '../components/ScrambleText';
import ProgressBar from '../components/ProgressBar';
import FileTreePicker from '../components/FileTreePicker';

export default function SkillRegistry() {
  const lastScanTime = useStore(state => state.lastScanTime);
  const setLastScanTime = useStore(state => state.setLastScanTime);

  const [selectedSkill, setSelectedSkill] = useState<SkillEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterActivation, setFilterActivation] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 20;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setLastScanTime(new Date().toLocaleTimeString());
        setTimeout(() => setIsScanning(false), 500);
      }
      setScanProgress(current);
    }, 150);
  };

  const categories = Array.from(new Set(knownSkills.map(s => s.category)));
  
  // Category stats
  const categoryStats = categories.reduce((acc, cat) => {
    acc[cat] = knownSkills.filter(s => s.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const filteredSkills = knownSkills.filter(skill => {
    if (filterCategory !== 'all' && skill.category !== filterCategory) return false;
    if (filterPlatform !== 'all' && skill.platform !== filterPlatform) return false;
    if (filterRisk !== 'all' && skill.risk !== filterRisk) return false;
    if (filterActivation !== 'all' && skill.defaultActivation !== filterActivation) return false;
    if (searchTerm && !skill.name.toLowerCase().includes(searchTerm.toLowerCase()) && !skill.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const DesktopDetailView = () => (
    <div className="hidden lg:block w-full lg:w-1/3 border border-solid border-ink bg-blueprint-grid p-6 overflow-y-auto relative min-h-[300px]">
      <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase tracking-wide">
        FIG_03: DETAILS
      </div>
      <DetailContent skill={selectedSkill} />
    </div>
  );

  const MobileDetailOverlay = () => {
    if (!selectedSkill) return null;
    return (
      <div className="lg:hidden fixed inset-0 z-50 bg-[#000000cc] flex items-end justify-center">
        <div className="bg-paper w-full max-h-[85vh] border-t-2 border-ink flex flex-col slide-up overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-ink bg-blueprint-grid">
            <span className="font-mono text-sm uppercase font-bold text-blueprint-blue bg-paper px-2 py-1 border border-blueprint-blue">FIG_03: DETAILS</span>
            <button onClick={() => setSelectedSkill(null)} className="btn-terminal border-none font-pixel text-xl leading-none px-4">&times;</button>
          </div>
          <div className="p-6 overflow-y-auto w-full">
            <DetailContent skill={selectedSkill} />
          </div>
        </div>
      </div>
    );
  };

  const DetailContent = ({ skill }: { skill: SkillEntry | null }) => {
    if (!skill) return (
      <div className="h-full flex items-center justify-center text-center font-mono text-sm text-muted uppercase">
        Select a skill<br/>to view details <span className="blinking-cursor"></span>
      </div>
    );
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-pixel text-title break-all leading-tight mb-2 mt-4">{skill.name}</h3>
          <div className="font-mono text-caption text-muted mt-1">&gt; ID: {skill.id}</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between border-b border-dotted border-border-subtle pb-1">
            <span className="font-mono text-caption uppercase text-muted">Platform</span>
            <span className="font-mono text-caption uppercase">[{skill.platform}]</span>
          </div>
          <div className="flex justify-between border-b border-dotted border-border-subtle pb-1">
            <span className="font-mono text-caption uppercase text-muted">Category</span>
            <span className="font-mono text-caption uppercase">&lt;{skill.category}&gt;</span>
          </div>
          <div className="flex justify-between border-b border-dotted border-border-subtle pb-1">
            <span className="font-mono text-caption uppercase text-muted">Risk</span>
            <span className={`font-mono text-caption uppercase px-1 ${skill.risk === 'high' ? 'bg-ink text-paper' : 'font-bold'}`}>{skill.risk}</span>
          </div>
          <div className="flex justify-between border-b border-dotted border-border-subtle pb-1">
            <span className="font-mono text-caption uppercase text-muted">Default</span>
            <span className="font-mono text-caption uppercase">{skill.defaultActivation}</span>
          </div>
        </div>

        <div>
           <div className="font-mono text-sm uppercase font-bold mb-2 flex items-center">&gt; Description <span className="blinking-cursor w-1.5 h-3 ml-2"></span></div>
          <div className="font-serif text-base border-l-2 border-blueprint-blue pl-3">{skill.description}</div>
        </div>

        {skill.sourcePath && (
          <div>
            <div className="font-mono text-sm uppercase font-bold mb-2">&gt; Source Path</div>
            <div className="font-mono text-caption bg-paper border border-dotted border-ink p-2 break-all text-muted">
              {skill.sourcePath}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 h-full flex flex-col pt-4 reveal-text relative">
      <header className="border-b-2 border-solid border-ink pb-4 shrink-0 flex flex-col md:flex-row md:items-end justify-between">
        <div>
          <h2 className="text-display min-h-[1.2em] border-l-8 border-ink pl-4"><ScrambleText text="SKILL REGISTRY" /></h2>
          <div className="flex items-center gap-4 font-mono text-sm mt-4 flex-wrap">
            <span className="bg-ink text-paper px-2 py-1 uppercase border border-solid border-ink">Detected: {knownSkills.length}</span>
            <span className="text-muted border border-dotted border-ink px-2 py-1 hidden sm:block">Last Scan: {lastScanTime || 'N/A'}</span>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
          {!isScanning ? (
            <div className="flex gap-2">
              <button className="btn-terminal border-b-2 whitespace-nowrap" onClick={startScan}>[ SCAN LOCAL SKILLS ]</button>
              <button className="btn-terminal border-b-2 whitespace-nowrap" onClick={() => setShowPicker(true)}>[ ADD CUSTOM ]</button>
            </div>
          ) : (
            <div className="w-[200px] border border-solid border-ink bg-paper p-2">
              <ProgressBar progress={scanProgress} isSimulating={true} />
            </div>
          )}
        </div>
      </header>

      {showPicker && (
        <FileTreePicker 
          onClose={() => setShowPicker(false)}
          onSelect={(path) => {
            setShowPicker(false);
            alert(`Scanning ${path}...\n\nResult:\nError: Invalid SKILL.md found at path. Custom skill import aborted.`);
          }}
        />
      )}

      {/* Category Stats */}
      <section className="shrink-0 flex flex-wrap gap-2">
        {Object.entries(categoryStats).map(([cat, count]) => (
          <div key={cat} className="font-mono text-caption uppercase border border-dotted border-ink px-2 py-1 bg-paper flex items-center justify-between min-w-[120px]">
             <span className="text-muted mr-4">&lt; {cat} &gt;</span>
            <span className="font-bold">[{count}]</span>
          </div>
        ))}
      </section>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 relative">
        {/* Left column: List and filters */}
        <div className="w-full lg:w-2/3 flex flex-col min-h-0">
          <div className="flex flex-wrap gap-2 mb-4 shrink-0 bg-paper p-2 border border-solid border-ink border-b-2">
            <input 
              type="text" 
              placeholder="SEARCH SKILLS..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-typewriter flex-1 min-w-[150px] text-sm uppercase px-2 bg-transparent"
            />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border-none font-mono text-caption uppercase outline-none bg-paper cursor-pointer p-1">
              <option value="all">&lt; CAT: ALL &gt;</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="border-none font-mono text-caption uppercase outline-none bg-paper cursor-pointer p-1 border-l border-dotted border-ink">
              <option value="all">PLAT: ALL</option>
              <option value="codex">codex</option>
              <option value="claude-code">claude-code</option>
              <option value="generic">generic</option>
            </select>
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="border-none font-mono text-caption uppercase outline-none bg-paper cursor-pointer p-1 border-l border-dotted border-ink hidden sm:inline-block">
              <option value="all">RISK: ALL</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto border border-solid border-ink bg-paper shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-ink text-paper font-mono text-caption uppercase sticky top-0 z-10 hidden sm:table-header-group">
                <tr>
                  <th className="py-2 px-4 font-normal tracking-wide">Skill Name</th>
                  <th className="py-2 px-4 font-normal tracking-wide">Category</th>
                  <th className="py-2 px-4 font-normal tracking-wide text-center">Risk</th>
                  <th className="py-2 px-4 font-normal tracking-wide whitespace-nowrap">Default</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map(skill => (
                  <tr 
                    key={skill.id}
                    onClick={() => setSelectedSkill(skill)}
                    className={`border-t border-dotted border-ink cursor-pointer transition-none flex flex-col sm:table-row py-2 sm:py-0 ${
                      selectedSkill?.id === skill.id ? 'bg-blueprint-blue-dim' : 'hover:bg-border-subtle/30'
                    }`}
                  >
                    <td className="py-1 px-4 sm:py-3 font-mono text-sm font-bold flex flex-wrap gap-2 items-center">
                      <span className="sm:hidden font-mono text-xs font-normal text-muted w-16">ID:</span>
                      {skill.name}
                    </td>
                    <td className="py-1 px-4 sm:py-3 font-mono text-caption uppercase w-[160px]">
                       <span className="sm:hidden font-mono text-xs font-normal text-muted w-16 inline-block">CAT:</span>
                       &lt; {skill.category} &gt;
                    </td>
                    <td className="py-1 px-4 sm:py-3 font-mono text-caption uppercase text-left sm:text-center w-[80px]">
                      <span className="sm:hidden font-mono text-xs font-normal text-muted w-16 inline-block">RISK:</span>
                      <span className={`px-2 py-0.5 border border-solid ${
                        skill.risk === 'high' ? 'border-ink text-paper bg-ink' : 
                        skill.risk === 'medium' ? 'border-blueprint-blue text-blueprint-blue bg-white' : 
                        'border-border-subtle bg-white'
                      }`}>
                        {skill.risk}
                      </span>
                    </td>
                    <td className="py-1 px-4 sm:py-3 font-mono text-caption uppercase w-[140px] whitespace-nowrap">
                       <span className="sm:hidden font-mono text-xs font-normal text-muted w-16 inline-block">DEF:</span>
                       [ {skill.defaultActivation.replace('_candidate', '')} ]
                    </td>
                  </tr>
                ))}
                {filteredSkills.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center font-mono uppercase text-muted text-sm">
                      NO RECORDS MATCH CURRENT FILTER
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Detail Panel (Desktop only) */}
        <DesktopDetailView />
        <MobileDetailOverlay />
      </div>
    </div>
  );
}
