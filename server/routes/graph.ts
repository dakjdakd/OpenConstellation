import { Router } from 'express';
import type { GraphStore } from '../data/graphStore.ts';
import type { UserStore } from '../data/userStore.ts';
import {
  buildTechTree,
  buildTimeline,
  filterGraph,
  findShortestPath,
  getNodeDetail,
  searchNodes,
} from '../graphService.ts';
import { generateAiResult, shouldUseCachedAiResult } from '../services/deepseek.ts';

export function createGraphRouter(graphStore: GraphStore, userStore: UserStore) {
  const router = Router();

  router.get('/graph/path', (req, res) => {
    const from = asString(req.query.from);
    const to = asString(req.query.to);
    res.json(findShortestPath(graphStore.getGraph(), from, to));
  });

  router.get('/graph', (req, res) => {
    res.json(
      filterGraph(graphStore.getGraph(), {
        type: asString(req.query.type),
        relationType: asString(req.query.relationType),
        tag: asString(req.query.tag),
        yearStart: asNumber(req.query.yearStart),
        yearEnd: asNumber(req.query.yearEnd),
      }),
    );
  });

  router.get('/nodes/:id', async (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.id);

    if (!node) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }

    userStore.addRecentView(node.id);

    const cacheKey = `node:${node.id}:insight`;
    const cached = userStore.getAiInsight(cacheKey);
    const aiInsight =
      shouldUseCachedAiResult(cached)
        ? cached
        :
      (await generateAiResult({
        task: 'insight',
        nodeId: node.id,
        nodeName: node.name,
        context: {
          type: node.type,
          subtitle: node.subtitle,
          description: node.description,
          tags: node.tags,
          edges: graph.edges.filter((edge) => edge.sourceId === node.id || edge.targetId === node.id).slice(0, 10),
        },
      }));

    if (!shouldUseCachedAiResult(cached)) userStore.cacheAiInsight(cacheKey, aiInsight);

    res.json(getNodeDetail(graph, node.id, aiInsight));
  });

  router.get('/search', async (req, res) => {
    const query = asString(req.query.q).trim();
    const graph = graphStore.getGraph();
    const items = searchNodes(graph, query);

    if (query) userStore.addSearchHistory(query);

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = query ? userStore.getAiInsight(cacheKey) : undefined;
    const aiInterpretation =
      shouldUseCachedAiResult(cached)
        ? cached
        :
      (query
        ? await generateAiResult({
            task: 'recommendations',
            query,
            context: {
              resultCount: items.length,
              topResults: items.slice(0, 5).map((node) => ({
                id: node.id,
                name: node.name,
                type: node.type,
                tags: node.tags,
              })),
            },
        })
        : undefined);

    if (query && aiInterpretation && !shouldUseCachedAiResult(cached)) userStore.cacheAiInsight(cacheKey, aiInterpretation);

    res.json({
      query,
      items,
      total: items.length,
      aiInterpretation,
    });
  });

  router.get('/timeline', (req, res) => {
    const items = buildTimeline(graphStore.getGraph(), {
      nodeId: asString(req.query.nodeId),
      yearStart: asNumber(req.query.yearStart),
      yearEnd: asNumber(req.query.yearEnd),
    });

    res.json({
      items,
      total: items.length,
    });
  });

  router.get('/tech-tree', (_req, res) => {
    res.json(buildTechTree(graphStore.getGraph()));
  });

  return router;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
