# SkillGate Implementation Tasks

## 执行规则

- 不需要每个子任务都向用户确认，可以连续执行代码直到全部完成。
- 每完成一个子任务，立刻将对应清单从 `[ ]` 修改为 `[x]`。
- 若父任务下属全部子任务均完成，同步将父任务标记为 `[x]`。
- 出现新增工作项时，补充到本清单。
- 每次新建或改动文件，都同步维护「相关文件」栏目。
- 每完成一个大章节，运行必要验证，提交代码，并推送到 GitHub 远端 `main` 分支。
- commit message 使用一句简短中文。
- 如果推送因认证、远端、网络或权限失败，保留本地 commit，并记录失败原因。

## 当前进度

- 当前章节：2. 修复基础可运行性
- 当前子任务：2.1 安装或恢复依赖，确认 `npm.cmd run lint` 能实际执行。

## 任务清单

- [x] 1. 任务清单初始化
  - [x] 1.1 创建 `TASKS.md`，写入执行规则、章节任务、当前进度、相关文件栏目。

- [ ] 2. 修复基础可运行性
  - [ ] 2.1 安装或恢复依赖，确认 `npm.cmd run lint` 能实际执行。
  - [ ] 2.2 修复当前 TypeScript/JSX 字符串、乱码和编译错误。
  - [ ] 2.3 跑通 `npm.cmd run lint` 和 `npm.cmd run build`。

- [ ] 3. Core 业务逻辑层
  - [ ] 3.1 新增 Skill Registry 数据模块并替换 `store.ts` 内硬编码 knownSkills。
  - [ ] 3.2 新增需求分类模块。
  - [ ] 3.3 新增 Skill 推荐模块。
  - [ ] 3.4 新增冲突检测模块。
  - [ ] 3.5 新增 Policy 生成模块，并让 OutputPreview 使用统一生成器。

- [ ] 4. 本地后端 API
  - [ ] 4.1 新增 Express API 服务骨架和 health endpoint。
  - [ ] 4.2 实现 Skill 扫描 API。
  - [ ] 4.3 实现推荐 API。
  - [ ] 4.4 实现 Policy 预览 API。
  - [ ] 4.5 实现 Policy 确认写入 API。

- [ ] 5. 前端接线与功能完善
  - [ ] 5.1 新增 API client，并保留后端不可用时的错误提示。
  - [ ] 5.2 Project Setup 接入真实推荐。
  - [ ] 5.3 Skill Registry 接入真实扫描。
  - [ ] 5.4 Output Preview 接入 preview/apply 流程。
  - [ ] 5.5 Dashboard 和 Settings 同步真实状态与文案。

- [ ] 6. 最终验证与收尾
  - [ ] 6.1 跑通 `npm.cmd run lint`。
  - [ ] 6.2 跑通 `npm.cmd run build`。
  - [ ] 6.3 启动本地服务并验证核心页面流程。
  - [ ] 6.4 验证 Apply 写入预览确认机制。
  - [ ] 6.5 更新最终相关文件列表和剩余风险。

## 相关文件

- `TASKS.md`：记录项目后端落地、前端接线、验证和分章提交推送的执行清单。
