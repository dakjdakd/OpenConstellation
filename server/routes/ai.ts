import { Router } from 'express';
import type { GraphStore } from '../data/graphStore.ts';
import { buildFallbackResult, generateAiResult, type AiRequestPayload, type AiTask } from '../services/deepseek.ts';

const AI_TASKS = ['insight', 'complete-node', 'learning-path', 'recommendations'] as const;

export function createAiRouter(graphStore: GraphStore) {
  const router = Router();

  router.post('/fallback', (req, res) => {
    res.json(buildFallbackResult(normalizeAiPayload('insight', req.body), 'manual_fallback_request'));
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

  return router;
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
