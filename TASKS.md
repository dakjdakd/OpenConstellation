# OpenConstellation Implementation Tasks

## 执行规则

- 单次仅执行一个章节的子任务：在未向用户申请许可、且用户未回复“是”或“y”前，严禁开启下一项子任务。
- 完成单个子任务后，立刻将清单标记从 `[ ]` 修改为 `[x]`，标注任务已完成。
- 若某父任务下属全部子任务均已标注 `[x]`，则同步将该父任务标记为已完成。
- 每完成一章节任务即暂停工作，等待用户许可后再继续。
- 随工作进度实时更新清单；出现新增工作项时，补充添加新任务。
- 每次新建或改动文件，都同步维护「相关文件」栏目。
- 每完成一个章节，运行必要验证，提交代码，并推送到 GitHub 远端 `main` 分支。
- commit message 使用一句简短中文。
- 如果推送因认证、远端、网络或权限失败，保留本地 commit，并记录失败原因。

## 当前进度

- 当前章节：1. 仓库纠偏与任务清单重建（已完成，等待用户许可后继续）
- 当前子任务：2.1 新增 Express API 服务骨架和 `/api/health`。
- 当前本地提交：`恢复星图项目基线`（以 `git log -1` 显示的最新提交为准）。
- 推送状态：失败。`git push origin main` 因 GitHub HTTPS 认证无法读取用户名而失败，错误为 `fatal: could not read Username for 'https://github.com': No such file or directory`。

## 任务清单

- [x] 1. 仓库纠偏与任务清单重建
  - [x] 1.1 保护当前误串状态，确认 `openconstellation.zip` 恢复源，并恢复 OpenConstellation 前端基线。

- [ ] 2. 后端 MVP
  - [ ] 2.1 新增 Express API 服务骨架和 `/api/health`。
  - [ ] 2.2 实现图谱、节点详情、搜索、时间线、技术树和路径查询 API。
  - [ ] 2.3 实现 JSON 持久化的收藏、最近查看、搜索记录和 AI 洞察状态。
  - [ ] 2.4 跑通后端 smoke 验证与前端构建。

- [ ] 3. 前端接线与体验补齐
  - [ ] 3.1 新增 API client，并保留后端不可用时的加载态、错误态和空态。
  - [ ] 3.2 Universe Map、节点详情、搜索、时间线、技术树、收藏接入真实 API。
  - [ ] 3.3 检查并清理页面路由、跳转、文案和主题一致性。
  - [ ] 3.4 浏览器验证核心页面流程。

- [ ] 4. AI 占位能力
  - [ ] 4.1 实现模拟 AI 洞察、结构化补全、学习路径和相似节点推荐接口。
  - [ ] 4.2 为 AI 结果补充置信度、来源标记和可编辑字段。
  - [ ] 4.3 保留未来 DeepSeek/OpenAI 兼容接入点。
  - [ ] 4.4 验证 AI 占位能力不阻塞前端主流程。

## 相关文件

- `.gitignore`：忽略依赖、构建产物、环境变量和误提交的 `.npm-cache` 缓存目录。
- `TASKS.md`：记录 OpenConstellation 分章执行规则、当前进度、任务清单和相关文件。
- `src/components/FilterPanel.tsx`：修复恢复基线中的路径选择状态调用，确保 TypeScript 验证通过。
- `src/`：从 `openconstellation.zip` 恢复 OpenConstellation 前端基线、星图组件、页面组件、状态与 mock 数据。
- `package.json`：从 `openconstellation.zip` 恢复 OpenConstellation 前端依赖和脚本配置。
- `package-lock.json`：从 `openconstellation.zip` 恢复依赖锁定版本。
- `README.md`：从 `openconstellation.zip` 恢复 OpenConstellation 项目说明。
- `index.html`：从 `openconstellation.zip` 恢复前端入口 HTML。
- `metadata.json`：从 `openconstellation.zip` 恢复项目元信息。
- `vite.config.ts`：从 `openconstellation.zip` 恢复 Vite 配置。
- `tsconfig.json`：从 `openconstellation.zip` 恢复 TypeScript 配置。
- `.env.example`：从 `openconstellation.zip` 恢复环境变量示例。
- `assets/`：从 `openconstellation.zip` 恢复项目资源目录。
