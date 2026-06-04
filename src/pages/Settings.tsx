import React from 'react';
import { useStore } from '../store';
import { GlobalSettings } from '../types';
import ScrambleText from '../components/ScrambleText';
import { soundEngine } from '../utils/useSound';

export default function Settings() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const resetAll = useStore(state => state.resetAll);
  
  const sources = settings.skillSources;
  const targets = settings.defaultTargets;
  const outputs = settings.outputPrefs;

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSettings({ skillSources: e.target.value });
  };
  
  const toggleTarget = (target: "codex" | "claude-code" | "generic") => {
    const newTargets = targets.includes(target) 
       ? targets.filter(t => t !== target) 
       : [...targets, target];
    updateSettings({ defaultTargets: newTargets });
  };

  const toggleOutput = (output: string) => {
    const newOutputs = outputs.includes(output) 
       ? outputs.filter(o => o !== output) 
       : [...outputs, output];
    updateSettings({ outputPrefs: newOutputs });
  };

  return (
    <div className="space-y-12 pb-12 max-w-4xl pt-4 reveal-text">
      <header className="border-b-2 border-solid border-ink pb-4">
        <h2 className="text-display min-h-[1.2em] border-l-8 border-ink pl-4"><ScrambleText text="SETTINGS" /></h2>
        <div className="font-mono text-sm text-muted uppercase tracking-wide mt-2">
          Configure Agent Control & Output Preferences
        </div>
      </header>

      <section className="faq-box bg-paper relative">
        <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase">
          FIG_01: SOURCES
        </div>
        <div className="space-y-4">
          <label className="block font-mono text-sm uppercase font-bold">Skill Sources</label>
          <p className="font-serif text-sm text-muted">Directories to scan for available skills (one per line):</p>
          <textarea
            value={sources}
            onChange={handleSourceChange}
            rows={6}
            className="w-full border border-solid border-ink p-4 font-mono text-sm outline-none bg-blueprint-grid"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="faq-box bg-paper relative h-full">
          <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase tracking-wide">
            FIG_02: DEFAULT TARGETS
          </div>
          <div className="space-y-4">
            <label className="block font-mono text-sm uppercase font-bold">Default Target Agents</label>
            <div className="flex flex-col gap-3 font-mono text-sm text-muted">
              <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition-none">
                <span className="w-5">{targets.includes('codex') ? '[X]' : '[ ]'}</span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={targets.includes('codex')} 
                  onChange={() => toggleTarget('codex')}
                />
                CODEX
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition-none">
                <span className="w-5">{targets.includes('claude-code') ? '[X]' : '[ ]'}</span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={targets.includes('claude-code')} 
                  onChange={() => toggleTarget('claude-code')}
                />
                CLAUDE CODE
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition-none">
                <span className="w-5">{targets.includes('generic') ? '[X]' : '[ ]'}</span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={targets.includes('generic')} 
                  onChange={() => toggleTarget('generic')}
                />
                GENERIC AGENT
              </label>
            </div>
          </div>
        </section>

        <section className="faq-box bg-paper relative h-full">
          <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase tracking-wide">
            FIG_03: OUTPUT PREFS
          </div>
          <div className="space-y-4">
            <label className="block font-mono text-sm uppercase font-bold">Output Preferences</label>
            <div className="flex flex-col gap-3 font-mono text-sm text-muted">
              {[
                { id: 'agents', label: 'Generate AGENTS.md' },
                { id: 'claude', label: 'Generate CLAUDE.md' },
                { id: 'profile', label: 'Generate profile.json' },
                { id: 'policy', label: 'Generate skill-policy.md' },
                { id: 'prompt', label: 'Generate Session Prompt' }
              ].map(opt => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer hover:text-ink transition-none">
                  <span className="w-5">{outputs.includes(opt.id) ? '[X]' : '[ ]'}</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={outputs.includes(opt.id)} 
                    onChange={() => toggleOutput(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="border border-dotted border-ink p-6 bg-paper">
        <label className="block font-mono text-sm uppercase font-bold mb-4 flex items-center justify-between">
            <span>Recommendation Rules</span>
            <span className="blinking-cursor w-2 h-4 overflow-hidden" />
        </label>
        <div className="font-mono text-sm space-y-2">
          <div className="flex justify-between border-b border-dotted border-border-subtle pb-2">
            <span className="text-muted">Rule-based recommendation</span>
            <span className="text-blueprint-blue font-bold">[ ENABLED ]</span>
          </div>
          <div className="flex justify-between pt-2 opacity-50">
            <span className="text-muted">LLM recommendation</span>
            <span>&lt; NOT AVAILABLE IN V1 &gt;</span>
          </div>
        </div>
      </section>

      <section>
        <div className="ascii-divider !mt-12 !mb-6 text-red-600">░░░░░░░░░░ DANGER ZONE ░░░░░░░░░░</div>
        <div className="border border-solid border-red-600 p-6 bg-red-50 space-y-4 relative">
          <div className="absolute top-0 right-0 bg-red-600 text-white font-mono text-caption px-2 py-1 uppercase tracking-wide">
             WARN: IRREVERSIBLE
          </div>
          <div>
            <h4 className="font-mono text-sm font-bold text-red-700 uppercase">Reset Local State</h4>
            <p className="font-serif text-sm text-red-600 mt-1 mb-4">Wipe all local mock projects and active policy state from Zustand local-storage.</p>
            <button 
              className="btn-terminal border-red-600 text-red-600 hover:bg-red-600 hover:text-paper mt-3" 
              onClick={(e) => {
                if (window.confirm('This will wipe all active and historical policies. Continue?')) {
                   const section = e.currentTarget.closest('section');
                   if (section) section.classList.add('animate-glitch');
                   soundEngine.playError();
                   setTimeout(() => {
                     resetAll(); 
                     if (section) section.classList.remove('animate-glitch');
                     alert('Cache cleared.');
                   }, 300);
                }
              }}
            >
              [ PROCESS RESET ]
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
