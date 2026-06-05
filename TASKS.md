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

- 当前章节：5. 项目说明缺口审计与后续真实化任务。
- 当前子任务：5.2、5.3、5.4、5.5 与 5.6 已完成；Source 实体、导入审核流、轻量前端审核台和 AI 字段覆盖版本记录已补齐，正常体验不再加载前端 mock 数据，后端图谱已替换为 58 节点 / 62 边的公开来源 curated graph。
- 验证状态：
  - `npm.cmd run lint` 通过。
  - `npm.cmd run build` 通过，只有 Vite chunk size warning。
  - `/api/ai/status` 返回 `configured: true`、`provider: deepseek`、`keySource: DEEPSEEK_API_KEY`。
  - `/api/ai/probe` 在允许外网访问后返回 `ok: true`、`providerHttpStatus: 200`。
  - 允许外网访问后，`/api/nodes/openai`、`/api/search?q=openai`、`/api/ai/learning-path/openai`、`/api/ai/complete-node/openai` 均返回 `provider: deepseek`。
  - 本轮 `npm.cmd run lint` 通过。
  - 本轮补充 `npm.cmd run lint` 通过。
  - 本轮 `npm.cmd run build` 通过，只有 Vite chunk size warning。
  - 本轮后端 smoke：`/api/graph` 返回 23 个节点，`/api/nodes/openai` 返回 OpenAI，`/api/search?q=openai` 返回 7 条，`/api/timeline` 返回 12 个事件，`/api/tech-tree` 返回 3 层，`/api/ai/learning-path/openai` 返回 `provider: deepseek`。
  - 本轮浏览器 smoke：`/node/openai`、`/search?q=openai`、`/timeline`、`/tech`、`/saved` 均可渲染核心内容，控制台无 error。
  - 本轮补充浏览器 smoke：`/explore` 可渲染星图标题，`/saved` 可渲染收藏、合集和最近浏览区域，控制台无 error。
  - 本轮后端真实化：`npm.cmd run seed:graph` 可从前端 seed 生成独立 `server/data/graph-data.json`；`/api/graph` 读取后端 JSON 返回 23 个节点和 27 条边。
  - 本轮图谱写入 smoke：新增临时节点返回 24 个节点，添加事件返回 201，更新 sourceList 返回 200，删除临时节点后 `/api/graph` 恢复 23 个节点且无测试残留。
  - 本轮产品化数据：`npm.cmd run seed:graph` 已替换为 curated graph 生成器，`/api/graph` 返回 58 个节点和 62 条边，58 个节点均带 `sourceList`，`/api/graph/sources` 聚合 57 条公开来源。
  - 本轮真实数据 smoke：`/api/search?q=openai` 返回 6 条且首条为 OpenAI，`/api/nodes/openai` 返回 10 个相关节点，`/api/graph/path?from=openai&to=cursor` 返回 `openai -> gpt4o -> cursor`。
  - 本轮 Source 实体与审核流 smoke：隔离临时数据文件下 `/api/sources` 可从现有图谱推断 50 条 Source 实体；`POST /api/graph/import` 默认返回 202 pending batch 且不写入主图谱；`POST /api/import-batches/:id/approve` 审核后写入图谱；`POST /api/graph/import/github` 对非法 repo 返回 400 明确错误。
  - 本轮前端审核台：新增 `/review` 数据导入/来源审核页面，接入 pending/approved/rejected 批次列表、GitHub repo 草稿导入、节点/边/来源 diff 预览、approve/reject 操作和局部错误/空状态；`npm.cmd run lint` 与 `npm.cmd run build` 均通过。
  - 本轮搜索 AI 草稿闭环：`POST /api/search/draft` 在隔离临时 graph/user/source store 下返回 202，创建 pending import batch，正式图谱节点数保持 58 不被 smoke 污染；`npm.cmd run lint` 与 `npm.cmd run build` 均通过。
  - 本轮 AI 覆盖版本记录：隔离临时 graph/user/source/override store 下更新 `openai.aiSummary` 与 `openai.aiConfidence` 返回 200；`GET /api/overrides?entityType=node&entityId=openai` 返回 2 条 before/after 覆盖记录，字段为 `aiSummary`、`aiConfidence`，并保留 `deepseek`、`human-override` sourceTags。
  - 本轮后端持久化与健康检查：四个 JSON store 统一接入 `server/data/jsonFileStore.ts`，保留原子写入、损坏备份恢复和 store meta；新增 `/api/admin/data-health` 区分核心 errors 与用户历史 warnings；新增 `POST /api/admin/user-state/prune-stale-node-references` 支持 dry-run 和正式清理用户态陈旧节点引用；已正式清理 `recentViews` 中的 `diffusion`、`ilya-sutskever`，清理后 data-health 返回 `errors: []`、`warnings: []`；`npm.cmd run smoke:api`、`npm.cmd run lint`、`npm.cmd run build` 均通过，构建仅有 Vite chunk size warning。
  - 本轮后端搜索与关系探索底座：`/api/search` 保持 `q` 兼容并新增 `type`、`tag`、`status`、`sort`、`limit` 参数，返回 facets、suggestions 与 filters；新增 `/api/graph/relationships` 支持中心节点 1/2/3 跳关系探索、关系类型过滤、分层 nodes/edges 与 relationCounts；`src/api.ts` 已补齐对应类型与调用函数；`npm.cmd run smoke:api`、`npm.cmd run lint`、`npm.cmd run build` 均通过，构建仅有 Vite chunk size warning。
