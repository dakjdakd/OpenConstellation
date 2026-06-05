export type AiTask = 'insight' | 'complete-node' | 'learning-path' | 'recommendations';

export interface AiRequestPayload {
  task: AiTask;
  query?: string;
  nodeId?: string;
  nodeName?: string;
  context?: unknown;
}

export interface AiResult {
  task: AiTask;
  provider: 'deepseek' | 'fallback';
  model: string;
  confidence: number;
  source: string;
  editable: boolean;
  content: string;
  suggestions: string[];
  metadata: Record<string, unknown>;
}

export interface AiProviderStatus {
  configured: boolean;
  provider: 'deepseek' | 'fallback';
  model: string;
  baseUrl: string;
  keySource?: 'DEEPSEEK_API_KEY' | 'OPENAI_API_KEY';
}

export interface AiProviderProbe {
  ok: boolean;
  status: AiProviderStatus;
  latencyMs: number;
  message: string;
  providerHttpStatus?: number;
}

export interface SearchScopeResult {
  eligible: boolean;
  reason: 'ai_related' | 'out_of_scope' | 'provider_unavailable';
  provider: 'deepseek' | 'heuristic' | 'fallback';
  confidence: number;
  message: string;
}

export interface StructuredNodeDraft {
  provider: 'deepseek' | 'fallback';
  model: string;
  confidence: number;
  source: string;
  editable: boolean;
  node: {
    name: string;
    type: string;
    subtitle: string;
    description: string;
    website?: string;
    github?: string;
    foundedAt?: string;
    founders?: string[];
    country?: string;
    tags: string[];
    popularity: number;
    status: string;
    relatedTechnology?: string[];
    sourceList: string[];
    aiSummary: string;
    aiConfidence: number;
    events?: Array<{ date: string; title?: string; description: string }>;
  };
  edges: Array<{
    targetId: string;
    relationType: string;
    description?: string;
    confidence?: number;
    sourceList?: string[];
  }>;
  sources: Array<{
    url: string;
    title?: string;
    publisher?: string;
    kind?: string;
    trustLevel?: string;
  }>;
  metadata: Record<string, unknown>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-v4-flash';

export function getAiConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '',
    baseUrl: (process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
    model: process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL,
  };
}

export function getAiProviderStatus(): AiProviderStatus {
  const config = getAiConfig();
  const keySource = process.env.DEEPSEEK_API_KEY
    ? 'DEEPSEEK_API_KEY'
    : process.env.OPENAI_API_KEY
      ? 'OPENAI_API_KEY'
      : undefined;

  return {
    configured: Boolean(config.apiKey),
    provider: config.apiKey ? 'deepseek' : 'fallback',
    model: config.model,
    baseUrl: config.baseUrl,
    ...(keySource ? { keySource } : {}),
  };
}

export function shouldUseCachedAiResult(cached: AiResult | undefined) {
  if (!cached) return false;
  const status = getAiProviderStatus();
  return !(status.configured && cached.provider === 'fallback');
}

export async function probeAiProvider(): Promise<AiProviderProbe> {
  const startedAt = Date.now();
  const config = getAiConfig();
  const status = getAiProviderStatus();

  if (!config.apiKey) {
    return {
      ok: false,
      status,
      latencyMs: Date.now() - startedAt,
      message: 'AI provider is not configured. Set DEEPSEEK_API_KEY or OPENAI_API_KEY.',
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'Return compact JSON only.',
          },
          {
            role: 'user',
            content: JSON.stringify({ ping: 'openconstellation-ai-provider-probe' }),
          },
        ],
        temperature: 0,
        max_tokens: 64,
        response_format: { type: 'json_object' },
      }),
    });

    return {
      ok: response.ok,
      status,
      latencyMs: Date.now() - startedAt,
      message: response.ok ? 'AI provider responded successfully.' : `AI provider returned HTTP ${response.status}.`,
      providerHttpStatus: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      status,
      latencyMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'AI provider probe failed.',
    };
  }
}

