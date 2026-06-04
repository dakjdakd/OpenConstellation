import { Router } from 'express';
import type { GraphStore } from '../data/graphStore.ts';
import type { UserStore } from '../data/userStore.ts';
import type { GraphEdge, GraphNode, NodeType, RelationType } from '../../src/types.ts';
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

  router.post('/graph/import', (req, res) => {
    const parsed = parseGraphImport(req.body, graphStore.getGraph());
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const current = graphStore.getGraph();
    const next = parsed.mode === 'replace' ? parsed.graph : mergeGraph(current, parsed.graph);
    const saved = graphStore.saveGraph(next);

    res.status(201).json({
      ...saved,
      metadata: {
        mode: parsed.mode,
        importedNodes: parsed.graph.nodes.length,
        importedEdges: parsed.graph.edges.length,
        totalNodes: saved.nodes.length,
        totalEdges: saved.edges.length,
      },
    });
  });

  router.get('/graph/sources', (_req, res) => {
    const graph = graphStore.getGraph();
    const items = [...new Set([...graph.nodes, ...graph.edges].flatMap((item) => item.sourceList ?? []))].sort((a, b) =>
      a.localeCompare(b),
    );

    res.json({ items, total: items.length });
  });

  router.post('/graph/nodes', (req, res) => {
    const parsed = parseNode(req.body);
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const graph = graphStore.getGraph();
    if (graph.nodes.some((node) => node.id === parsed.node.id)) {
      res.status(409).json({ error: 'node_already_exists' });
      return;
    }

    res.status(201).json(graphStore.upsertNode(parsed.node));
  });

  router.put('/graph/nodes/:id', (req, res) => {
    const parsed = parseNode({ ...req.body, id: req.params.id });
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const graph = graphStore.getGraph();
    if (!graph.nodes.some((node) => node.id === req.params.id)) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }

    res.json(graphStore.upsertNode(parsed.node));
  });

  router.delete('/graph/nodes/:id', (req, res) => {
    const graph = graphStore.getGraph();
    if (!graph.nodes.some((node) => node.id === req.params.id)) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }

    res.json(graphStore.removeNode(req.params.id));
  });

  router.put('/graph/nodes/:id/sources', (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.id);
    const sourceList = asStringArray(req.body?.sourceList);

    if (!node) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }
    if (!sourceList.length) {
      res.status(400).json({ error: 'source_list_required' });
      return;
    }

    res.json(graphStore.upsertNode({ ...node, sourceList }));
  });

  router.post('/graph/nodes/:id/events', (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.id);
    const event = parseEvent(req.body);

    if (!node) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }
    if (!event) {
      res.status(400).json({ error: 'invalid_event' });
      return;
    }

    const nextNode = { ...node, events: [...(node.events ?? []), event] };
    res.status(201).json(graphStore.upsertNode(nextNode));
  });

  router.put('/graph/nodes/:id/events/:index', (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.id);
    const index = Number(req.params.index);
    const event = parseEvent(req.body);

    if (!node) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }
    if (!Number.isInteger(index) || index < 0 || index >= (node.events ?? []).length) {
      res.status(404).json({ error: 'event_not_found' });
      return;
    }
    if (!event) {
      res.status(400).json({ error: 'invalid_event' });
      return;
    }

    const events = [...(node.events ?? [])];
    events[index] = event;
    res.json(graphStore.upsertNode({ ...node, events }));
  });

  router.delete('/graph/nodes/:id/events/:index', (req, res) => {
    const graph = graphStore.getGraph();
    const node = graph.nodes.find((item) => item.id === req.params.id);
    const index = Number(req.params.index);

    if (!node) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }
    if (!Number.isInteger(index) || index < 0 || index >= (node.events ?? []).length) {
      res.status(404).json({ error: 'event_not_found' });
      return;
    }

    const events = (node.events ?? []).filter((_event, eventIndex) => eventIndex !== index);
    res.json(graphStore.upsertNode({ ...node, events }));
  });

  router.post('/graph/edges', (req, res) => {
    const parsed = parseEdge(req.body);
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const graph = graphStore.getGraph();
    if (graph.edges.some((edge) => edge.id === parsed.edge.id)) {
      res.status(409).json({ error: 'edge_already_exists' });
      return;
    }
    if (!edgeNodesExist(graph, parsed.edge)) {
      res.status(400).json({ error: 'edge_nodes_not_found' });
      return;
    }

    res.status(201).json(graphStore.upsertEdge(parsed.edge));
  });

  router.put('/graph/edges/:id', (req, res) => {
    const parsed = parseEdge({ ...req.body, id: req.params.id });
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const graph = graphStore.getGraph();
    if (!graph.edges.some((edge) => edge.id === req.params.id)) {
      res.status(404).json({ error: 'edge_not_found' });
      return;
    }
    if (!edgeNodesExist(graph, parsed.edge)) {
      res.status(400).json({ error: 'edge_nodes_not_found' });
      return;
    }

    res.json(graphStore.upsertEdge(parsed.edge));
  });

  router.delete('/graph/edges/:id', (req, res) => {
    const graph = graphStore.getGraph();
    if (!graph.edges.some((edge) => edge.id === req.params.id)) {
      res.status(404).json({ error: 'edge_not_found' });
      return;
    }

    res.json(graphStore.removeEdge(req.params.id));
  });

  router.put('/graph/edges/:id/sources', (req, res) => {
    const graph = graphStore.getGraph();
    const edge = graph.edges.find((item) => item.id === req.params.id);
    const sourceList = asStringArray(req.body?.sourceList);

    if (!edge) {
      res.status(404).json({ error: 'edge_not_found' });
      return;
    }
    if (!sourceList.length) {
      res.status(400).json({ error: 'source_list_required' });
      return;
    }

    res.json(graphStore.upsertEdge({ ...edge, sourceList }));
  });

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

