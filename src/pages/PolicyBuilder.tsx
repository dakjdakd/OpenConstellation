import { Link, useNavigate } from 'react-router-dom';
import { useStore, knownSkills } from '../store';
import { SkillActivation } from '../types';
import ScrambleText from '../components/ScrambleText';

export default function PolicyBuilder() {
  const profile = useStore(state => state.profile);
  const updateSkillState = useStore(state => state.updateSkillState);
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="border border-solid border-ink p-8 text-center bg-blueprint-grid">
        <p className="font-serif text-lg mb-6">No project profile active. Please define requirements first.</p>
        <Link to="/setup" className="btn-terminal primary">Go to Project Setup</Link>
      </div>
    );
  }

  const enabledSkills = profile.skills.filter(s => s.activation === 'enabled');
  const manualSkills = profile.skills.filter(s => s.activation === 'manual_only');
  const disabledSkills = profile.skills.filter(s => s.activation === 'disabled');

  const getSkillDetails = (id: string) => knownSkills.find(k => k.id === id);

  const handleActivationChange = (skillId: string, newActivation: SkillActivation, details: any) => {
    if (newActivation === 'enabled' && details.risk === 'high') {
      const isConfirmed = window.confirm(
        `WARNING: High Risk Skill [${details.name}]\n\n` +
        `This skill may execute deployments, scans, or high-impact operations. ` +
        `Are you absolutely sure you want to ENABLE this by default for the project?`
      );
      if (!isConfirmed) return;
    }
    
    updateSkillState(skillId, { 
      activation: newActivation, 
      reason: 'User override' 
    });
  };

  const renderSkillRow = (skill: any, currentActivation: SkillActivation) => {
    const details = getSkillDetails(skill.skillId);
    if (!details) return null;

    const isHighRiskEnabled = details.risk === 'high' && currentActivation === 'enabled';

    return (
      <div key={skill.skillId} className={`p-4 border-b border-dotted border-border-subtle hover:bg-blueprint-blue-dim transition-none relative ${isHighRiskEnabled ? 'bg-red-50 hover:bg-red-100' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-mono text-sm font-bold">{details.name}</div>
            <div className="font-mono text-caption uppercase text-muted mt-1">{details.category} | Risk: {details.risk}</div>
          </div>
          
          <select 
            value={currentActivation}
            onChange={(e) => handleActivationChange(skill.skillId, e.target.value as SkillActivation, details)}
            className="border border-solid border-ink font-mono text-caption uppercase p-1 outline-none bg-paper cursor-pointer"
          >
            <option value="enabled">Enabled</option>
            <option value="manual_only">Manual Only</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        
        {isHighRiskEnabled && (
          <div className="text-red-700 font-serif text-sm bg-red-100 border border-red-200 p-2 my-2">
            <strong>Warning:</strong> 这个 Skill 可能执行部署、扫描或高影响操作。建议设置为 manual_only，除非你确定当前项目需要默认启用。
          </div>
        )}
        
        <div className="font-serif text-sm mt-3 border-l-2 border-blueprint-blue pl-3 text-muted">
          <strong className="font-mono uppercase text-caption text-ink block mb-1 flex gap-2 items-center">Reason / Note <span className="blinking-cursor w-2 h-4 overflow-hidden" /></strong>
          {skill.reason}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-12 reveal-text pt-4">
      <header className="border-b-2 border-solid border-ink pb-4">
        <h2 className="text-display min-h-[1.2em] border-l-8 border-ink pl-4"><ScrambleText text="POLICY BUILDER" /></h2>
        <div className="font-mono text-sm uppercase tracking-wide flex justify-between mt-4">
          <span>Target: {profile.targets.join(' + ')}</span>
          <span className="bg-ink text-paper px-2 py-0.5">Detected Type: {profile.detectedProjectType || 'Unknown'}</span>
        </div>
      </header>

      <section className="border border-dotted border-ink p-4 bg-paper bg-blueprint-grid">
        <div className="font-mono text-sm uppercase font-bold mb-2">Requirement Summary</div>
        <div className="font-serif italic text-lg leading-relaxed">
          "{profile.requirement || '未提供需求。你可以手动选择 Skill 状态，或返回 Project Setup 输入需求。'}"
        </div>
      </section>

      <section>
        <div className="ascii-divider">░░░░░░░░░░ SKILL DISTRIBUTION ░░░░░░░░░░</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-solid border-ink bg-paper flex flex-col">
            <div className="bg-ink text-paper p-3 font-mono text-sm uppercase flex justify-between">
              <span>Enabled by Default</span>
              <span>[{enabledSkills.length}]</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {enabledSkills.length > 0 ? enabledSkills.map(s => renderSkillRow(s, 'enabled')) : (
                <div className="p-8 text-center text-muted font-mono text-sm uppercase">Empty</div>
              )}
            </div>
          </div>

          <div className="border border-solid border-ink bg-paper flex flex-col">
            <div className="border-b-2 border-solid border-ink p-3 font-mono text-sm uppercase flex justify-between font-bold">
              <span>Manual Only</span>
              <span>[{manualSkills.length}]</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {manualSkills.length > 0 ? manualSkills.map(s => renderSkillRow(s, 'manual_only')) : (
                <div className="p-8 text-center text-muted font-mono text-sm uppercase">Empty</div>
              )}
            </div>
          </div>

          <div className="border border-solid border-ink bg-paper flex flex-col opacity-80">
            <div className="bg-[--color-border-subtle] text-ink border-b border-solid border-ink p-3 font-mono text-sm uppercase flex justify-between">
              <span>Disabled</span>
              <span>[{disabledSkills.length}]</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {disabledSkills.length > 0 ? disabledSkills.map(s => renderSkillRow(s, 'disabled')) : (
                <div className="p-8 text-center text-muted font-mono text-sm uppercase">Empty</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {profile.conflicts.length > 0 && (
        <section>
          <div className="ascii-divider">░░░░░░░░░░ CONFLICT RULES ░░░░░░░░░░</div>
          <div className="space-y-4">
            {profile.conflicts.map(conflict => (
              <div key={conflict.id} className="border border-solid border-ink bg-paper p-6 relative">
                <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase">
                  RULE: {conflict.resolution.replace('_', ' ')}
                </div>
                
                <h4 className="font-mono text-base font-bold mb-4">
                  {conflict.skills.join('  +  ')}
                </h4>
                
                {conflict.resolution === 'split_responsibility' && conflict.responsibilities && (
                  <div className="space-y-3 font-serif">
                    <div className="font-mono text-sm uppercase mb-2">Responsibilities:</div>
                    {Object.entries(conflict.responsibilities).map(([skill, responsibility]) => (
                      <div key={skill} className="pl-4 border-l-2 border-blueprint-blue">
                        <strong className="font-mono text-sm">{skill}:</strong> {responsibility}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-dotted border-border-subtle font-serif text-muted text-sm">
                  Reason: {conflict.reason}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="ascii-divider">░░░░░░░░░░ SMALL CHANGE RULE ░░░░░░░░░░</div>
        <div className="faq-box bg-paper">
          <div className="font-mono text-sm uppercase font-bold mb-4">Small Change Rule</div>
          <p className="font-serif text-base mb-2">对于小型代码编辑、Bug 修复、文案调整、简单样式微调：</p>
          <ul className="list-none space-y-2 font-serif text-base pl-0 m-0">
            <li className="flex items-start gap-2"><span className="text-blueprint-blue select-none">[*]</span> 保持改动范围小</li>
            <li className="flex items-start gap-2"><span className="text-blueprint-blue select-none">[*]</span> 不自动触发设计重构类 Skill</li>
            <li className="flex items-start gap-2"><span className="text-blueprint-blue select-none">[*]</span> 不自动触发图片生成、部署、文档、表格、演示文稿等无关 Skill</li>
            <li className="flex items-start gap-2"><span className="text-blueprint-blue select-none">[*]</span> 只在用户明确要求时扩大任务范围</li>
          </ul>
        </div>
      </section>

      <div className="flex justify-between items-center pt-12 border-t border-solid border-ink">
        <div className="font-mono text-sm">
          <span className="uppercase text-muted mr-2">Policy Status:</span>
          {enabledSkills.length > 0 ? (
            <span className="bg-ink text-paper px-2 py-0.5 uppercase">Ready</span>
          ) : (
            <span className="border border-solid border-ink px-2 py-0.5 uppercase">Needs Review</span>
          )}
        </div>
        
        <button 
          className="btn-terminal primary text-base px-8 py-4"
          onClick={() => navigate('/preview')}
        >
          GENERATE POLICY &#x25B6;
        </button>
      </div>
    </div>
  );
}