export async function generateAiResult(payload: AiRequestPayload): Promise<AiResult> {
  const config = getAiConfig();

  if (!config.apiKey) {
    return buildFallbackResult(payload, 'provider_unconfigured');
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are OpenConstellation AI, a knowledge graph assistant for AI companies, models, people, and technologies. Return only compact JSON with keys: content, suggestions, confidence, metadata.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: payload.task,
        query: payload.query,
        nodeId: payload.nodeId,
        nodeName: payload.nodeName,
        context: payload.context,
        output_contract: {
          content: 'short Chinese or bilingual analytical paragraph',
          suggestions: ['3 concise exploration suggestions'],
          confidence: 'number from 0 to 1',
          metadata: 'object with source_tags and editable_fields',
        },
      }),
    },
  ];

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.35,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return buildFallbackResult(payload, `provider_http_${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return buildFallbackResult(payload, 'provider_empty_response');
    }

    const parsed = parseProviderJson(rawContent);

    return {
      task: payload.task,
      provider: 'deepseek',
      model: config.model,
      confidence: clampConfidence(parsed.confidence, 0.82),
      source: 'deepseek_openai_compatible',
      editable: true,
      content: normalizeText(parsed.content, buildFallbackContent(payload)),
      suggestions: normalizeSuggestions(parsed.suggestions, payload),
      metadata: {
        baseUrl: config.baseUrl,
        source_tags: ['deepseek', 'openai-compatible', 'ai-generated'],
        editable_fields: ['content', 'suggestions', 'confidence'],
        ...(isRecord(parsed.metadata) ? parsed.metadata : {}),
      },
    };
  } catch (error) {
    return buildFallbackResult(payload, error instanceof Error ? error.message : 'provider_error');
  }
}

export async function generateStructuredNodeDraft(payload: {
  query: string;
  existingNodes: Array<{ id: string; name: string; type: string; tags: string[]; subtitle?: string }>;
}): Promise<StructuredNodeDraft> {
  const config = getAiConfig();
  const query = payload.query.trim();

  if (!config.apiKey) {
    return buildFallbackNodeDraft(query, payload.existingNodes, 'provider_unconfigured');
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You draft editable OpenConstellation knowledge graph nodes for AI ecosystem entities. Return only compact JSON. Do not invent primary-source URLs; include only URLs you are confident are real.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        query,
        existing_nodes: payload.existingNodes.slice(0, 80),
        output_contract: {
          node: {
            name: 'canonical entity name',
            type: 'one of Company, Product, Model, Person, Technology, Open Source, Research, Investor',
            subtitle: 'short factual subtitle',
            description: '2-3 sentence neutral profile',
            website: 'optional official website URL',
            github: 'optional GitHub URL',
            foundedAt: 'optional ISO date or year string',
            founders: ['optional founder names'],
            country: 'optional country or region',
            tags: ['3-8 concise tags'],
            popularity: 'integer 1-10',
            status: 'Active, Defunct, Acquired, or Merged',
            relatedTechnology: ['optional technology tags'],
            sourceList: ['official/source URLs only if known'],
            aiSummary: 'one sentence explaining why this node belongs in the AI graph',
            aiConfidence: 'number 0-1',
            events: [{ date: 'ISO date or year-date', title: 'optional title', description: 'short event description' }],
          },
          edges: [
            {
              targetId: 'id from existing_nodes only',
              relationType: 'one of founded_by, competes_with, uses, inspired_by, invested_in, built_on, acquired, powered_by, related_to',
              description: 'short relationship rationale',
              confidence: 'number 0-1',
              sourceList: ['source URLs only if known'],
            },
          ],
          sources: [{ url: 'source URL', title: 'source title', publisher: 'publisher', kind: 'official/github/paper/wiki/news/api', trustLevel: 'primary/secondary/community/unverified' }],
          confidence: 'overall draft confidence 0-1',
          metadata: { source_tags: ['deepseek', 'ai-generated', 'pending-review'] },
        },
      }),
    },
  ];

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return buildFallbackNodeDraft(query, payload.existingNodes, `provider_http_${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const parsed = parseProviderJson(data.choices?.[0]?.message?.content ?? '');
    const normalized = normalizeStructuredNodeDraft(parsed, query, payload.existingNodes);

    return {
      ...normalized,
      provider: 'deepseek',
      model: config.model,
      source: 'deepseek_openai_compatible',
      editable: true,
      metadata: {
        baseUrl: config.baseUrl,
        source_tags: ['deepseek', 'openai-compatible', 'ai-generated', 'pending-review'],
        editable_fields: ['node', 'edges', 'sources', 'confidence'],
        ...(isRecord(parsed.metadata) ? parsed.metadata : {}),
      },
    };
  } catch (error) {
    return buildFallbackNodeDraft(query, payload.existingNodes, error instanceof Error ? error.message : 'provider_error');
  }
}

