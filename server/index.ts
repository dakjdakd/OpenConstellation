import 'dotenv/config';
import express from 'express';
import { mockData } from '../src/data.ts';
import { buildFallbackResult, generateAiResult, type AiRequestPayload, type AiTask } from './services/deepseek.ts';

const app = express();
const port = Number(process.env.API_PORT || process.env.PORT || 3001);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'openconstellation-api',
    ai: {
      provider: process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'fallback',
      model: process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || 'deepseek-v4-flash',
      baseUrl: process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
    },
  });
});

app.post('/api/ai/:task', async (req, res) => {
  const task = req.params.task as AiTask;

  if (!['insight', 'complete-node', 'learning-path', 'recommendations'].includes(task)) {
    res.status(404).json({ error: 'unknown_ai_task' });
    return;
  }

  const payload = normalizeAiPayload(task, req.body);
  const result = await generateAiResult(payload);
  res.json(result);
});

app.get('/api/ai/insight/:nodeId', async (req, res) => {
  const node = mockData.nodes.find((item) => item.id === req.params.nodeId);

  if (!node) {
    res.status(404).json({ error: 'node_not_found' });
    return;
  }

  const result = await generateAiResult({
    task: 'insight',
    nodeId: node.id,
    nodeName: node.name,
    context: {
      type: node.type,
      subtitle: node.subtitle,
      description: node.description,
      tags: node.tags,
      relatedEdges: mockData.edges.filter((edge) => edge.sourceId === node.id || edge.targetId === node.id).slice(0, 8),
    },
  });

  res.json(result);
});

app.get('/api/ai/recommendations/:nodeId', async (req, res) => {
  const node = mockData.nodes.find((item) => item.id === req.params.nodeId);

  if (!node) {
    res.status(404).json({ error: 'node_not_found' });
    return;
  }

  const neighborIds = new Set(
    mockData.edges.flatMap((edge) => {
      if (edge.sourceId === node.id) return [edge.targetId];
      if (edge.targetId === node.id) return [edge.sourceId];
      return [];
    }),
  );
  const neighbors = mockData.nodes.filter((item) => neighborIds.has(item.id)).slice(0, 6);

  const result = await generateAiResult({
    task: 'recommendations',
    nodeId: node.id,
    nodeName: node.name,
    context: {
      node,
      neighbors: neighbors.map((item) => ({ id: item.id, name: item.name, type: item.type, tags: item.tags })),
    },
  });

  res.json({
    ...result,
    metadata: {
      ...result.metadata,
      recommendedNodeIds: neighbors.map((item) => item.id),
    },
  });
});

app.post('/api/ai/fallback', (req, res) => {
  res.json(buildFallbackResult(normalizeAiPayload('insight', req.body), 'manual_fallback_request'));
});

app.listen(port, () => {
  console.log(`OpenConstellation API listening on http://localhost:${port}`);
});

function normalizeAiPayload(task: AiTask, body: unknown): AiRequestPayload {
  if (!isRecord(body)) return { task };

  return {
    task,
    query: asString(body.query),
    nodeId: asString(body.nodeId),
    nodeName: asString(body.nodeName),
    context: body.context,
  };
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
