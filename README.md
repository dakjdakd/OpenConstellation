<div align="center">
  <img src="assets/logo.png" alt="OpenConstellation logo" width="128" height="128" />

  # OpenConstellation

  **An AI ecosystem knowledge graph for exploring companies, models, papers, products, technologies, and their relationships.**

  OpenConstellation turns the fast-moving AI landscape into an explorable constellation: search an entity, inspect its context, follow relationships, review sources, and safely promote AI-generated drafts into the curated graph.
</div>

---

## Why OpenConstellation

The AI ecosystem changes too quickly for a flat list to stay useful. A company launches a model, the model depends on a paper, the paper popularizes a technique, the technique becomes an infrastructure category, and a dozen products appear around it.

OpenConstellation represents that ecosystem as a living graph:

- **Nodes** are AI companies, models, products, papers, people, technologies, frameworks, and infrastructure projects.
- **Edges** describe relationships such as creator, ownership, technology dependency, research lineage, competition, integration, or ecosystem adjacency.
- **Sources** make graph knowledge auditable instead of mysterious.
- **AI drafting** helps fill missing AI-related entities, but review approval is required before new data enters the main graph.

The project goal is not to become a generic encyclopedia. It is intentionally focused on the AI ecosystem.

---

## Core Experience

### Explore the AI Map

Open the main graph and move through a constellation of AI ecosystem entities. Existing entities such as `OpenAI`, `Claude`, `Transformer`, `LangChain`, `Llama`, `PyTorch`, `RAG`, and vector database tools appear as connected nodes.

When a known node is selected from Explore search, the graph focuses and centers that node so users are not dropped into an empty canvas.

### Search With Scope Awareness

Search is designed for real product behavior rather than silent empty states:

- Existing AI entity: returns graph results.
- Missing but AI-related keyword: asks the backend/AI layer to prepare a structured draft for review.
- Non-AI keyword such as `cat` or another ordinary word: shows a clear explanation that OpenConstellation is focused on AI ecosystem knowledge.
- AI provider unavailable: the app does not fake a draft; it tells the user that AI validation is currently unavailable.

This keeps the product honest: no blank screen, no random graph pollution, and no pretending that fallback content is verified data.

### Review Before Writing

AI-generated drafts do not immediately modify the main graph. They enter the Review workflow first.

The review page lets maintainers inspect:

- proposed nodes
- proposed relationships
- source records
- import metadata
- confidence and provider tags

Only approved batches are applied to the graph store.

### Timeline and Technology Views

The project includes additional pages for browsing the ecosystem from different angles:

- **Timeline**: follow AI ecosystem events chronologically.
- **Tech Tree**: inspect technical categories and dependencies.
- **Saved**: collect important entities for later review.
- **About**: explain product scope and data notes.
- **Review**: approve or reject pending graph imports.

---

## Feature Highlights

- Interactive AI ecosystem graph built with React, D3, and local backend APIs.
- Backend-served graph data instead of frontend-only mock data.
- Public-source curated seed graph with nodes, edges, events, sources, summaries, and metadata.
- DeepSeek OpenAI-compatible provider integration for AI interpretation and draft generation.
- Scope classification for empty searches, preventing ordinary non-AI keywords from becoming graph drafts.
- Review-gated import workflow for AI-generated and external data.
- Source model with review status, metadata, and import batch tracking.
- Node detail pages with ecosystem context and AI-assisted summaries.
- Search history and focused navigation across the existing pages.
- API smoke tests for validating the local backend behavior.

---

## Architecture

```text
OpenConstellation
├─ src/                         React frontend
│  ├─ components/               Graph, search, navigation, review, pages
│  ├─ api.ts                    Frontend API client
│  ├─ store.ts                  Client state
│  └─ types.ts                  Shared graph-facing types
├─ server/                      Express backend
│  ├─ index.ts                  API server entry
│  ├─ routes/                   Graph, AI, source, and review routes
│  ├─ services/                 DeepSeek and AI helper services
│  └─ data/                     JSON-backed graph/source/user stores
├─ scripts/                     Data seed and smoke verification scripts
├─ public/assets/logo.png       Browser favicon and public app logo
├─ assets/logo.png              Repository and README logo source
└─ TASKS.md                     Implementation task log
```

---

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, React Router, Vite, TypeScript |
| Styling | Tailwind CSS 4 |
| Graph | D3 |
| Animation / UI | motion, lucide-react |
| State | Zustand |
| Backend | Express, TypeScript, tsx |
| AI Provider | DeepSeek OpenAI-compatible Chat Completions API |
| Persistence | JSON-backed local stores |
| Validation | TypeScript compile check, Vite build, API smoke script |

---

## How The Search Loop Works

### 1. Existing entity

Example:

```text
OpenAI
```

Flow:

```text
User searches OpenAI
→ frontend calls backend search
→ backend finds existing graph node
→ frontend displays results or centers node in Explore
```

### 2. Missing but AI-related entity

Example:

```text
new AI agent memory framework
```

Flow:

