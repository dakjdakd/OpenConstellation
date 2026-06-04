# OpenConstellation Implementation Tasks

## 执行规则

- 单次仅执行当前章节的子任务；跨章节继续前先确认范围。
- 完成子任务后，及时把清单从 `[ ]` 更新为 `[x]`。
- 如果某个父任务下属子任务全部完成，则同步标记父任务完成。
- 随工作进度实时更新清单；出现新增工作项时补充到任务列表。
- 每次新增或改动文件，都同步维护“相关文件”栏目。
- 每个阶段完成后运行必要验证；如果需要提交或推送，commit message 使用一句简短中文。
- 如果推送因认证、远端、网络或权限失败，保留本地 commit 并记录失败原因。

## 当前进度

- 当前章节：2. 后端 MVP 继续完善；4. AI 占位能力后端验证。
- 当前子任务：2.7 / 4.5 已完成；DeepSeek key 已被后端识别，并通过真实 provider probe 与业务 API 验证。
- 验证状态：
  - `npm.cmd run lint` 通过。
  - `npm.cmd run build` 通过，只有 Vite chunk size warning。
  - `/api/ai/status` 返回 `configured: true`、`provider: deepseek`、`keySource: DEEPSEEK_API_KEY`。
  - `/api/ai/probe` 在允许外网访问后返回 `ok: true`、`providerHttpStatus: 200`。
  - 允许外网访问后，`/api/nodes/openai`、`/api/search?q=openai`、`/api/ai/learning-path/openai`、`/api/ai/complete-node/openai` 均返回 `provider: deepseek`。
- 注意：当前 Codex 沙箱内网络会让 DeepSeek 请求出现 `fetch failed`，但在允许外网访问的同一命令下 provider 与业务 API 均已验证成功；应用实际运行时以本机网络环境为准。
- 注意：当前 Windows 环境用 `Start-Process` 后台启动 API 可能触发 `Path/PATH` 环境变量冲突；实际运行建议在终端直接执行 `npm.cmd run dev:api`，再另开终端执行 `npm.cmd run dev`。

## 任务清单

- [x] 1. 仓库纠偏与任务清单重建
  - [x] 1.1 保护当前误串状态，确认 `openconstellation.zip` 恢复源，并恢复 OpenConstellation 前端基线。
- [x] 2. 后端 MVP
  - [x] 2.1 新增 Express API 服务骨架和 `/api/health`。
  - [x] 2.2 实现图谱、节点详情、搜索、时间线、技术树和路径查询 API。
  - [x] 2.3 实现 JSON 持久化的收藏、最近查看、搜索记录和 AI 洞察状态。
  - [x] 2.4 跑通后端 smoke 验证与前端构建。
  - [x] 2.5 补齐用户态后端接口：删除 collection、从 collection 移出节点、清空 recent views、清空 search history。
  - [x] 2.6 补齐 AI 后端 GET 端点：节点学习路径和结构化节点补全，并接入 JSON AI 缓存。
  - [x] 2.7 补齐 AI provider 运维诊断：安全状态接口、真实 provider probe、`.env` 加载兜底和 fallback 缓存自动刷新。
- [ ] 3. 前端接线与体验补齐
  - [x] 3.1 新增 API client，并保留后端不可用时的 mock fallback。
  - [ ] 3.2 Universe Map、节点详情、搜索、时间线、技术树、收藏接入真实 API 的深度展示。
  - [ ] 3.3 检查并清理页面路由、跳转、文案和主题一致性。
  - [ ] 3.4 浏览器验证核心页面流程。
- [ ] 4. AI 占位能力
  - [x] 4.1 接入 DeepSeek OpenAI-compatible AI 服务，模型使用 `deepseek-v4-flash`，默认 `base_url` 为 `https://api.deepseek.com`。
  - [x] 4.2 为 AI 结果补充置信度、来源标记、可编辑字段和本地 fallback。
  - [ ] 4.3 将 AI 洞察、结构化补全、学习路径和相似节点推荐接入前端展示。
  - [x] 4.4 验证 AI 占位能力不阻塞前端主流程。
  - [x] 4.5 验证真实 DeepSeek provider：health/status/probe 与业务端点均可返回 deepseek 结果。

## 相关文件

- `.gitignore`：忽略依赖、构建产物、环境变量、日志和运行态 `server/data/user-state.json`。
- `.env.example`：提供 DeepSeek OpenAI-compatible 环境变量示例，包括 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL` 和 `DEEPSEEK_MODEL`。
- `TASKS.md`：记录 OpenConstellation 分章执行规则、当前进度、任务清单和相关文件。
- `package.json`：提供 `dev:api` 脚本，用于启动 Express API 服务。
- `server/app.ts`：Express 应用装配入口，挂载 health、graph、me 和 AI 路由；同时兜底加载 `.env`。
- `server/data/graphStore.ts`：图谱数据访问入口，当前以 `src/data.ts` 的 mock 数据作为 MVP seed。
- `server/data/userStore.ts`：运行态用户星图 JSON 持久化服务，负责收藏、合集、最近查看、搜索历史和 AI 洞察缓存；写入采用临时文件加 rename 的原子替换。
- `server/graphService.ts`：图谱筛选、节点详情、搜索、时间线、技术树和最短路径的纯逻辑服务。
- `server/index.ts`：Express API 启动入口。
- `server/routes/ai.ts`：DeepSeek 与本地 fallback AI 能力路由；包含 insight、recommendations、learning-path、complete-node、status、probe。
- `server/routes/graph.ts`：图谱、节点详情、搜索、时间线、技术树和路径查询 REST API；AI 缓存会在已配置真实 provider 时自动绕过旧 fallback 缓存并刷新。
- `server/routes/health.ts`：健康检查路由，返回服务、运行时和不会泄露 key 的 AI provider 状态。
- `server/routes/me.ts`：收藏、合集、最近查看和搜索历史 REST API；包含删除与清空接口。
- `server/services/deepseek.ts`：DeepSeek OpenAI-compatible Chat Completions 封装、本地 fallback、provider 状态、probe 和缓存使用策略。
- `src/api.ts`：前端 API client，封装图谱与用户星图请求，并在后端不可用时回退到 mock 数据；包含删除/清空同步方法。
- `src/App.tsx`：应用启动时触发图谱和用户状态加载。
- `src/store.ts`：Zustand 状态接入后端图谱、收藏、合集、最近查看和搜索历史同步。
- `src/`：OpenConstellation 前端基线、星图组件、页面组件、状态与 mock 数据。
- `vite.config.ts`：`/api` 到本地 Express 服务的代理配置。

## 本轮 Smoke 摘要

```json
{
  "aiStatus": {
    "configured": true,
    "provider": "deepseek",
    "model": "deepseek-v4-flash",
    "baseUrl": "https://api.deepseek.com",
    "keySource": "DEEPSEEK_API_KEY"
  },
  "probe": {
    "ok": true,
    "providerHttpStatus": 200,
    "latencyMs": 258
  },
  "businessApi": {
    "nodeInsightProvider": "deepseek",
    "nodeInsightSource": "deepseek_openai_compatible",
    "learningProvider": "deepseek",
    "completeProvider": "deepseek",
    "searchAiProvider": "deepseek",
    "searchTotal": 7
  }
}
```
