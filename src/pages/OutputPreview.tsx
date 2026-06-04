import { useState, useEffect } from 'react';
import { useStore, knownSkills } from '../store';
import { Link } from 'react-router-dom';
import ScrambleText from '../components/ScrambleText';
import { exportPolicyZip } from '../utils/zipExporter';
import { soundEngine } from '../utils/useSound';

export default function OutputPreview() {
  const profile = useStore(state => state.profile);
  const settings = useStore(state => state.settings);
  const outputPrefs = settings.outputPrefs;
  const [activeTab, setActiveTab] = useState<'agents' | 'claude' | 'json' | 'prompt' | 'policy'>('prompt');
  const [copied, setCopied] = useState(false);

  // Auto-switch to first available tab based on preferences if prompt is disabled
  useEffect(() => {
    if (!outputPrefs.includes('prompt') && outputPrefs.length > 0) {
      setActiveTab(outputPrefs[0] as any);
    } // eslint-disable-next-line
  }, [outputPrefs]);

  if (!profile) {
    return (
      <div className="border border-solid border-ink p-8 text-center bg-blueprint-grid">
        <p className="font-serif text-lg mb-6">No policy to preview. Please generate one first.</p>
        <Link to="/setup" className="btn-terminal primary">Go to Project Setup</Link>
      </div>
    );
  }

  const enabledList = profile.skills.filter(s => s.activation === 'enabled').map(s => s.skillId);
  const manualList = profile.skills.filter(s => s.activation === 'manual_only').map(s => s.skillId);
  const disabledList = profile.skills.filter(s => s.activation === 'disabled').map(s => s.skillId);

  // Generate markdown content
  const agentsMd = `# Project Skill Policy

This project uses SkillGate to define project-level skill boundaries.

## Project Context

Project Name: ${profile.projectName}
Project Path: ${profile.projectPath}
Default Mode: ${profile.defaultMode}
Detected Project Type: ${profile.detectedProjectType || 'None'}
Requirement: ${profile.requirement || 'N/A'}

## Enabled Skills

Use these skills by default when relevant:

${enabledList.map(id => `- \`${id}\`\n  - ${profile.skills.find(s=>s.skillId===id)?.reason}`).join('\n\n')}

## Manual-Only Skills

Use these only when the user explicitly requests them:

${manualList.map(id => `- \`${id}\`\n  - ${profile.skills.find(s=>s.skillId===id)?.reason}`).join('\n\n')}

## Disabled By Default

Do not use these unless the user explicitly changes the project policy:

${disabledList.map(id => `- \`${id}\``).join('\n')}

## Conflict Rules

