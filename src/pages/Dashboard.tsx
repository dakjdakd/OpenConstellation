import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import ProgressBar from '../components/ProgressBar';
import ScrambleText from '../components/ScrambleText';
import BlueprintIllustration from '../components/BlueprintIllustration';
import { useState } from 'react';

export default function Dashboard() {
  const profile = useStore(state => state.profile);
  const recentProfiles = useStore(state => state.recentProfiles);
  const loadProfile = useStore(state => state.loadProfile);
  const deleteProfile = useStore(state => state.deleteProfile);
  const lastScanTime = useStore(state => state.lastScanTime);
  const setLastScanTime = useStore(state => state.setLastScanTime);
  const navigate = useNavigate();

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate mechanical scanning process
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setLastScanTime(new Date().toLocaleTimeString());
        setTimeout(() => setIsScanning(false), 500); // Wait half a second before removing progress bar
      }
      setScanProgress(current);
    }, 200);
  };

  return (
    <div className="space-y-12 pb-12 reveal-text">
      <header className="border-b-2 border-solid border-ink pb-4">
        <h2 className="text-display mb-2 border-l-8 border-ink pl-4"><ScrambleText text="DASHBOARD" /></h2>
        <div className="flex items-center gap-4 font-mono text-sm mt-4">
          <span className="bg-ink text-paper px-2 py-1 uppercase">Enforcement Level: Soft Policy</span>
          <span className="text-muted hidden md:inline">SkillGate will generate project-level instructions. It does not hard-disable agent skills in V1.</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="flex flex-col h-full">
          <div className="ascii-divider !mt-0 !mb-4">░░░░░░░░░░ PROJECT SUMMARY ░░░░░░░░░░</div>
          {profile ? (
            <div className="border border-solid border-ink p-6 bg-blueprint-grid h-full relative">
              <div className="absolute top-0 right-0 bg-ink text-paper font-mono text-caption px-2 py-1 uppercase tracking-wide">
                FIG_01: METADATA
              </div>
              <ul className="list-none p-0 m-0 w-full mt-4">
                <li className="toc-row">
                  <span className="toc-chapter font-mono text-sm uppercase text-muted">Project Name</span>
                  <span className="toc-dots"></span>
                  <span className="toc-page font-bold text-base">{profile.projectName}</span>
                </li>
                <li className="toc-row mt-2">
                  <span className="toc-chapter font-mono text-sm uppercase text-muted">Path</span>
                  <span className="toc-dots"></span>
                  <span className="toc-page break-all max-w-[50%]">{profile.projectPath}</span>
                </li>
                {profile.repositoryType && (
                  <li className="toc-row mt-2">
                    <span className="toc-chapter font-mono text-sm uppercase text-muted">Type</span>
                    <span className="toc-dots"></span>
                    <span className="toc-page">&lt; {profile.repositoryType.toUpperCase()} &gt;</span>
                  </li>
                )}
                {profile.framework && (
                  <li className="toc-row mt-2">
                    <span className="toc-chapter font-mono text-sm uppercase text-muted">Framework</span>
                    <span className="toc-dots"></span>
                    <span className="toc-page">[ {profile.framework.toUpperCase()} ]</span>
                  </li>
                )}
                <li className="toc-row mt-2">
                  <span className="toc-chapter font-mono text-sm uppercase text-muted">Mode</span>
                  <span className="toc-dots"></span>
                  <span className="toc-page">{profile.defaultMode || 'Generic'}</span>
                </li>
                <li className="toc-row mt-2">
                  <span className="toc-chapter font-mono text-sm uppercase text-muted">Target</span>
                  <span className="toc-dots"></span>
                  <span className="toc-page">{profile.targets.join(' + ')}</span>
                </li>
                <li className="toc-row mt-2">
                  <span className="toc-chapter font-mono text-sm uppercase text-muted">Last Build</span>
                  <span className="toc-dots"></span>
                  <span className="toc-page">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="border border-solid border-ink p-8 text-center bg-blueprint-grid h-full flex flex-col justify-center items-center">
              <BlueprintIllustration />
              <p className="font-serif text-lg mb-6 max-w-sm mx-auto mt-6">尚未配置项目。请先创建一个 Project Skill Profile。</p>
              <Link to="/setup" className="btn-terminal primary">
                [ CREATE_PROJECT_PROFILE ]
              </Link>
            </div>
          )}
        </section>

        <section>
          <div className="ascii-divider !mt-0 !mb-4">░░░░░░░░░░ SKILL STATUS ░░░░░░░░░░</div>
          <div className="grid gap-4">
            {profile ? (
              <>
                <Link to="/policy" className="border border-solid border-ink p-4 flex justify-between items-center hover:bg-blueprint-blue-dim transition-none">
                  <span className="font-mono uppercase text-sm font-bold">Enabled Skills</span>
                  <span className="font-pixel text-title">{profile.skills.filter(s => s.activation === 'enabled').length}</span>
                </Link>
                <Link to="/policy" className="border border-solid border-ink p-4 flex justify-between items-center hover:bg-blueprint-blue-dim transition-none">
                  <span className="font-mono uppercase text-sm font-bold">Manual Only</span>
                  <span className="font-pixel text-title">{profile.skills.filter(s => s.activation === 'manual_only').length}</span>
                </Link>
                <Link to="/policy" className="border border-solid border-ink p-4 flex justify-between items-center hover:bg-blueprint-blue-dim transition-none">
                  <span className="font-mono uppercase text-sm font-bold">Disabled Skills</span>
                  <span className="font-pixel text-title">{profile.skills.filter(s => s.activation === 'disabled').length}</span>
                </Link>
              </>
            ) : (
              <div className="border border-dotted border-border-subtle p-8 text-center text-muted font-mono uppercase text-sm">
                No active policy
              </div>
            )}
          </div>
        </section>
      </div>

      <section>
        <div className="ascii-divider !mt-12 !mb-6">░░░░░░░░░░ RECENT POLICIES ░░░░░░░░░░</div>
        <div className="border border-solid border-ink bg-paper overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-ink text-paper font-mono text-caption uppercase">
              <tr>
                <th className="py-2 px-4 font-normal">Project</th>
                <th className="py-2 px-4 font-normal">Mode</th>
                <th className="py-2 px-4 font-normal text-center">Enabled</th>
                <th className="py-2 px-4 font-normal">Updated</th>
                <th className="py-2 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentProfiles.length > 0 ? (
                recentProfiles.map(p => (
                  <tr key={p.id} className={`border-t border-solid border-border-subtle transition-none ${profile?.id === p.id ? 'bg-blueprint-blue-dim' : 'hover:bg-border-subtle/30'}`}>
                    <td className="py-3 px-4 font-bold">{p.projectName} {profile?.id === p.id && <span className="ml-2 px-1 border border-ink text-caption">&lt;ACTIVE&gt;</span>}</td>
                    <td className="py-3 px-4 text-sm break-all">{p.defaultMode}</td>
                    <td className="py-3 px-4 text-sm text-center">
                      <span className="border border-dotted border-ink px-2 py-0.5">{p.skills.filter(s => s.activation === 'enabled').length}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">{new Date(p.updatedAt).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                       <button onClick={() => { loadProfile(p.id); navigate('/policy'); }} className="font-mono text-caption uppercase border border-solid border-ink px-2 py-1 hover:bg-ink hover:text-paper transition-none">Load</button>
                       <button onClick={() => deleteProfile(p.id)} className="font-mono text-caption uppercase border border-solid border-ink px-2 py-1 text-red-600 hover:bg-red-600 hover:text-paper transition-none">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center font-mono text-sm text-muted uppercase">
                    No recent policies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="ascii-divider !mt-12 !mb-6">░░░░░░░░░░ QUICK ACTIONS ░░░░░░░░░░</div>
        <div className="flex flex-wrap items-center gap-4 border border-dotted border-ink p-6 bg-paper">
          <Link to="/setup" className="btn-terminal border-b-2">New Project Profile</Link>
          <button 
            className="btn-terminal border-b-2 disabled:opacity-50" 
            onClick={startScan} 
            disabled={isScanning}
          >
            Scan Local Skills
          </button>
          
          {isScanning && (
            <div className="flex-1 ml-4 hidden sm:block">
              <ProgressBar progress={scanProgress} label="LOCATING FILES" isSimulating={true} />
            </div>
          )}
          
          <div className="w-full sm:hidden mt-4">
            {isScanning && <ProgressBar progress={scanProgress} label="SCAN" isSimulating={true} />}
          </div>
        </div>
      </section>
    </div>
  );
}