const NODE_TYPES = new Set<NodeType>([
  'Company',
  'Product',
  'Model',
  'Person',
  'Technology',
  'Open Source',
  'Research',
  'Investor',
]);

const RELATION_TYPES = new Set<RelationType>([
  'founded_by',
  'competes_with',
  'uses',
  'inspired_by',
  'invested_in',
  'built_on',
  'acquired',
  'powered_by',
  'related_to',
]);

function parseNode(value: unknown): { ok: true; node: GraphNode } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: 'invalid_node' };

  const id = asCleanString(value.id);
  const name = asCleanString(value.name);
  const type = asCleanString(value.type) as NodeType;
  const subtitle = asCleanString(value.subtitle);
  const description = asCleanString(value.description);
  const tags = asStringArray(value.tags);
  const status = asCleanString(value.status) as GraphNode['status'];
  const popularity = typeof value.popularity === 'number' && Number.isFinite(value.popularity) ? value.popularity : 5;

  if (!id || !name || !NODE_TYPES.has(type) || !subtitle || !description || !tags.length || !isNodeStatus(status)) {
    return { ok: false, error: 'invalid_node_required_fields' };
  }

  return {
    ok: true,
    node: {
      id,
      name,
      type,
      subtitle,
      description,
      tags,
      popularity: Math.max(1, Math.min(10, popularity)),
      status,
      ...copyOptionalNodeFields(value),
    },
  };
}

function parseEdge(value: unknown): { ok: true; edge: GraphEdge } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: 'invalid_edge' };

  const id = asCleanString(value.id);
  const sourceId = asCleanString(value.sourceId);
  const targetId = asCleanString(value.targetId);
  const relationType = asCleanString(value.relationType) as RelationType;
  const weight = typeof value.weight === 'number' && Number.isFinite(value.weight) ? value.weight : 1;

  if (!id || !sourceId || !targetId || !RELATION_TYPES.has(relationType)) {
    return { ok: false, error: 'invalid_edge_required_fields' };
  }

  return {
    ok: true,
    edge: {
      id,
      sourceId,
      targetId,
      relationType,
      weight: Math.max(0.1, Math.min(10, weight)),
      ...(typeof value.description === 'string' ? { description: value.description.trim() } : {}),
      ...(Array.isArray(value.sourceList) ? { sourceList: asStringArray(value.sourceList) } : {}),
      ...(typeof value.confidence === 'number' ? { confidence: value.confidence } : {}),
    },
  };
}

