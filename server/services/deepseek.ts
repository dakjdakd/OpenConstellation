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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