- 注意：当前 Codex 沙箱内网络会让 DeepSeek 请求出现 `fetch failed`，但在允许外网访问的同一命令下 provider 与业务 API 均已验证成功；应用实际运行时以本机网络环境为准。
- 注意：当前 Windows 环境用 `Start-Process` 后台启动 API 可能触发 `Path/PATH` 环境变量冲突；实际运行建议在终端直接执行 `npm.cmd run dev:api`，再另开终端执行 `npm.cmd run dev`。
- 注意：当前正常前端体验依赖后端 API 和 curated public-source graph；仅当显式设置 `VITE_ENABLE_MOCK_FALLBACK=true` 时才允许开发兜底读取前端 mock。尚未完成的是 Wikidata/arXiv 等更多外部抓取源、AI 覆盖版本 UI 和数据库级并发控制。

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
- [x] 3. 前端接线与体验补齐
  - [x] 3.1 新增 API client，并保留后端不可用时的 mock fallback。
  - [x] 3.2 Universe Map、节点详情、搜索、时间线、技术树、收藏接入真实 API 的深度展示。
  - [x] 3.3 检查并清理页面路由、跳转、文案和主题一致性。
  - [x] 3.4 浏览器验证核心页面流程。
- [x] 4. AI 占位能力
  - [x] 4.1 接入 DeepSeek OpenAI-compatible AI 服务，模型使用 `deepseek-v4-flash`，默认 `base_url` 为 `https://api.deepseek.com`。
  - [x] 4.2 为 AI 结果补充置信度、来源标记、可编辑字段和本地 fallback。
  - [x] 4.3 将 AI 洞察、结构化补全、学习路径和相似节点推荐接入前端展示。
  - [x] 4.4 验证 AI 占位能力不阻塞前端主流程。
  - [x] 4.5 验证真实 DeepSeek provider：health/status/probe 与业务端点均可返回 deepseek 结果。