export async function classifySearchQueryScope(query: string): Promise<SearchScopeResult> {
  const trimmed = query.trim();
  const heuristic = classifySearchQueryScopeHeuristic(trimmed);
  const config = getAiConfig();

  if (!trimmed) {
    return {
      eligible: false,
      reason: 'out_of_scope',
      provider: 'heuristic',
      confidence: 1,
      message: 'Search query is empty.',
    };
  }

  if (!config.apiKey) {
    if (!heuristic.eligible) return heuristic;
    return {
      eligible: false,
      reason: 'provider_unavailable',
      provider: 'fallback',
      confidence: heuristic.confidence,
      message: '当前无法确认该关键词是否适合加入图谱。请换一个 AI 相关关键词，或配置 DeepSeek 后稍后重试 AI 判断。',
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content:
              'Classify whether a search query belongs in an AI ecosystem knowledge graph. Return compact JSON only.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              query: trimmed,
              allowed_scope: [
                'AI companies and labs',
                'AI models',
                'AI products',
                'AI techniques and infrastructure',
                'AI papers and research',
                'AI people and investors',
                'AI open source projects',
              ],
              out_of_scope_examples: ['cat', '猫', 'weather', 'food', 'travel', 'generic animals', 'generic daily objects'],
              output_contract: {
                eligible: 'boolean',
                reason: 'ai_related or out_of_scope',
                confidence: 'number 0-1',
                message: 'short Chinese message for the user',
              },
            }),
          },
        ],
        temperature: 0,
        max_tokens: 180,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      if (!heuristic.eligible) return heuristic;
      return {
        eligible: false,
        reason: 'provider_unavailable',
        provider: 'fallback',
        confidence: heuristic.confidence,
        message: `当前无法确认该关键词是否适合加入图谱。AI provider returned HTTP ${response.status}.`,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const parsed = parseProviderJson(data.choices?.[0]?.message?.content ?? '');
    const eligible = parsed.eligible === true;
    const reason = eligible ? 'ai_related' : 'out_of_scope';

    return {
      eligible,
      reason,
      provider: 'deepseek',
      confidence: clampConfidence(parsed.confidence, eligible ? 0.8 : 0.72),
      message: normalizeText(
        parsed.message,
        eligible
          ? '这个关键词属于 AI 生态，可以生成待审核图谱草稿。'
          : '这个关键词不在当前知识图谱范围内。OpenConstellation 当前聚焦 AI 生态。',
      ),
    };
  } catch (error) {
    if (!heuristic.eligible) return heuristic;
    return {
      eligible: false,
      reason: 'provider_unavailable',
      provider: 'fallback',
      confidence: heuristic.confidence,
      message: error instanceof Error
        ? `当前无法确认该关键词是否适合加入图谱：${error.message}`
        : '当前无法确认该关键词是否适合加入图谱。请换一个 AI 相关关键词或稍后重试。',
    };
  }
}

function parseProviderJson(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}

export function buildFallbackResult(payload: AiRequestPayload, reason = 'local_fallback'): AiResult {
  const config = getAiConfig();

  return {
    task: payload.task,
    provider: 'fallback',
    model: config.model,
    confidence: 0.68,
    source: reason,
    editable: true,
    content: buildFallbackContent(payload),
    suggestions: normalizeSuggestions(undefined, payload),
    metadata: {
      baseUrl: config.baseUrl,
      source_tags: ['local-fallback', 'editable-placeholder'],
      editable_fields: ['content', 'suggestions', 'confidence'],
      reason,
    },
  };
}