${profile.conflicts.map(c => `When ${c.skills.map(s => `\`${s}\``).join(' and ')} both apply:\n${Object.entries(c.responsibilities || {}).map(([skill, resp]) => `- Use \`${skill}\` for ${resp}`).join('\n')}`).join('\n\n')}

## Small Change Rule

For small code edits, keep changes scoped and avoid activating unnecessary Skill workflows.

## Enforcement Level

This is a Soft Policy. It guides agent behavior through project instructions and does not hard-disable skills at runtime.`;

  const claudeMd = agentsMd.replace('# Project Skill Policy', '# Claude Code Skill Policy\n\nFollow this project-level SkillGate policy when working in this repository.');
  
  const skillPolicyMd = agentsMd.replace('# Project Skill Policy', '# SkillGate Policy\n\nGeneric policy definition.');

  const sessionPrompt = `For this project, follow the SkillGate policy below.

Use only enabled skills by default. Manual-only skills require an explicit user request. Disabled skills should not be used unless the user changes the project policy.

Current project mode: ${profile.defaultMode}.

Enabled skills:
${enabledList.map(id => `- ${id}`).join('\n')}

Manual-only skills:
${manualList.map(id => `- ${id}`).join('\n')}

Disabled skills:
${disabledList.map(id => `- ${id}`).join('\n')}

${profile.conflicts.length > 0 ? '\n' + profile.conflicts.map(c => `When ${c.skills.join(' and ')} both apply, split responsibility:\n${Object.entries(c.responsibilities || {}).map(([skill, resp]) => `- ${skill} ${resp}`).join('\n')}`).join('\n\n') : ''}

For small code edits, bug fixes, copy updates, or simple style tweaks, keep changes scoped and avoid activating unnecessary Skill workflows.`;

  const jsonContent = JSON.stringify(profile, null, 2);

  const getActiveContent = () => {
    switch (activeTab) {
      case 'agents': return agentsMd;
      case 'claude': return claudeMd;
      case 'policy': return skillPolicyMd;
      case 'json': return jsonContent;
      case 'prompt': return sessionPrompt;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Collect all files natively
    const files = [];
    if (profile.targets.includes('codex')) {
      files.push({ name: 'AGENTS.md', content: agentsMd });
    }
    if (profile.targets.includes('claude-code')) {
      files.push({ name: 'CLAUDE.md', content: claudeMd });
    }
    files.push({ name: 'profile.json', content: jsonContent });
    files.push({ name: 'skill-policy.md', content: skillPolicyMd });
    
    // In a real app we'd use JSZip, but here we'll just download the currently viewed file or trigger multiple.
    // For V1 preview, let's just create a blob for the currently active tab.
    
    let content = getActiveContent();
    let filename = activeTab + '.txt';
    if (activeTab === 'agents') filename = 'AGENTS.md';
    if (activeTab === 'claude') filename = 'CLAUDE.md';
    if (activeTab === 'policy') filename = 'skill-policy.md';
    if (activeTab === 'json') filename = 'profile.json';
    if (activeTab === 'prompt') filename = 'session_prompt.md';

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    soundEngine.playSuccess();
    exportPolicyZip(profile, settings, {
      agents: agentsMd,
      claude: claudeMd,
      policy: skillPolicyMd,
      prompt: sessionPrompt
    });
  };

  return (
    <div className="space-y-12 pt-4 reveal-text">
      <header className="border-b-2 border-solid border-ink pb-4">
        <h2 className="text-display min-h-[1.2em] border-l-8 border-ink pl-4"><ScrambleText text="OUTPUT PREVIEW" /></h2>
        <div className="font-mono text-sm uppercase tracking-wide flex justify-between mt-4">
          <span>Targets: {profile.targets.join(', ')}</span>
          <span className="bg-ink text-paper px-2 py-0.5">Enforcement Level: Soft Policy</span>
        </div>
      </header>

      <section className="border border-solid border-ink bg-paper p-6 relative">
        <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase">
          FIG_01: SUMMARY
        </div>
        <h3 className="font-mono text-sm uppercase font-bold mb-4">Generated Outputs:</h3>
        <ul className="list-none m-0 pl-0 font-mono text-sm space-y-2">
          {profile.targets.includes('codex') && <li className="flex items-center gap-2"><span className="text-blueprint-blue">[*]</span> AGENTS.md</li>}
          {profile.targets.includes('claude-code') && <li className="flex items-center gap-2"><span className="text-blueprint-blue">[*]</span> CLAUDE.md</li>}
          <li className="flex items-center gap-2"><span className="text-blueprint-blue">[*]</span> .skillgate/profile.json</li>
          <li className="flex items-center gap-2"><span className="text-blueprint-blue">[*]</span> .skillgate/skill-policy.md</li>
          <li className="flex items-center gap-2"><span className="text-blueprint-blue">[*]</span> Session Prompt</li>
        </ul>
      </section>

      <section>
        <div className="ascii-divider !mt-0 !mb-8">░░░░░░░░░░ GENERATED ARTIFACTS ░░░░░░░░░░</div>
        
        <div className="border border-solid border-ink bg-paper flex flex-col min-h-[600px]">
          <div className="flex border-b border-solid border-ink overflow-x-auto">
            {outputPrefs.includes('prompt') && (
              <button 
                onClick={() => setActiveTab('prompt')}
                className={`px-4 py-3 font-mono text-sm uppercase whitespace-nowrap transition-none border-r border-solid border-ink ${activeTab === 'prompt' ? 'bg-blueprint-blue text-paper' : 'hover:bg-blueprint-blue-dim'}`}
              >
                Session Prompt
              </button>
            )}
            {outputPrefs.includes('agents') && (
              <button 
                onClick={() => setActiveTab('agents')}
                className={`px-4 py-3 font-mono text-sm uppercase whitespace-nowrap transition-none border-r border-solid border-ink ${activeTab === 'agents' ? 'bg-ink text-paper' : 'hover:bg-blueprint-blue-dim'}`}
              >
                AGENTS.md
              </button>
            )}
            {outputPrefs.includes('claude') && (
              <button 
                onClick={() => setActiveTab('claude')}
                className={`px-4 py-3 font-mono text-sm uppercase whitespace-nowrap transition-none border-r border-solid border-ink ${activeTab === 'claude' ? 'bg-ink text-paper' : 'hover:bg-blueprint-blue-dim'}`}
              >
                CLAUDE.md
              </button>
            )}
            {outputPrefs.includes('policy') && (
              <button 
                onClick={() => setActiveTab('policy')}
                className={`px-4 py-3 font-mono text-sm uppercase whitespace-nowrap transition-none border-r border-solid border-ink ${activeTab === 'policy' ? 'bg-ink text-paper' : 'hover:bg-blueprint-blue-dim'}`}
              >
                skill-policy.md
              </button>
            )}
            {outputPrefs.includes('profile') && (
              <button 
                onClick={() => setActiveTab('json')}
                className={`px-4 py-3 font-mono text-sm uppercase whitespace-nowrap transition-none border-r border-solid border-ink ${activeTab === 'json' ? 'bg-ink text-paper' : 'hover:bg-blueprint-blue-dim'}`}
              >
                profile.json
              </button>
            )}
            <div className="flex-1 bg-blueprint-grid min-w-[20px]"></div>
          </div>
          
          <div className="flex-1 p-0 relative bg-[#f9f9f9]">
            <textarea 
              readOnly 
              value={getActiveContent()}
              className="w-full h-full min-h-[500px] p-6 font-mono text-sm leading-relaxed resize-none outline-none bg-transparent"
            />
          </div>
          
          <div className="border-t border-solid border-ink p-4 bg-paper flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="font-mono text-sm text-muted">
              {activeTab === 'agents' && 'Put this file in your project root as AGENTS.md'}
              {activeTab === 'claude' && 'Put this file in your project root as CLAUDE.md'}
              {activeTab === 'policy' && 'Generic policy text for .skillgate/skill-policy.md'}
              {activeTab === 'json' && 'Machine-readable state for .skillgate/profile.json'}
              {activeTab === 'prompt' && 'Paste this directly into your agent chat session.'}
            </div>
            
            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              <button 
                className="btn-terminal flex-1 sm:flex-none border-b-2" 
                onClick={() => { soundEngine.playClick(); handleDownload(); }}
              >
                [ SAVE CURRENT ]
              </button>
              <button 
                className="btn-terminal primary flex-1 sm:flex-none border-b-2" 
                onClick={handleDownloadAll}
              >
                [ DOWNLOAD FULL ZIP ]
              </button>
              <button 
                className={`btn-terminal flex-1 sm:flex-none border-b-2 ${copied ? 'bg-ink text-paper' : ''}`} 
                onClick={() => { soundEngine.playClick(); handleCopy(); }}
              >
                {copied ? 'COPIED!' : 'COPY CONFIRMED'}
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