- [ ] 5. 项目说明缺口审计与后续真实化任务
  - [x] 5.1 盘点当前项目中仍未真正实现、仍使用 seed/mock/fallback 或仅 UI 展示的功能。
  - [x] 5.2 将后端图谱数据源从 `src/data.ts` 前端 seed 拆出为独立后端数据层，例如 `server/data/graph-data.json`、SQLite 或 Postgres，并提供迁移脚本。
  - [x] 5.3 扩充初版图谱规模到项目说明要求的 50-100 个节点，并补齐 `sourceList`、`confidence`、`logo`、`github`、`relatedTechnology`、`aiSummary` 等字段。
  - [x] 5.4 实现半自动知识图谱构建闭环：搜索本地无结果时触发 AI 结构化补全，人工确认后写入统一 Node/Edge/Event/Source 模型。（已新增 `/api/search/draft`，无结果搜索可生成结构化 GraphNode/GraphEdge/Source 草稿并写入 pending import batch；前端 Search Explorer 空状态可一键生成草稿并跳转 `/review` 审核台 approve/reject，审核通过后才写入主图谱）
  - [x] 5.5 增加节点与关系的可编辑/可覆盖 API：创建、更新、删除 node、edge、event、source，并保留 AI 生成字段的人工覆盖记录。（后端 node/edge/event/source CRUD、导入审核流、前端审核台和 `override-store.json` 覆盖版本记录已完成；前端人工编辑 UI 归入 5.14）
  - [x] 5.6 接入至少一个真实公开数据来源或导入通道，例如 Wikidata/Wikipedia、GitHub、arXiv、官方站点清单或人工 CSV/JSON 导入。
  - [ ] 5.7 补齐首页 Universe Map 的高级探索能力：后端路径结果驱动的路径高亮、局部展开/收起、布局模式切换、底部数据状态条和缩放比例展示。
  - [ ] 5.8 补齐 Search Explorer 的真实筛选、分类计数、排序、自动补全和无结果 AI 引导；当前左侧 Companies/Products/Models 是静态按钮。
    - [x] 5.8a 后端搜索 contract 已补齐真实筛选、分类计数、排序、limit 与 suggestions：`GET /api/search?q=ai&type=Company&sort=popularity&limit=5` 已纳入 smoke；前端筛选 UI 接线仍归 5.8 主项。
  - [ ] 5.9 补齐 Timeline 的年份滑条、起止年份筛选、事件类型筛选、年份对比和按年份 AI 总结；当前页面只展示聚合事件和播放模式。
  - [ ] 5.10 补齐 Tech Tree 的分类面板、技术节点展开/收起、演化路径高亮、右侧说明面板和“我想从这里学起”交互。
  - [ ] 5.11 新增独立 Graph Relationship Explorer 页面，支持 1/2/3 跳关系限制、关系类型切换、竞争圈/生态带高亮、两点路径分析和导出截图。
    - [x] 5.11a 后端关系探索 API 已补齐：`GET /api/graph/relationships?nodeId=openai&hops=2` 返回中心节点、分层关系、边集合和 relationCounts；独立页面、截图导出与视觉高亮仍归 5.11 主项。
  - [ ] 5.12 完善 My Constellation：收藏路径、合集备注、拖拽排序、导出分享链接和推荐继续探索内容；当前已实现收藏节点、合集和最近查看。
  - [ ] 5.13 完善节点详情页资源区和操作：复制摘要、分享链接、官网/GitHub/论文/新闻/视频资源分组，以及关系线/路径链条的图谱视图切换。
  - [ ] 5.14 为 AI 结果增加“重新生成、人工编辑、保存覆盖、查看来源标签”的前端交互；当前仅展示 DeepSeek/fallback 结果和 editable 元数据。
  - [x] 5.15a 固化后端 API smoke、数据健康检查与用户态陈旧引用清理：覆盖 health、graph、node detail、search、timeline、tech-tree、path、`/api/admin/data-health` 和 `/api/admin/user-state/prune-stale-node-references` dry-run，并暴露 JSON store meta、核心错误与用户历史 warning。
  - [ ] 5.15 为移动端基础适配、加载态、错误态、空态和 500+ 节点性能做专项验证，避免后续真实数据扩容后星图卡顿或布局破碎。

## 未实现 / 假数据审计

