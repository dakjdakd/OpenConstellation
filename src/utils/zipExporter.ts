import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ProjectSkillProfile, GlobalSettings } from '../types';

export async function exportPolicyZip(profile: ProjectSkillProfile, settings: GlobalSettings, generatedOutputs: Record<string, string>) {
  const zip = new JSZip();

  const folderName = '.skillgate';
  const root = zip.folder(folderName);

  if (!root) return;

  // Save the raw active profile JSON as snapshot backup
  root.file('profile.json', JSON.stringify(profile, null, 2));

  // Save each selected formatted output
  if (generatedOutputs['agents'] && settings.outputPrefs.includes('agents')) {
    zip.file('AGENTS.md', generatedOutputs['agents']); // goes to project root
  }
  if (generatedOutputs['claude'] && settings.outputPrefs.includes('claude')) {
    zip.file('CLAUDE.md', generatedOutputs['claude']);
  }
  if (generatedOutputs['policy'] && settings.outputPrefs.includes('policy')) {
    root.file('skill-policy.md', generatedOutputs['policy']);
  }
  if (generatedOutputs['prompt'] && settings.outputPrefs.includes('prompt')) {
    root.file('session-prompt.txt', generatedOutputs['prompt']);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${profile.projectName}-policy-v1.zip`);
}