function buildFallbackContent(payload: AiRequestPayload) {
  const subject = payload.nodeName || payload.query || payload.nodeId || 'this constellation sector';

  if (payload.task === 'learning-path') {
    return `${subject} can be explored from three layers: origin context, technical dependencies, and downstream products. Start with the closest foundational node, then compare competing branches.`;
  }

  if (payload.task === 'recommendations') {
    return `${subject} is best explored through adjacent companies, models, and enabling technologies. The fallback engine selected candidates by local graph proximity and shared tags.`;
  }

  if (payload.task === 'complete-node') {
    return `${subject} has enough visible graph context to draft a structured profile, but fields should remain editable until verified against primary sources.`;
  }

  return `${subject} sits inside the AI ecosystem as a knowledge-graph node whose influence can be read through connection density, chronology, and technology lineage.`;
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeSuggestions(value: unknown, payload: AiRequestPayload) {
  if (Array.isArray(value)) {
    const cleaned = value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, 5);
    if (cleaned.length) return cleaned;
  }

  const subject = payload.nodeName || payload.query || 'current node';
  return [
    `Trace upstream dependencies for ${subject}.`,
    `Compare neighboring companies, models, and tools.`,
    `Review timeline events before accepting generated fields.`,
  ];
}

function clampConfidence(value: unknown, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

function buildFallbackNodeDraft(
  query: string,
  existingNodes: Array<{ id: string; name: string; type: string; tags: string[] }>,
  reason: string,
): StructuredNodeDraft {
  const config = getAiConfig();
  const neighbor = existingNodes.find((node) => node.tags.some((tag) => /agent|model|llm|ai/i.test(tag))) ?? existingNodes[0];
  return {
    provider: 'fallback',
    model: config.model,
    confidence: 0.58,
    source: reason,
    editable: true,
    node: {
      name: query,
      type: 'Product',
      subtitle: 'AI ecosystem entity pending review',
      description: `${query} was requested from search but is not yet present in the curated graph. This AI-generated draft is intentionally conservative and must be verified before approval.`,
      tags: ['AI', 'Pending Review'],
      popularity: 4,
      status: 'Active',
      relatedTechnology: ['AI'],
      sourceList: [],
      aiSummary: `${query} is an editable draft generated from an empty search result and should be reviewed against primary sources.`,
      aiConfidence: 0.58,
      events: [],
    },
    edges: neighbor
      ? [
          {
            targetId: neighbor.id,
            relationType: 'related_to',
            description: `Fallback draft links ${query} to ${neighbor.name} as a nearby review candidate.`,
            confidence: 0.45,
            sourceList: [],
          },
        ]
      : [],
    sources: [],
    metadata: {
      baseUrl: config.baseUrl,
      source_tags: ['local-fallback', 'ai-generated', 'pending-review'],
      editable_fields: ['node', 'edges', 'sources', 'confidence'],
      reason,
    },
  };
}

function normalizeStructuredNodeDraft(
  parsed: Record<string, unknown>,
  query: string,
  existingNodes: Array<{ id: string; name: string; type: string; tags: string[] }>,
): Omit<StructuredNodeDraft, 'provider' | 'model' | 'source' | 'editable' | 'metadata'> {
  const rawNode = isRecord(parsed.node) ? parsed.node : {};
  const sourceList = asUrlArray(rawNode.sourceList);
  const sources = Array.isArray(parsed.sources)
    ? parsed.sources.filter(isRecord).map((source) => ({
        url: normalizeUrl(source.url),
        title: normalizeText(source.title, ''),
        publisher: normalizeText(source.publisher, ''),
        kind: normalizeText(source.kind, ''),
        trustLevel: normalizeText(source.trustLevel, ''),
      })).filter((source) => source.url)
    : [];
  const sourceUrls = [...new Set([...sourceList, ...sources.map((source) => source.url)])];
  const existingIds = new Set(existingNodes.map((node) => node.id));
  const edges = Array.isArray(parsed.edges)
    ? parsed.edges.filter(isRecord).map((edge) => ({
        targetId: normalizeText(edge.targetId, ''),
        relationType: normalizeText(edge.relationType, 'related_to'),
        description: normalizeText(edge.description, ''),
        confidence: clampConfidence(edge.confidence, 0.62),
        sourceList: asUrlArray(edge.sourceList),
      })).filter((edge) => existingIds.has(edge.targetId))
    : [];

  return {
    confidence: clampConfidence(parsed.confidence, 0.74),
    node: {
      name: normalizeText(rawNode.name, query),
      type: normalizeText(rawNode.type, 'Product'),
      subtitle: normalizeText(rawNode.subtitle, 'AI ecosystem entity pending review'),
      description: normalizeText(rawNode.description, `${query} is an AI ecosystem entity drafted from an empty graph search and pending human review.`),
      website: normalizeUrl(rawNode.website) || undefined,
      github: normalizeUrl(rawNode.github) || undefined,
      foundedAt: normalizeText(rawNode.foundedAt, '') || undefined,
      founders: asStringList(rawNode.founders),
      country: normalizeText(rawNode.country, '') || undefined,
      tags: asStringList(rawNode.tags).slice(0, 8),
      popularity: clampInteger(rawNode.popularity, 4, 1, 10),
      status: normalizeText(rawNode.status, 'Active'),
      relatedTechnology: asStringList(rawNode.relatedTechnology),
      sourceList: sourceUrls,
      aiSummary: normalizeText(rawNode.aiSummary, `${query} is an editable AI-generated draft pending source review.`),
      aiConfidence: clampConfidence(rawNode.aiConfidence, clampConfidence(parsed.confidence, 0.74)),
      events: normalizeEvents(rawNode.events),
    },
    edges,
    sources,
  };
}

function normalizeUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function asUrlArray(value: unknown) {
  return Array.isArray(value) ? [...new Set(value.map(normalizeUrl).filter(Boolean))] : [];
}

function asStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeEvents(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((event) => ({
    date: normalizeText(event.date, ''),
    title: normalizeText(event.title, '') || undefined,
    description: normalizeText(event.description, ''),
  })).filter((event) => event.date && event.description).slice(0, 5);
}

function classifySearchQueryScopeHeuristic(query: string): SearchScopeResult {
  const normalized = query.trim().toLowerCase();
  const aiPattern = /\b(ai|agi|llm|ml|machine learning|deep learning|neural|model|agent|rag|embedding|transformer|diffusion|openai|anthropic|claude|gpt|gemini|llama|mistral|deepseek|hugging\s*face|pytorch|tensorflow|nvidia|cursor|copilot|sora|perplexity)\b/i;
  const chineseAiPattern = /(人工智能|大模型|机器学习|深度学习|神经网络|模型|智能体|向量|检索增强|生成式|开源模型|机器人|算法)/;
  const outOfScopePattern = /^(cat|cats|dog|dogs|weather|food|travel|movie|music|猫|狗|天气|美食|旅游|电影|音乐)$/i;

  if (outOfScopePattern.test(normalized)) {
    return {
      eligible: false,
      reason: 'out_of_scope',
      provider: 'heuristic',
      confidence: 0.9,
      message: '这个关键词不在当前知识图谱范围内。OpenConstellation 当前聚焦 AI 生态。',
    };
  }

  if (aiPattern.test(normalized) || chineseAiPattern.test(query)) {
    return {
      eligible: true,
      reason: 'ai_related',
      provider: 'heuristic',
      confidence: 0.72,
      message: '这个关键词看起来属于 AI 生态，可以生成待审核图谱草稿。',
    };
  }

  return {
    eligible: false,
    reason: 'out_of_scope',
    provider: 'heuristic',
    confidence: 0.62,
    message: '这个关键词不在当前知识图谱范围内。OpenConstellation 当前聚焦 AI 生态。',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