- 图谱主数据已拆到后端 JSON：`server/data/graphStore.ts` 读取并写入 `server/data/graph-data.json`，不再直接返回 `src/data.ts` 的 `mockData`；当前 JSON 是 58 节点 / 62 边的公开来源 curated graph，所有节点都有 `sourceList`、`logo`、`relatedTechnology`、`aiSummary`，边包含 `sourceList` 与 `confidence`。
- 后端 API 已经真实可调用，结果来自后端 curated graph：`/api/graph`、`/api/nodes/:id`、`/api/search`、`/api/timeline`、`/api/tech-tree` 和 `/api/graph/path` 均在后端图谱上计算；尚未完成的是实时外部 API 自动抓取和数据库化。
- 前端 API client 默认不再静默回退 mock：`src/api.ts` 只有在显式设置 `VITE_ENABLE_MOCK_FALLBACK=true` 时才允许开发兜底；正常产品体验会暴露后端服务错误，避免误用假数据。
- 半自动知识图谱构建闭环已打通：本地搜索无结果时，前端 Search Explorer 可调用 `POST /api/search/draft`，后端优先使用 DeepSeek 生成结构化节点、关系和来源草稿；AI 或网络失败时返回保守 fallback 草稿；草稿进入 pending import batch，由 `/review` 审核台查看 diff 后 approve/reject，审核通过后才写入统一 Node/Edge/Event/Source 模型。
- AI 生成内容已有后端覆盖版本记录：`PUT /api/graph/nodes/:id`、`PUT /api/graph/edges/:id`、事件更新和 `PUT /api/sources/:id` 会把实际变化字段写入 `server/data/override-store.json`，`GET /api/overrides` 可按 entityType/entityId/field 查询 before/after、updatedBy、reason 和 sourceTags；尚未完成的是前端重新生成、编辑、保存覆盖和版本查看 UI。
- 真实来源体系已升级为独立 Source 实体并接入前端审核台：后端支持 `/api/sources` CRUD、`/api/graph/sources` 兼容读取、来源可信度、抓取时间和审核状态，当前 curated graph 可自动推断 approved Source；前端 `/review` 可查看来源统计和导入批次来源 diff，仍需补更丰富的 Wikidata/arXiv 等自动采集器。
- 搜索页左侧分类和排序仍是展示壳：Companies/Products/Models 按钮没有改变结果；自动补全、热门建议、相关话题和无结果 AI 引导也还不完整。
- 时间线页缺少项目说明要求的控制器：年份滑条、起止年份筛选、事件类型筛选、年份对比和右侧年度 AI 总结尚未真正实现。
- 技术树页是后端分层结果的静态展示：没有左侧技术分类、右侧说明面板、节点展开下一层、演化路径高亮和从某技术自动生成学习路径的交互。
- 独立生态关系页尚不存在：当前首页星图可看关系，后端也有 BFS 路径 API，但没有专门的 Graph Relationship Explorer 页面、跳数限制、竞争圈、生态带和截图导出。
- 首页高级探索仍不完整：已有 D3 拖拽/缩放/点击/聚焦和本地路径高亮逻辑，但路径高亮没有接后端 `/api/graph/path` 的解释结果，布局切换、底部信息条、局部展开/收起和主题切换还没有完整实现。
- 收藏夹仅完成基础用户态：收藏节点、合集、最近查看已持久化；收藏路径、合集备注、拖拽排序、导出分享链接和推荐继续探索仍未实现。
- 节点详情资源区还偏 MVP：官网字段可展示，但 GitHub、论文、相关新闻、视频、文档等资源分组和复制摘要/分享链接还没有完整操作闭环。
- 数据持久化已覆盖用户态、AI 缓存、图谱 JSON、来源审核 JSON 和覆盖审计 JSON：收藏、合集、最近查看、搜索历史和 AI insight 写入 `server/data/user-state.json`，图谱写入 `server/data/graph-data.json`，Source 实体与导入批次写入 `server/data/source-store.json`，人工覆盖记录写入 `server/data/override-store.json`；本轮已统一 JSON store 原子写入、损坏备份恢复和 store meta，并新增数据健康检查，但还没有数据库级事务、跨进程锁和并发控制。

## 相关文件