function parseGraphImport(value: unknown, currentGraph: { nodes: GraphNode[] }):
  | { ok: true; mode: 'merge' | 'replace'; graph: { nodes: GraphNode[]; edges: GraphEdge[] } }
  | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: 'invalid_import_payload' };

  const mode = value.mode === 'replace' ? 'replace' : 'merge';
  const rawNodes = Array.isArray(value.nodes) ? value.nodes : [];
  const rawEdges = Array.isArray(value.edges) ? value.edges : [];

  if (!rawNodes.length && !rawEdges.length) return { ok: false, error: 'import_payload_empty' };

  const parsedNodes = rawNodes.map(parseNode);
  const firstNodeError = parsedNodes.find((item) => item.ok === false);
  if (firstNodeError?.ok === false) return { ok: false, error: firstNodeError.error };

  const nodes = parsedNodes.filter((item): item is { ok: true; node: GraphNode } => item.ok).map((item) => item.node);
  const nodeIds = new Set(nodes.map((node) => node.id));

  if (nodeIds.size !== nodes.length) return { ok: false, error: 'duplicate_import_node_id' };

  const parsedEdges = rawEdges.map(parseEdge);
  const firstEdgeError = parsedEdges.find((item) => item.ok === false);
  if (firstEdgeError?.ok === false) return { ok: false, error: firstEdgeError.error };

  const edges = parsedEdges.filter((item): item is { ok: true; edge: GraphEdge } => item.ok).map((item) => item.edge);
  const edgeIds = new Set(edges.map((edge) => edge.id));

  if (edgeIds.size !== edges.length) return { ok: false, error: 'duplicate_import_edge_id' };
  const allowedNodeIds = mode === 'merge' ? new Set([...currentGraph.nodes.map((node) => node.id), ...nodeIds]) : nodeIds;

  if (!edges.every((edge) => allowedNodeIds.has(edge.sourceId) && allowedNodeIds.has(edge.targetId))) {
    return { ok: false, error: mode === 'merge' ? 'import_edge_nodes_not_found' : 'import_edge_nodes_must_exist_in_payload' };
  }

  return { ok: true, mode, graph: { nodes, edges } };
}

function parseEvent(value: unknown): GraphNode['events'][number] | null {
  if (!isRecord(value)) return null;
  const date = asCleanString(value.date);
  const description = asCleanString(value.description);
  if (!date || !description || Number.isNaN(new Date(date).getTime())) return null;
  return {
    date,
    ...(typeof value.title === 'string' && value.title.trim() ? { title: value.title.trim() } : {}),
    description,
  };
}

function edgeNodesExist(graph: { nodes: GraphNode[] }, edge: Pick<GraphEdge, 'sourceId' | 'targetId'>) {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  return nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId);
}

function mergeGraph(current: { nodes: GraphNode[]; edges: GraphEdge[] }, incoming: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const nodes = new Map(current.nodes.map((node) => [node.id, node]));
  incoming.nodes.forEach((node) => nodes.set(node.id, node));

  const nodeIds = new Set(nodes.keys());
  const edges = new Map(current.edges.map((edge) => [edge.id, edge]));
  incoming.edges
    .filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId))
    .forEach((edge) => edges.set(edge.id, edge));

  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()],
  };
}

function copyOptionalNodeFields(value: Record<string, unknown>) {
  return {
    ...(typeof value.logo === 'string' ? { logo: value.logo.trim() } : {}),
    ...(typeof value.website === 'string' ? { website: value.website.trim() } : {}),
    ...(typeof value.github === 'string' ? { github: value.github.trim() } : {}),
    ...(typeof value.foundedAt === 'string' ? { foundedAt: value.foundedAt.trim() } : {}),
    ...(Array.isArray(value.founders) ? { founders: asStringArray(value.founders) } : {}),
    ...(typeof value.country === 'string' ? { country: value.country.trim() } : {}),
    ...(Array.isArray(value.relatedTechnology) ? { relatedTechnology: asStringArray(value.relatedTechnology) } : {}),
    ...(Array.isArray(value.sourceList) ? { sourceList: asStringArray(value.sourceList) } : {}),
    ...(typeof value.aiSummary === 'string' ? { aiSummary: value.aiSummary.trim() } : {}),
    ...(typeof value.aiConfidence === 'number' ? { aiConfidence: value.aiConfidence } : {}),
    ...(Array.isArray(value.events) ? { events: value.events.map(parseEvent).filter((event) => event !== null) } : {}),
  };
}

function asCleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()) : [];
}

function isNodeStatus(value: string): value is GraphNode['status'] {
  return value === 'Active' || value === 'Defunct' || value === 'Acquired' || value === 'Merged';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
