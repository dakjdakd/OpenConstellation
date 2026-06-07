# README Image Guide / README 配图建议

| 位置 | 推荐文件名 | 图片类型 | 内容说明 | 尺寸建议 | 是否必需 | 没有图片时的占位方式 |
| --- | --- | --- | --- | --- | --- | --- |
| Logo / Icon | `assets/logo.png`、`public/assets/logo.png` | Logo / app icon | 使用当前 OpenConstellation 标识，保持 README、浏览器 favicon 和应用公开资源一致。建议保留透明背景，避免复杂文字。 | `512x512` 原图，README 中显示为 `128x128` | 必需 | 使用 `[Project Logo]`，并在 README 顶部保留居中标识位。 |
| Hero Banner 或 Hero Demo | `assets/readme/hero-demo.png` | 产品主截图 | 展示主图谱画布、顶部搜索框、节点详情抽屉或地图状态栏。第一屏需要让读者一眼知道这是 AI 生态知识图谱产品。 | `1600x900` 或 `1920x1080`，16:9 | 必需 | `[Hero Demo Image: show the OpenConstellation graph map, search experience, and review queue]` |
| 主功能截图 | `assets/readme/graph-explorer.png` | 主界面截图 | 展示 `/explore` 页面，重点露出图谱节点、关系线、搜索入口、筛选面板和节点详情。建议选中一个高辨识度实体，例如 OpenAI 或 Transformer。 | `1600x1000`，桌面宽屏 | 推荐 | `[Main Graph Screenshot: show graph canvas, filters, search, and node detail drawer]` |
| 核心流程图 | `assets/readme/search-review-flow.png` | 流程图 / Mermaid 导出图 | 展示“搜索 -> 范围判断 -> AI 草稿 -> Review 队列 -> 批准合并”的完整链路。可用 README 中的 Mermaid 图导出为 PNG，或设计一张简洁架构流程图。 | `1400x800` | 推荐 | 保留 README 内置 Mermaid 流程图。 |
| 使用场景图或结果图 | `assets/readme/search-results.png` | 搜索结果截图 | 展示 `/search?q=OpenAI` 或类似查询的结果页，包含左侧筛选、结果卡片和右侧 AI Interpretation 区域。 | `1600x1000` | 推荐 | `[Search Result Screenshot: show scoped AI ecosystem search results]` |
| 配置界面或配置示例图 | `assets/readme/env-config.png` | 配置示例图 / 终端截图 | 展示 `.env.example` 中关键配置，或展示终端同时运行 `npm run dev:api` 与 `npm run dev` 后的成功状态。不要暴露真实 API Key。 | `1200x700` | 可选 | 保留 README 的配置表和 `.env` 代码块。 |
| 架构图 | `assets/readme/architecture.png` | 系统架构图 | 用一张简洁图展示 React Frontend、Express API、DeepSeek/OpenAI-compatible Provider、JSON Stores、Source Registry、Review Queue 与 Graph Store 的数据流。 | `1400x900` | 推荐 | `[Architecture Diagram: show frontend, API server, AI provider, review queue, and JSON stores]` |
| 可选 GIF / 动图 | `assets/readme/search-review-demo.gif` | 8-12 秒操作 GIF | 录制从搜索 `OpenAI` 到定位节点，再搜索一个缺失 AI 关键词并跳转 Review 的流程。GIF 应服务于理解，避免过度装饰。 | `1280x720`，控制在合理文件大小内 | 可选但强烈推荐 | `[Demo GIF: search an entity, create a draft, and open the review queue]` |
| 社区、赞助或生态相关图片 | `assets/readme/community.png` | 社区/生态入口图 | 当前项目尚未提供社区、赞助或生态入口。正式发布后可展示贡献流程、数据来源生态或社区入口，不建议现在编造链接。 | `1200x600` | 暂不必需 | `[Community Links: add after official community or sponsor channels exist]` |

## 制作建议

- README 顶部优先使用真实应用截图，而不是抽象装饰图。
- 截图中不要暴露真实 API Key、私有数据或本地敏感路径。
- GIF 控制在 8-12 秒，突出一个完整工作流，不要录制无关点击。
- 架构图应保持信息密度适中，重点解释数据如何进入 Review 队列以及何时写入主图谱。
- 如果暂时没有图片，保留清晰占位符即可，不要使用与项目无关的 stock image。
