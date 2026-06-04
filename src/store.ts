import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectSkillProfile, SkillEntry, ProjectSkillState, GlobalSettings, SkillConflictRule } from './types';

export const knownSkills: SkillEntry[] = [
  {
    id: "design-taste-frontend",
    name: "design-taste-frontend",
    platform: "generic",
    category: "frontend_design",
    risk: "medium",
    defaultActivation: "auto_candidate",
    description: "用于前端页面、落地页、品牌页、视觉方向和设计质量控制。",
    sourcePath: "~/.agents/skills/design-taste-frontend"
  },
  {
    id: "baseline-ui",
    name: "baseline-ui",
    platform: "generic",
    category: "frontend_quality",
    risk: "low",
    defaultActivation: "auto_candidate",
    description: "用于组件质量、可访问性、响应式布局和 Tailwind UI 稳定性检查。",
    sourcePath: "~/.agents/skills/baseline-ui"
  },
  {
    id: "browser:control-in-app-browser",
    name: "browser:control-in-app-browser",
    platform: "generic",
    category: "browser_testing",
    risk: "low",
    defaultActivation: "auto_candidate",
    description: "用于打开本地页面、检查布局、截图和验证交互。",
    sourcePath: "~/.codex/skills/browser"
  },
  {
    id: "playwright-interactive",
    name: "playwright-interactive",
    platform: "generic",
    category: "browser_testing",
    risk: "medium",
    defaultActivation: "manual_candidate",
    description: "Playwright UI 交互测试。"
  },
  {
    id: "imagegen",
    name: "imagegen",
    platform: "generic",
    category: "image_generation",
    risk: "medium",
    defaultActivation: "manual_candidate",
    description: "用于生成位图图片、商品图、banner、插图和视觉素材。",
    sourcePath: "~/.agents/skills/imagegen"
  },
  {
    id: "netlify-deploy",
    name: "netlify-deploy",
    platform: "generic",
    category: "deployment",
    risk: "high",
    defaultActivation: "manual_candidate",
    description: "只在用户明确要求部署或发布网站时使用。"
  },
  {
    id: "openai-docs",
    name: "openai-docs",
    platform: "generic",
    category: "openai_docs",
    risk: "low",
    defaultActivation: "disabled_candidate",
    description: "OpenAI API 读取与参考。"
  },
  {
    id: "documents:documents",
    name: "documents:documents",
    platform: "generic",
    category: "document_editing",
    risk: "medium",
    defaultActivation: "disabled_candidate",
    description: "用于创建或编辑 Word / Docx 文档。"
  },
  {
    id: "spreadsheets:Spreadsheets",
    name: "spreadsheets:Spreadsheets",
    platform: "generic",
    category: "spreadsheet_analysis",
    risk: "medium",
    defaultActivation: "disabled_candidate",
    description: "创建或编辑 Excel / CSV 表格。"
  },
  {
    id: "presentations:Presentations",
    name: "presentations:Presentations",
    platform: "generic",
    category: "presentation_building",
    risk: "medium",
    defaultActivation: "disabled_candidate",
    description: "创建 PPT / 幻灯片。"
  },
  {
    id: "storage-analyzer",
    name: "storage-analyzer",
    platform: "generic",
    category: "storage_analysis",
    risk: "high",
    defaultActivation: "disabled_candidate",
    description: "分析本地可用存储空间和文件结构。"
  },
  {
    id: "karpathy-guidelines",
    name: "karpathy-guidelines",
    platform: "generic",
    category: "generic_coding",
    risk: "low",
    defaultActivation: "auto_candidate",
    description: "代码极简主义指导原则。"
  }
];

const LOCAL_STORAGE_KEY = 'skillgate-v1-storage';

interface SkillGateState {
  profile: ProjectSkillProfile | null;
  recentProfiles: ProjectSkillProfile[];
  settings: GlobalSettings;
  lastScanTime: string | null;
  setProfile: (profile: ProjectSkillProfile) => void;
  deleteProfile: (id: string) => void;
  loadProfile: (id: string) => void;
  updateSkillState: (skillId: string, updates: Partial<ProjectSkillState>) => void;
  analyzeRequirement: (requirement: string) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  resetAll: () => void;
  setLastScanTime: (time: string) => void;
}

const defaultSettings: GlobalSettings = {
  skillSources: '~/.codex/skills\n~/.agents/skills\n~/.claude/skills\nproject/.codex/skills\nproject/.agents/skills',
  defaultTargets: ['codex', 'claude-code'],
  outputPrefs: ['agents', 'claude', 'profile', 'policy', 'prompt'],
  isCRT: false,
  hasBooted: false
};

function generateDynamicConflicts(skills: ProjectSkillState[]): SkillConflictRule[] {
  const conflicts: SkillConflictRule[] = [];
  
  const isEnabled = (id: string) => skills.find(s => s.skillId === id)?.activation === 'enabled';

  // Rule 1: frontend design vs baseline ui
  if (isEnabled('design-taste-frontend') && isEnabled('baseline-ui')) {
    conflicts.push({
      id: "design-taste-frontend-vs-baseline-ui",
      skills: ["design-taste-frontend", "baseline-ui"],
      resolution: "split_responsibility",
      responsibilities: {
        "design-taste-frontend": "负责视觉方向、核心UI架构、创新性布局和高级感体验。",
        "baseline-ui": "负责具体组件的严谨实现、Tailwind 类的正确性、可访问性、以及响应式稳定性。"
      },
      reason: "两者都涉及前端干预，避免在具体细节与宏观方向上发生操作冲突。"
    });
  }

  // Add more dynamic rules as needed
  
  return conflicts;
}

