import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ProjectSkillProfile } from '../types';
import ScrambleText from '../components/ScrambleText';
import { soundEngine } from '../utils/useSound';
import FileTreePicker from '../components/FileTreePicker';

export default function ProjectSetup() {
  const setProfile = useStore(state => state.setProfile);
  const analyzeRequirement = useStore(state => state.analyzeRequirement);
  const existingProfile = useStore(state => state.profile);
  const navigate = useNavigate();

  const [path, setPath] = useState(existingProfile?.projectPath || '');
  const [name, setName] = useState(existingProfile?.projectName || '');
  const [description, setDescription] = useState(existingProfile?.description || '');
  const [repositoryType, setRepositoryType] = useState(existingProfile?.repositoryType || '');
  const [framework, setFramework] = useState(existingProfile?.framework || '');
  const [language, setLanguage] = useState(existingProfile?.language || '');
  const [mode, setMode] = useState(existingProfile?.defaultMode || 'Frontend Mode');
  const [requirement, setRequirement] = useState(existingProfile?.requirement || '');
  const [targets, setTargets] = useState<Array<"codex" | "claude-code" | "generic">>(existingProfile?.targets || ['codex', 'claude-code']);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  
  const finishAnalysis = () => {
    const profileId = existingProfile?.id || `prj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Create skeleton profile
    const profile: ProjectSkillProfile = {
      id: profileId,
      version: '0.1.0',
      projectName: name || path.split(/[\/\\]/).pop() || 'Untitled',
      projectPath: path,
      description,
      repositoryType,
      framework,
      language,
      defaultMode: mode,
      requirement: requirement,
      targets: targets,
      skills: [],
      conflicts: [],
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setProfile(profile);
    analyzeRequirement(requirement);
    navigate('/policy');
  };

  const handleAnalyze = () => {
    if (!path) return alert('Please enter project path');
    
    setAnalyzing(true);
    setAnalysisLogs(['STARTING AI REQUIREMENT ANALYSIS...']);
    soundEngine.playClick();
    
    let step = 0;
    const steps = [
      'PARSING REQUIREMENT TEXT...',
      'EXTRACTING INTENT AND METADATA...',
      'SCANNING ~/.../.skills REGISTRY...',
      'MATCHING SKILLS TO INTENT...',
      'DETECTING POLICY CONFLICTS...',
      'SYNTHESIZING RESOLUTIONS...',
      'DONE. BUILDING POLICY.'
    ];
    
    const interval = setInterval(() => {
      if (step < steps.length) {
        setAnalysisLogs(prev => [...prev, steps[step]]);
        soundEngine.playClick();
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          soundEngine.playSuccess();
          finishAnalysis();
        }, 500);
      }
    }, 400);
  };

  const handleApplyDemoRequirement = () => {
    setRequirement('我要做一个淘宝网页，要有商品列表、搜索、购物车和结算页面，界面要像真实电商应用。');
    setName('taobao-demo');
    setPath('D:\\Projects\\taobao-demo');
    setMode('Ecommerce Mode');
  };

  const modes = [
    { id: 'Minimal Mode', desc: '适合小改动、Bug 修复、文案调整，只启用最少 Skill。' },
    { id: 'Frontend Mode', desc: '适合普通前端应用开发。' },
    { id: 'Design Mode', desc: '适合落地页、品牌页、作品集、视觉重构。' },
    { id: 'Ecommerce Mode', desc: '适合电商网页、商品展示、购物车、结算流程。' },
    { id: 'Docs Mode', desc: '适合文档、报告、说明书生成。' },
    { id: 'Strict Mode', desc: '适合团队项目、生产项目、大型代码库，只允许白名单 Skill。' }
  ];

  return (
    <div className="space-y-12 max-w-4xl pt-4 reveal-text">
      <header className="border-b-2 border-solid border-ink pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-display min-h-[1.2em] border-l-8 border-ink pl-4">
             <ScrambleText text="PROJECT SETUP" />
          </h2>
          <div className="font-mono text-sm text-muted uppercase tracking-wide mt-2">
            Define boundaries & analyze requirements
          </div>
        </div>
      </header>

      <section className="faq-box bg-paper relative">
        <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase">
          FIG_01: METADATA
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block font-mono text-sm uppercase mb-2">Project Path</label>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="D:\Projects\my-app"
                className="input-typewriter flex-1 text-base"
              />
              <button 
                className="btn-terminal whitespace-nowrap"
                onClick={() => {
                  soundEngine.playClick();
                  setShowPicker(true);
                }}
              >Browse</button>
              <button className="btn-terminal whitespace-nowrap">Scan</button>
            </div>
            {!path && (
              <p className="font-serif text-sm text-muted mt-2">
                输入项目路径后，SkillGate 将为该项目生成独立的 Skill Policy。
              </p>
            )}
            {showPicker && (
              <FileTreePicker 
                onClose={() => setShowPicker(false)} 
                onSelect={(p) => {
                  setPath(p);
                  setShowPicker(false);
                  soundEngine.playSuccess();
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block font-mono text-sm uppercase mb-2">Project Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-typewriter w-full text-base"
                />
              </div>
              <div>
                <label className="block font-mono text-sm uppercase mb-2">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input-typewriter w-full text-base"
                />
              </div>
              <div>
                <label className="block font-mono text-sm uppercase mb-2">Repository Type</label>
                <input 
                  type="text" 
                  value={repositoryType}
                  onChange={e => setRepositoryType(e.target.value)}
                  placeholder="e.g., Frontend App"
                  className="input-typewriter w-full text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-sm uppercase mb-2">Framework</label>
                  <input 
                    type="text" 
                    value={framework}
                    onChange={e => setFramework(e.target.value)}
                    placeholder="e.g., React"
                    className="input-typewriter w-full text-base"
                  />
                </div>
                <div>
                  <label className="block font-mono text-sm uppercase mb-2">Language</label>
                  <input 
                    type="text" 
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    placeholder="e.g., TypeScript"
                    className="input-typewriter w-full text-base"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block font-mono text-sm uppercase mb-2">Target Agents</label>
              <div className="flex flex-col gap-2 font-mono text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="w-5">{targets.includes('codex') ? '[X]' : '[ ]'}</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={targets.includes('codex')} 
                    onChange={e => e.target.checked ? setTargets([...targets, 'codex']) : setTargets(targets.filter(t => t !== 'codex'))}
                  />
                  CODEX
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="w-5">{targets.includes('claude-code') ? '[X]' : '[ ]'}</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={targets.includes('claude-code')} 
                    onChange={e => e.target.checked ? setTargets([...targets, 'claude-code']) : setTargets(targets.filter(t => t !== 'claude-code'))}
                  />
                  CLAUDE CODE
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="w-5">{targets.includes('generic') ? '[X]' : '[ ]'}</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={targets.includes('generic')} 
                    onChange={e => e.target.checked ? setTargets([...targets, 'generic']) : setTargets(targets.filter(t => t !== 'generic'))}
                  />
                  GENERIC AGENT
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="ascii-divider">░░░░░░░░░░ PROJECT MODE ░░░░░░░░░░</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map(m => (
            <div 
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`border border-solid p-4 cursor-pointer transition-none ${
                mode === m.id 
                  ? 'border-blueprint-blue bg-blueprint-blue-dim' 
                  : 'border-border-subtle hover:border-ink'
              }`}
            >
              <div className="font-mono text-sm uppercase font-bold mb-2 flex justify-between">
                {m.id}
                {mode === m.id && <span className="text-blueprint-blue">[*]</span>}
              </div>
              <div className="font-serif text-sm text-muted">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="faq-box bg-paper relative">
         <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase">
          FIG_02: REQUIREMENT
        </div>

        <div className="space-y-4">
          <label className="block font-mono text-sm uppercase">Requirement Input</label>
          <textarea
            value={requirement}
            onChange={e => setRequirement(e.target.value)}
            rows={5}
            placeholder="Describe what you want to build in a few sentences..."
            className="w-full border border-solid border-ink p-4 font-serif text-lg leading-relaxed focus:border-blueprint-blue outline-none resize-y"
          />
          <div className="flex gap-4">
            <button className="btn-terminal" onClick={handleApplyDemoRequirement}>
              Insert Demo Requirement
            </button>
            <button className="btn-terminal" onClick={() => setRequirement('')}>
              Clear
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-8">
        <button className="btn-terminal primary text-base px-8 py-4" onClick={handleAnalyze}>
          ANALYZE & RECOMMEND &#x25B6;
        </button>
      </div>

      {analyzing && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.8)] z-50 flex items-center justify-center p-4">
          <div className="bg-paper border-2 border-solid border-blueprint-blue p-8 w-full max-w-2xl text-ink font-mono shadow-2xl relative overflow-hidden">
             
             <div className="absolute inset-0 bg-blueprint-grid opacity-20" />
             <div className="absolute top-0 left-0 w-full h-1 bg-blueprint-blue animate-pulse" />
             <h3 className="text-xl font-bold mb-6 flex items-center gap-4">
               <span className="animate-spin border-t-2 border-l-2 border-ink w-4 h-4" />
               AI Requirement Analysis
             </h3>
             
             <div className="space-y-2 h-64 overflow-y-auto border border-dotted border-ink p-4 text-sm relative z-10">
               {analysisLogs.map((log, i) => (
                 <div key={i} className={i === analysisLogs.length - 1 ? "animate-pulse" : ""}>
                   <span className="text-blueprint-blue mr-2">[{new Date().toISOString().split('T')[1].substring(0, 8)}]</span>
                   {log}
                 </div>
               ))}
             </div>
             
          </div>
        </div>
      )}
    </div>
  );
}