- `.gitignore`：忽略依赖、构建产物、环境变量、日志和运行态 `server/data/user-state.json`、`server/data/source-store.json`、`server/data/override-store.json`。
- `.env.example`：提供 DeepSeek OpenAI-compatible 环境变量示例，包括 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL` 和 `DEEPSEEK_MODEL`。
- `TASKS.md`：记录 OpenConstellation 分章执行规则、当前进度、任务清单和相关文件。
- `package.json`：提供 `dev:api` 脚本用于启动 Express API 服务，提供 `seed:graph` 脚本用于生成后端公开来源 curated graph，并提供 `smoke:api` 脚本用于后端接口 smoke。
- `server/app.ts`：Express 应用装配入口，挂载 health、admin data-health、graph、me 和 AI 路由，并注入 graph/source/user/override stores；同时兜底加载 `.env`。
- `scripts/smokeApi.ts`：后端 smoke 脚本，临时启动 Express app 并验证核心 API、搜索筛选、路径查询、关系探索和数据健康端点。
- `scripts/seedCuratedGraphData.ts`：curated graph 生成脚本，维护 58 个公开来源 AI 生态节点和 62 条带来源关系，生成 `server/data/graph-data.json`。
- `server/routes/admin.ts`：后端运维路由，提供 `/api/admin/data-health` 数据健康检查，以及 `POST /api/admin/user-state/prune-stale-node-references` 用户态陈旧节点引用清理。
- `server/data/jsonFileStore.ts`：共享 JSON 文件持久化工具，负责默认文件创建、规范化读写、临时文件原子替换、损坏文件备份恢复和 store meta。
- `server/data/dataHealth.ts`：数据健康报告服务，检查图谱、来源、用户态和覆盖记录的一致性，并将核心错误与用户历史 warning 分开。
- `server/data/graph-data.json`：后端独立图谱数据文件，当前包含 58 个公开来源节点和 62 条边，是 `/api/graph` 等图谱接口的运行数据源。
- `server/data/graphStore.ts`：图谱数据访问入口，基于共享 JSON store 读取并原子写入 `server/data/graph-data.json`，支持保存整图、upsert/delete node 和 upsert/delete edge。
- `server/data/sourceStore.ts`：Source 实体和导入批次 JSON 持久化服务，基于共享 JSON store 支持从图谱 `sourceList` 推断 Source、upsert/delete source、创建 pending import batch、approve/reject 审核并生成可应用图谱。
- `server/data/overrideStore.ts`：AI/人工覆盖版本记录 JSON 持久化服务，基于共享 JSON store 保存 node、edge、event、source 的字段级 before/after、updatedBy、reason 和 sourceTags。
- `server/data/userStore.ts`：运行态用户星图 JSON 持久化服务，基于共享 JSON store 负责收藏、合集、最近查看、搜索历史和 AI 洞察缓存，并支持按当前图谱节点集合修剪 stale favorites/recentViews/collection nodes。
- `server/graphService.ts`：图谱筛选、节点详情、搜索 facets/suggestions、时间线、技术树、最短路径和关系探索的纯逻辑服务。
- `server/index.ts`：Express API 启动入口。
- `server/routes/ai.ts`：DeepSeek 与本地 fallback AI 能力路由；包含 insight、recommendations、learning-path、complete-node、status、probe。
- `server/routes/graph.ts`：图谱、节点详情、搜索、时间线、技术树和路径查询 REST API；同时提供图谱 JSON import pending 审核、GitHub repo 导入草稿、搜索无结果 AI draft 入审核队列、Source CRUD、导入批次 approve/reject、sourceList 维护、node/edge/event 创建更新删除接口和 `/api/overrides` 覆盖记录接口；AI 缓存会在已配置真实 provider 时自动绕过旧 fallback 缓存并刷新。
- `server/routes/health.ts`：健康检查路由，返回服务、运行时和不会泄露 key 的 AI provider 状态。
- `server/routes/me.ts`：收藏、合集、最近查看和搜索历史 REST API；包含删除与清空接口。
- `server/services/deepseek.ts`：DeepSeek OpenAI-compatible Chat Completions 封装、本地 fallback、provider 状态、probe、缓存使用策略和结构化节点草稿生成器。
- `src/api.ts`：前端 API client，封装图谱、用户星图、Source、导入批次、GitHub import、搜索 facets/suggestions、关系探索、搜索 AI 草稿、approve/reject 请求；正常模式要求后端 API 可用，仅 `VITE_ENABLE_MOCK_FALLBACK=true` 时允许开发兜底；包含删除/清空同步方法。
- `src/App.tsx`：应用启动时触发图谱和用户状态加载，并提供 `/`、`/explore` 星图入口和 `/review` 数据审核入口。
- `src/components/About.tsx`：项目说明页，文案已从 mock 占位说明调整为后端 API 与 AI synthesis 的 MVP 状态。
- `src/components/NodeProfile.tsx`：节点详情页接入 `/api/nodes/:id`、AI learning path、recommendations、complete-node，并把收藏按钮同步到后端持久化。
- `src/components/ReviewPanel.tsx`：轻量数据导入/来源审核台，支持 GitHub repo 导入草稿、批次队列、节点/边/来源 diff 预览、approve/reject 和局部错误/空状态。
- `src/components/SearchExplorer.tsx`：搜索页接入 `/api/search`，展示后端搜索结果、AI cluster synthesis，并同步搜索历史；无结果时可调用 `/api/search/draft` 生成结构化草稿并送入 `/review` 审核台。
- `src/components/Timeline.tsx`：时间线页接入 `/api/timeline`，使用后端聚合事件驱动播放流程。
- `src/components/TechTree.tsx`：技术树页接入 `/api/tech-tree`，使用后端生成的 Technology / Model / Product 分层。
- `src/components/Saved.tsx`：收藏页接入 collection 删除、collection 节点移除、recent views 清空和图谱定位入口。
- `src/store.ts`：Zustand 状态接入后端图谱、收藏、合集、最近查看和搜索历史同步，并补齐删除/移除/清空动作。
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