export const useStore = create<SkillGateState>()(
  persist(
    (set, get) => ({
      profile: null,
      recentProfiles: [],
      settings: defaultSettings,
      lastScanTime: null,
      
      setProfile: (profile) => set((state) => {
        const existingIdx = state.recentProfiles.findIndex(p => p.id === profile.id);
        let newRecents = [...state.recentProfiles];
        if (existingIdx >= 0) {
          newRecents[existingIdx] = profile;
        } else {
          newRecents = [profile, ...newRecents].slice(0, 50);
        }
        return { profile, recentProfiles: newRecents };
      }),

      deleteProfile: (id) => set((state) => ({
        recentProfiles: state.recentProfiles.filter(p => p.id !== id),
        profile: state.profile?.id === id ? null : state.profile
      })),

      loadProfile: (id) => set((state) => ({
        profile: state.recentProfiles.find(p => p.id === id) || null
      })),
      
      updateSkillState: (skillId, updates) => set((state) => {
        if (!state.profile) return state;
        
        const newSkills = state.profile.skills.map(skill => 
          skill.skillId === skillId ? { ...skill, ...updates } : skill
        );
        
        const newConflicts = generateDynamicConflicts(newSkills);

        const updatedProfile = {
          ...state.profile,
          skills: newSkills,
          conflicts: newConflicts,
          updatedAt: new Date().toISOString()
        };

        const existingIdx = state.recentProfiles.findIndex(p => p.id === state.profile!.id);
        const newRecents = [...state.recentProfiles];
        if (existingIdx >= 0) {
          newRecents[existingIdx] = updatedProfile;
        }

        return {
          profile: updatedProfile,
          recentProfiles: newRecents
        };
      }),
      
      analyzeRequirement: (requirement: string) => set((state) => {
        if (!state.profile) return state;

        let detectedType = "frontend";
        
        if (requirement.includes("淘宝") || requirement.includes("电商") || requirement.includes("购物车") || requirement.includes("结算")) {
          detectedType = "frontend_ecommerce_app";
        } else if (requirement.includes("落地页") || requirement.includes("设计") || requirement.includes("官网")) {
          detectedType = "design_landing_page";
        } else if (requirement.includes("部署") || requirement.includes("上线")) {
          detectedType = "deployment_task";
        } else if (requirement.includes("文档") || requirement.includes("报告")) {
          detectedType = "documentation_task";
        }

        const newSkills = knownSkills.map(skill => {
          let activation = "disabled" as "enabled" | "manual_only" | "disabled";
          let reason = "系统默认规则";

          // Baseline defaults for all scenarios
          if (["netlify-deploy", "imagegen", "storage-analyzer"].includes(skill.id)) {
            activation = "manual_only";
            reason = `The risk level of ${skill.id} is high/medium. Should not auto-activate.`;
          }

          if (detectedType === "frontend_ecommerce_app" || detectedType === "design_landing_page") {
            if (["design-taste-frontend", "baseline-ui", "browser:control-in-app-browser", "karpathy-guidelines"].includes(skill.id)) {
              activation = "enabled";
              reason = "当前项目属于前端/设计范畴，需要相关的审美调整、组件稳定与浏览器验证。";
            }
          }

          if (detectedType === "deployment_task") {
            if (skill.id === "netlify-deploy") {
              activation = "enabled"; // explicit enable for deploy tasks
              reason = "部署任务明确触发";
            }
          }

          if (detectedType === "documentation_task") {
            if (skill.id === "documents:documents") {
              activation = "enabled";
              reason = "文档生成任务需要调用 Office 处理能力。";
            }
            if (["design-taste-frontend", "baseline-ui", "browser:control-in-app-browser"].includes(skill.id)) {
              activation = "disabled";
              reason = "文档任务不适用前端验证。";
            }
          }

          return {
            skillId: skill.id,
            activation,
            reason
          };
        });

        const newConflicts = generateDynamicConflicts(newSkills);
        
        const updatedProfile = {
          ...state.profile,
          requirement,
          detectedProjectType: detectedType,
          skills: newSkills,
          conflicts: newConflicts,
          updatedAt: new Date().toISOString()
        };

        const existingIdx = state.recentProfiles.findIndex(p => p.id === state.profile!.id);
        const newRecents = [...state.recentProfiles];
        if (existingIdx >= 0) {
          newRecents[existingIdx] = updatedProfile;
        }

        return {
          profile: updatedProfile,
          recentProfiles: newRecents
        };
      }),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      resetAll: () => set({
        profile: null,
        recentProfiles: [],
        settings: defaultSettings,
        lastScanTime: null
      }),

      setLastScanTime: (time) => set({ lastScanTime: time })
    }),
    {
      name: LOCAL_STORAGE_KEY,
    }
  )
);