```text
User searches missing AI-related keyword
→ backend checks existing graph
→ backend asks AI provider whether the term belongs to the AI ecosystem
→ if eligible, backend generates a structured draft
→ draft enters pending Review queue
→ maintainer approves
→ approved data writes into the main graph
```

### 3. Non-AI keyword

Example:

```text
猫
```

Flow:

```text
User searches ordinary keyword
→ backend finds no graph result
→ scope check marks it out of scope
→ frontend shows a clear prompt
→ no draft is created
→ graph data remains unchanged
```

### 4. AI provider unavailable

Flow:

```text
User searches missing keyword
→ backend cannot confirm scope through provider
→ app shows provider-unavailable guidance
→ no fallback draft is silently created
```

This behavior is intentional. The project should be useful and honest, not noisy.

---

## API Overview

The backend runs on port `3001` by default.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/graph` | Read the full graph |
| `GET` | `/api/search?q=...` | Search graph entities |
| `GET` | `/api/search/scope?q=...` | Check whether an empty search belongs to the AI ecosystem |
| `POST` | `/api/search/draft` | Generate a pending AI graph draft for eligible AI keywords |
| `GET` | `/api/sources` | List source records |
| `GET` | `/api/import-batches` | List import/review batches |
| `POST` | `/api/import-batches/:id/approve` | Approve a pending batch |
| `POST` | `/api/import-batches/:id/reject` | Reject a pending batch |
| `GET` | `/api/ai/status` | Check AI provider status |
| `POST` | `/api/ai/probe` | Probe configured provider |

---

## Local Setup

### Prerequisites

- Node.js 20 or newer recommended
- npm
- DeepSeek API key for real AI-backed draft generation

### Install

```bash
npm install
```

### Configure Environment

Copy `.env.example` to `.env`, then fill in the provider key:

```bash
DEEPSEEK_API_KEY="YOUR_DEEPSEEK_API_KEY"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-v4-flash"
API_PORT="3001"
API_PROXY_TARGET="http://localhost:3001"
```

The server also supports OpenAI-compatible aliases:

```bash
OPENAI_API_KEY=""
OPENAI_BASE_URL="https://api.deepseek.com"
OPENAI_MODEL="deepseek-v4-flash"
```

DeepSeek-specific variables take priority.

### Run Frontend And Backend

Open two terminals:

```bash
npm run dev:api
```

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

The Vite frontend proxies `/api/*` requests to:

```text
http://localhost:3001
```

### Seed Curated Graph Data

If you need to regenerate the curated graph JSON:

```bash
npm run seed:graph
```

### Validate

```bash
npm run lint
npm run build
npm run smoke:api
```

On Windows PowerShell, `npm.cmd` can be used explicitly:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run smoke:api
```

---

## Data Model

OpenConstellation is built around a unified graph model:

### Graph Node

Represents an AI ecosystem entity.

Typical fields:

- name
- type
- subtitle
- description
- logo
- website / GitHub / paper links
- source list
- confidence
- related technologies
- AI summary

### Graph Edge

Represents a relationship between two nodes.

Typical fields:

- source node
- target node
- relationship type
- description
- confidence
- source list

### Source

Represents evidence behind graph data.

Typical fields:

- URL
- title
- domain
- review status
- trust metadata
- import batch metadata

### Import Batch

Represents a pending, approved, or rejected graph update.

This is what keeps AI-generated data out of the main graph until it has been reviewed.

---

## Project Scope

OpenConstellation is focused on AI ecosystem intelligence, including:

- AI labs and companies
- model families
- AI products
- research papers
- technical concepts
- infrastructure tools
- open-source AI projects
- notable AI ecosystem people

It is not intended for generic web search or general encyclopedia topics.

That means ordinary keywords such as food, animals, weather, celebrities unrelated to AI, or random consumer topics should produce guidance instead of graph drafts.

---

## Current Status

The current version is a local MVP with:

- working frontend pages
- backend-served graph data
- search-to-review AI draft workflow
- DeepSeek-compatible provider integration
- review-gated graph updates
- source and import batch stores
- favicon / repository branding using `assets/logo.png`

Some automation can depend on local network and API key availability. When the AI provider is unavailable, the app is designed to fail conservatively and avoid writing low-quality fallback nodes into the graph.

---

## Roadmap Ideas

The current implementation intentionally avoids adding unrelated pages or generic encyclopedia features. Useful next steps would be:

- richer source extraction from trusted public APIs
- better review diff visualization
- duplicate detection before approving drafts
- exportable graph snapshots
- optional hosted deployment with persistent storage
- automated freshness checks for high-impact AI entities

---

## Repository Notes

- `server/data/graph-data.json` is the main curated graph store.
- `server/data/source-store.json` is intentionally ignored for local review-state churn.
- `.env` files are ignored; use `.env.example` as the public template.
- The app title and browser favicon use `public/assets/logo.png`.
- The GitHub README logo uses `assets/logo.png` with an explicit small display size.

---

## License

This repository does not currently declare a license. Add one before distributing or accepting external contributions.
