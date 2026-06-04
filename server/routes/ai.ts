import { Router } from 'express';
import type { GraphStore } from '../data/graphStore.ts';
import type { UserStore } from '../data/userStore.ts';
import {
  buildFallbackResult,
  generateAiResult,
  getAiProviderStatus,
  probeAiProvider,
  shouldUseCachedAiResult,
  type AiRequestPayload,
  type AiTask,
} from '../services/deepseek.ts';

const AI_TASKS = ['insight', 'complete-node', 'learning-path', 'recommendations'] as const;

export function createAiRouter(graphStore: GraphStore, userStore?: UserStore) {
  const router = Router();

  router.post('/fallback', (req, res) => {
    res.json(buildFallbackResult(normalizeAiPayload('insight', req.body), 'manual_fallback_request'));
  });

  router.get('/status', (_req, res) => {
    res.json(getAiProviderStatus());
  });

  router.post('/probe', async (_req, res) => {
    const result = await probeAiProvider();
    res.status(result.ok ? 200 : 502).json(result);
  });

  router.post('/:task', async (req, res) => {
    const task = req.params.task as AiTask;

    if (!isAiTask(task)) {
      res.status(404).json({ error: 'unknown_ai_task' });
      return;
    }

    const payload = normalizeAiPayload(task, req.body);
    const result = await generateAiResult(payload);
    res.json(result);
  });

  router.get('/insight/:nodeId', async (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.nodeId);

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
        relatedEdges: graph.edges.filter((edge) => edge.sourceId === node.id || edge.targetId === node.id).slice(0, 8),
      },
    });

    res.json(result);
  });

  router.get('/recommendations/:nodeId', async (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.nodeId);

    if (!node) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }

    const neighborIds = new Set(
      graph.edges.flatMap((edge) => {
        if (edge.sourceId === node.id) return [edge.targetId];
        if (edge.targetId === node.id) return [edge.sourceId];
        return [];
      }),
    );
    const neighbors = graph.nodes.filter((item) => neighborIds.has(item.id)).slice(0, 6);

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

  router.get('/learning-path/:nodeId', async (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.nodeId);

    if (!node) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }

    const neighborIds = new Set(
      graph.edges.flatMap((edge) => {
        if (edge.sourceId === node.id) return [edge.targetId];
        if (edge.targetId === node.id) return [edge.sourceId];
        return [];
      }),
    );
    const neighbors = graph.nodes.filter((item) => neighborIds.has(item.id)).slice(0, 8);
    const result = await getCachedAiResult(`node:${node.id}:learning-path`, {
      task: 'learning-path',
      nodeId: node.id,
      nodeName: node.name,
      context: {
        node,
        prerequisites: neighbors.map((item) => ({ id: item.id, name: item.name, type: item.type, tags: item.tags })),
        events: node.events ?? [],
      },
    });

    res.json({
      ...result,
      metadata: {
        ...result.metadata,
        pathNodeIds: [node.id, ...neighbors.map((item) => item.id)],
      },
    });
  });

  router.get('/complete-node/:nodeId', async (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.nodeId);

    if (!node) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }

    const relatedEdges = graph.edges.filter((edge) => edge.sourceId === node.id || edge.targetId === node.id);
    const result = await getCachedAiResult(`node:${node.id}:complete-node`, {
      task: 'complete-node',
      nodeId: node.id,
      nodeName: node.name,
      context: {
        node,
        relatedEdges,
        missingFields: getMissingFields(node),
      },
    });

    res.json({
      ...result,
      metadata: {
        ...result.metadata,
        nodeId: node.id,
        missingFields: getMissingFields(node),
      },
    });
  });

  return router;

  async function getCachedAiResult(cacheKey: string, payload: AiRequestPayload) {
    const cached = userStore?.getAiInsight(cacheKey);
    if (shouldUseCachedAiResult(cached)) return cached;
    const result = await generateAiResult(payload);
    userStore?.cacheAiInsight(cacheKey, result);
    return result;
  }
}

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

function isAiTask(task: string): task is AiTask {
  return AI_TASKS.includes(task as AiTask);
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getMissingFields(node: unknown) {
  const record = isRecord(node) ? node : {};
  return ['website', 'github', 'foundedAt', 'founders', 'sourceList', 'aiSummary'].filter((key) => {
    const value = record[key];
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === '';
  });
}
