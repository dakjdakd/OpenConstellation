import { Router } from 'express';
import type { GraphStore } from '../data/graphStore.ts';
import type { OverrideEntityType, OverrideRecord, OverrideStore } from '../data/overrideStore.ts';
import type { SourceRecord, SourceStore } from '../data/sourceStore.ts';
import { makeSourceRecord } from '../data/sourceStore.ts';
import type { UserStore } from '../data/userStore.ts';
import type { GraphEdge, GraphNode, NodeType, RelationType } from '../../src/types.ts';
import {
  buildTechTree,
  buildTimeline,
  exploreRelationships,
  filterGraph,
  findShortestPath,
  getNodeDetail,
  searchGraph,
  searchNodes,
  type SearchSort,
} from '../graphService.ts';
import { generateAiResult, generateStructuredNodeDraft, shouldUseCachedAiResult } from '../services/deepseek.ts';

export function createGraphRouter(graphStore: GraphStore, userStore: UserStore, sourceStore: SourceStore, overrideStore: OverrideStore) {
  const router = Router();

  router.post('/graph/import', (req, res) => {
    const parsed = parseGraphImport(req.body, graphStore.getGraph());
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const explicitApply = req.query.apply === 'true' || req.body?.apply === true || req.body?.reviewStatus === 'approved';
    const sources = collectImportSources(parsed.graph, req.body?.sources, explicitApply ? 'approved' : 'pending');
    const batch = sourceStore.createImportBatch({
      provider: 'json',
      status: explicitApply ? 'approved' : 'pending',
      mode: parsed.mode,
      nodes: parsed.graph.nodes,
      edges: parsed.graph.edges,
      sources,
      notes: asString(req.body?.notes),
      summary: {
        warnings: parsed.warnings,
      },
    });

    if (!explicitApply) {
      res.status(202).json({
        batch,
        metadata: {
          status: 'pending_review',
          message: 'Import batch created. Review and approve it before applying to the graph.',
        },
      });
      return;
    }

    const current = graphStore.getGraph();
    const next = parsed.mode === 'replace' ? parsed.graph : mergeGraph(current, parsed.graph);
    const saved = graphStore.saveGraph(next);
    sourceStore.updateImportBatch(batch.id, { status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: asString(req.body?.reviewedBy) || 'api' });

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

  router.post('/graph/import/github', async (req, res) => {
    const repo = asString(req.body?.repo || req.query.repo).trim();
    if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
      res.status(400).json({ error: 'invalid_github_repo', message: 'Use owner/repo, for example huggingface/transformers.' });
      return;
    }

    const result = await buildGithubImportDraft(repo);
    if (result.ok === false) {
      res.status(result.status).json({ error: result.error, message: result.message });
      return;
    }

    const apply = req.query.apply === 'true' || req.body?.apply === true;
    const batch = sourceStore.createImportBatch({
      provider: 'github',
      status: apply ? 'approved' : 'pending',
      mode: 'merge',
      query: repo,
      nodes: [result.node],
      edges: result.edges,
      sources: result.sources.map((source) => ({ ...source, reviewStatus: apply ? 'approved' : 'pending' })),
      notes: asString(req.body?.notes),
      summary: { warnings: result.warnings },
    });

    if (!apply) {
      res.status(202).json({ batch, metadata: { status: 'pending_review', provider: 'github' } });
      return;
    }

    const saved = graphStore.saveGraph(mergeGraph(graphStore.getGraph(), { nodes: [result.node], edges: result.edges }));
    sourceStore.updateImportBatch(batch.id, { status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: asString(req.body?.reviewedBy) || 'api' });
    res.status(201).json({ ...saved, batch });
  });

  router.post('/search/draft', async (req, res) => {
    const query = asString(req.body?.query || req.query.q).trim();
    if (!query) {
      res.status(400).json({ error: 'search_query_required' });
      return;
    }

    const graph = graphStore.getGraph();
    const existingResults = searchNodes(graph, query);
    if (existingResults.length) {
      res.status(409).json({
        error: 'search_results_exist',
        message: 'The graph already has matching entities. Review search results before creating a new draft.',
        items: existingResults.slice(0, 8),
        total: existingResults.length,
      });
      return;
    }

    const draft = await generateStructuredNodeDraft({
      query,
      existingNodes: graph.nodes.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        tags: node.tags,
        subtitle: node.subtitle,
      })),
    });

    const parsedNode = parseNode({
      ...draft.node,
      id: makeUniqueNodeId(graph, draft.node.name || query),
      type: normalizeNodeType(draft.node.type),
      status: normalizeNodeStatus(draft.node.status),
      tags: draft.node.tags.length ? draft.node.tags : ['AI', 'Pending Review'],
      sourceList: draft.node.sourceList,
      aiSummary: draft.node.aiSummary,
      aiConfidence: draft.node.aiConfidence,
    });

    if (parsedNode.ok === false) {
      res.status(422).json({ error: 'ai_draft_invalid_node', message: parsedNode.error, draft });
      return;
    }

    const importedSources = draft.sources
      .map((source) => makeSourceRecord({
        url: source.url,
        title: source.title,
        publisher: source.publisher,
        kind: parseSourceKind(source.kind),
        trustLevel: parseTrustLevel(source.trustLevel),
        reviewStatus: 'pending',
        notes: 'Generated from empty search result and pending review.',
        metadata: {
          query,
          provider: draft.provider,
          source: draft.source,
          source_tags: draft.metadata.source_tags,
        },
      }))
      .filter((source) => source.url);
    const sourceUrls = [...new Set([...parsedNode.node.sourceList ?? [], ...importedSources.map((source) => source.url)])];
    const node = { ...parsedNode.node, sourceList: sourceUrls };
    const edges = draft.edges
      .map((edge) => parseEdge({
        id: makeUniqueEdgeId(graph, node.id, edge.targetId, edge.relationType),
        sourceId: node.id,
        targetId: edge.targetId,
        relationType: normalizeRelationType(edge.relationType),
        weight: 0.7,
        description: edge.description,
        confidence: edge.confidence,
        sourceList: edge.sourceList ?? [],
      }))
      .filter((edge): edge is { ok: true; edge: GraphEdge } => edge.ok)
      .map((edge) => edge.edge);

    const batch = sourceStore.createImportBatch({
      provider: 'manual',
      status: 'pending',
      mode: 'merge',
      query,
      nodes: [node],
      edges,
      sources: importedSources,
      notes: `AI draft generated from empty search: ${query}`,
      summary: {
        warnings: buildAiDraftWarnings(draft, node, edges),
      },
    });

    userStore.addSearchHistory(query);

    res.status(202).json({
      batch,
      draft: {
        provider: draft.provider,
        model: draft.model,
        confidence: draft.confidence,
        source: draft.source,
        editable: draft.editable,
        metadata: draft.metadata,
      },
      metadata: {
        status: 'pending_review',
        message: 'AI generated a structured graph draft. Review it in the data review panel before applying.',
      },
    });
  });

  router.get('/graph/sources', (_req, res) => {
    const items = sourceStore.getSources(graphStore.getGraph());

    res.json({ items, total: items.length });
  });

  router.get('/sources', (req, res) => {
    const reviewStatus = parseReviewStatus(req.query.reviewStatus);
    const items = sourceStore
      .getSources(graphStore.getGraph())
      .filter((source) => (reviewStatus ? source.reviewStatus === reviewStatus : true));
    res.json({ items, total: items.length });
  });

  router.post('/sources', (req, res) => {
    const parsed = parseSource(req.body);
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    res.status(201).json(sourceStore.upsertSource(parsed.source));
  });

  router.put('/sources/:id', (req, res) => {
    const current = sourceStore.getSources(graphStore.getGraph()).find((source) => source.id === req.params.id);
    if (!current) {
      res.status(404).json({ error: 'source_not_found' });
      return;
    }

    const parsed = parseSource({ ...current, ...req.body, id: req.params.id });
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const saved = sourceStore.upsertSource(parsed.source);
    recordOverrides(overrideStore, 'source', req.params.id, current, saved, req.body);
    res.json(saved);
  });

  router.delete('/sources/:id', (req, res) => {
    const current = sourceStore.getSources(graphStore.getGraph()).find((source) => source.id === req.params.id);
    if (!current) {
      res.status(404).json({ error: 'source_not_found' });
      return;
    }

    res.json(sourceStore.removeSource(req.params.id));
  });

  router.get('/import-batches', (req, res) => {
    const status = parseReviewStatus(req.query.status);
    const items = sourceStore.getImportBatches(status);
    res.json({ items, total: items.length });
  });

  router.get('/import-batches/:id', (req, res) => {
    const batch = sourceStore.getImportBatch(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'import_batch_not_found' });
      return;
    }
    res.json(batch);
  });

  router.post('/import-batches/:id/approve', (req, res) => {
    const result = sourceStore.approveImportBatch(req.params.id, graphStore.getGraph());
    if ('error' in result) {
      res.status(result.error === 'import_batch_not_found' ? 404 : 409).json({ error: result.error });
      return;
    }

    const saved = graphStore.saveGraph(result.graph);
    res.json({
      batch: sourceStore.updateImportBatch(result.batch.id, {
        status: 'approved',
        reviewedAt: result.batch.reviewedAt ?? new Date().toISOString(),
        reviewedBy: asString(req.body?.reviewedBy) || 'api',
      }) ?? result.batch,
      graph: saved,
      metadata: {
        totalNodes: saved.nodes.length,
        totalEdges: saved.edges.length,
      },
    });
  });

  router.post('/import-batches/:id/reject', (req, res) => {
    const batch = sourceStore.updateImportBatch(req.params.id, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: asString(req.body?.reviewedBy) || 'api',
      notes: asString(req.body?.notes),
    });
    if (!batch) {
      res.status(404).json({ error: 'import_batch_not_found' });
      return;
    }
    res.json(batch);
  });

  router.get('/overrides', (req, res) => {
    const entityType = parseOverrideEntityType(req.query.entityType);
    const entityId = asString(req.query.entityId);
    const field = asString(req.query.field);
    const items = overrideStore.getOverrides({
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(field ? { field } : {}),
    });
    res.json({ items, total: items.length });
  });

  router.post('/overrides', (req, res) => {
    const parsed = parseOverrideInput(req.body);
    if (parsed.ok === false) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    res.status(201).json(overrideStore.addOverride(parsed.record));
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
    const current = graph.nodes.find((node) => node.id === req.params.id);
    if (!current) {
      res.status(404).json({ error: 'node_not_found' });
      return;
    }

    const saved = graphStore.upsertNode(parsed.node);
    recordOverrides(overrideStore, 'node', req.params.id, current, parsed.node, req.body);
    res.json(saved);
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

    const nextNode = { ...node, sourceList };
    const saved = graphStore.upsertNode(nextNode);
    recordOverrides(overrideStore, 'node', req.params.id, node, nextNode, req.body, ['sourceList']);
    res.json(saved);
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
    const saved = graphStore.upsertNode(nextNode);
    recordOverrides(overrideStore, 'event', `${req.params.id}:${nextNode.events.length - 1}`, undefined, event, req.body, ['events']);
    res.status(201).json(saved);
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
    const currentEvent = events[index];
    events[index] = event;
    const saved = graphStore.upsertNode({ ...node, events });
    recordOverrides(overrideStore, 'event', `${req.params.id}:${index}`, currentEvent, event, req.body);
    res.json(saved);
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
    const current = graph.edges.find((edge) => edge.id === req.params.id);
    if (!current) {
      res.status(404).json({ error: 'edge_not_found' });
      return;
    }
    if (!edgeNodesExist(graph, parsed.edge)) {
      res.status(400).json({ error: 'edge_nodes_not_found' });
      return;
    }

    const saved = graphStore.upsertEdge(parsed.edge);
    recordOverrides(overrideStore, 'edge', req.params.id, current, parsed.edge, req.body);
    res.json(saved);
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

    const nextEdge = { ...edge, sourceList };
    const saved = graphStore.upsertEdge(nextEdge);
    recordOverrides(overrideStore, 'edge', req.params.id, edge, nextEdge, req.body, ['sourceList']);
    res.json(saved);
  });

  router.get('/graph/path', (req, res) => {
    const from = asString(req.query.from);
    const to = asString(req.query.to);
    res.json(findShortestPath(graphStore.getGraph(), from, to));
  });

  router.get('/graph/relationships', (req, res) => {
    const nodeId = asString(req.query.nodeId || req.query.center || req.query.id);
    if (!nodeId) {
      res.status(400).json({ error: 'node_id_required' });
      return;
    }

    const result = exploreRelationships(graphStore.getGraph(), {
      nodeId,
      hops: asBoundedNumber(req.query.hops, 1, 3),
      relationType: asString(req.query.relationType),
    });

    res.status(result.found ? 200 : 404).json(result);
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
    const searchResult = searchGraph(graph, {
      query,
      type: asString(req.query.type),
      tag: asString(req.query.tag),
      status: asString(req.query.status),
      sort: parseSearchSort(req.query.sort),
      limit: asBoundedNumber(req.query.limit, 1, 100),
    });
    const items = searchResult.items;

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
      ...searchResult,
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

function asBoundedNumber(value: unknown, min: number, max: number) {
  const parsed = asNumber(value);
  if (typeof parsed !== 'number') return undefined;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function parseSearchSort(value: unknown): SearchSort | undefined {
  return value === 'relevance' || value === 'popularity' || value === 'name' || value === 'recent' ? value : undefined;
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
  | { ok: true; mode: 'merge' | 'replace'; graph: { nodes: GraphNode[]; edges: GraphEdge[] }; warnings: string[] }
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

  const warnings = [
    ...nodes.filter((node) => !(node.sourceList ?? []).length).map((node) => `node_missing_source:${node.id}`),
    ...edges.filter((edge) => !(edge.sourceList ?? []).length).map((edge) => `edge_missing_source:${edge.id}`),
  ];

  return { ok: true, mode, graph: { nodes, edges }, warnings };
}

function parseSource(value: unknown): { ok: true; source: SourceRecord } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: 'invalid_source' };
  const url = asCleanString(value.url);
  if (!url || !isLikelyUrl(url)) return { ok: false, error: 'invalid_source_url' };

  return {
    ok: true,
    source: {
      ...makeSourceRecord({
        url,
        title: asCleanString(value.title),
        publisher: asCleanString(value.publisher),
        kind: parseSourceKind(value.kind),
        trustLevel: parseTrustLevel(value.trustLevel),
        reviewStatus: parseReviewStatus(value.reviewStatus) ?? 'pending',
        fetchedAt: asCleanString(value.fetchedAt) || undefined,
        notes: asCleanString(value.notes),
        metadata: isRecord(value.metadata) ? value.metadata : undefined,
      }),
      ...(typeof value.id === 'string' && value.id.trim() ? { id: value.id.trim() } : {}),
    },
  };
}

function collectImportSources(
  graph: { nodes: GraphNode[]; edges: GraphEdge[] },
  explicitSources: unknown,
  reviewStatus: SourceRecord['reviewStatus'],
) {
  const sourceRecords = Array.isArray(explicitSources)
    ? explicitSources.map(parseSource).filter((item): item is { ok: true; source: SourceRecord } => item.ok).map((item) => item.source)
    : [];
  const urls = [...new Set([...graph.nodes, ...graph.edges].flatMap((item) => item.sourceList ?? []))];
  const inferredSources = urls.filter(isLikelyUrl).map((url) => makeSourceRecord({ url, reviewStatus }));
  const byId = new Map([...sourceRecords, ...inferredSources].map((source) => [source.id, { ...source, reviewStatus }]));
  return [...byId.values()];
}

async function buildGithubImportDraft(repo: string): Promise<
  | { ok: true; node: GraphNode; edges: GraphEdge[]; sources: SourceRecord[]; warnings: string[] }
  | { ok: false; status: number; error: string; message?: string }
> {
  const apiUrl = `https://api.github.com/repos/${repo}`;
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'OpenConstellation-importer',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status === 404 ? 404 : 502,
        error: 'github_import_failed',
        message: `GitHub returned HTTP ${response.status}.`,
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const htmlUrl = asCleanString(data.html_url) || `https://github.com/${repo}`;
    const owner = isRecord(data.owner) ? asCleanString(data.owner.login) : repo.split('/')[0];
    const repoName = asCleanString(data.name) || repo.split('/')[1];
    const homepage = asCleanString(data.homepage);
    const description = asCleanString(data.description) || `${repoName} is an open source repository imported from GitHub.`;
    const topics = Array.isArray(data.topics) ? asStringArray(data.topics) : [];
    const language = asCleanString(data.language);
    const tags = [...new Set(['GitHub', 'Open Source', language, ...topics].filter(Boolean))].slice(0, 8);
    const nodeId = slugify(`github-${repo}`);
    const stars = typeof data.stargazers_count === 'number' ? data.stargazers_count : 0;

    const node: GraphNode = {
      id: nodeId,
      name: repoName,
      type: 'Open Source',
      subtitle: `${owner}/${repoName}`,
      description,
      website: homepage || htmlUrl,
      github: htmlUrl,
      logo: `https://www.google.com/s2/favicons?sz=64&domain=github.com`,
      tags: tags.length ? tags : ['GitHub', 'Open Source'],
      popularity: Math.max(3, Math.min(10, Math.round(Math.log10(Math.max(stars, 1)) + 4))),
      status: 'Active',
      sourceList: [htmlUrl, apiUrl],
      relatedTechnology: tags.length ? tags : ['Open Source'],
      aiSummary: `${repoName} was imported from GitHub metadata and is pending human review before it should be treated as curated graph knowledge.`,
      aiConfidence: 0.72,
      events: asCleanString(data.created_at)
        ? [{ date: asCleanString(data.created_at), title: 'Repository created', description: `${owner}/${repoName} was created on GitHub.` }]
        : [],
    };

    const sources = [
      makeSourceRecord({
        url: htmlUrl,
        kind: 'github',
        title: `${owner}/${repoName} GitHub repository`,
        publisher: 'GitHub',
        trustLevel: 'primary',
        reviewStatus: 'pending',
        metadata: { stars, forks: data.forks_count, language, topics },
      }),
      makeSourceRecord({
        url: apiUrl,
        kind: 'api',
        title: `${owner}/${repoName} GitHub REST metadata`,
        publisher: 'GitHub API',
        trustLevel: 'primary',
        reviewStatus: 'pending',
        metadata: { importedFrom: 'github-rest' },
      }),
    ];

    return { ok: true, node, edges: [], sources, warnings: homepage ? [] : ['github_repo_missing_homepage'] };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: 'github_import_unavailable',
      message: error instanceof Error ? error.message : 'Unable to reach GitHub.',
    };
  }
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

function parseReviewStatus(value: unknown): SourceRecord['reviewStatus'] | undefined {
  return value === 'pending' || value === 'approved' || value === 'rejected' ? value : undefined;
}

function parseSourceKind(value: unknown): SourceRecord['kind'] | undefined {
  return value === 'official' || value === 'github' || value === 'paper' || value === 'wiki' || value === 'news' || value === 'manual' || value === 'api'
    ? value
    : undefined;
}

function parseTrustLevel(value: unknown): SourceRecord['trustLevel'] | undefined {
  return value === 'primary' || value === 'secondary' || value === 'community' || value === 'unverified' ? value : undefined;
}

function isLikelyUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function makeUniqueNodeId(graph: { nodes: GraphNode[] }, name: string) {
  const base = slugify(name) || `ai-draft-${Date.now()}`;
  const existing = new Set(graph.nodes.map((node) => node.id));
  if (!existing.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function makeUniqueEdgeId(graph: { edges: GraphEdge[] }, sourceId: string, targetId: string, relationType: string) {
  const base = slugify(`e-${sourceId}-${targetId}-${relationType}`) || `edge-${Date.now()}`;
  const existing = new Set(graph.edges.map((edge) => edge.id));
  if (!existing.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function normalizeNodeType(value: string): NodeType {
  const exact = [...NODE_TYPES].find((type) => type.toLowerCase() === value.toLowerCase());
  if (exact) return exact;
  const normalized = value.toLowerCase();
  if (normalized.includes('company') || normalized.includes('organization') || normalized.includes('lab')) return 'Company';
  if (normalized.includes('model') || normalized.includes('llm')) return 'Model';
  if (normalized.includes('person') || normalized.includes('founder') || normalized.includes('researcher')) return 'Person';
  if (normalized.includes('technology') || normalized.includes('technique')) return 'Technology';
  if (normalized.includes('open') || normalized.includes('repository') || normalized.includes('library')) return 'Open Source';
  if (normalized.includes('research') || normalized.includes('paper')) return 'Research';
  if (normalized.includes('investor') || normalized.includes('fund')) return 'Investor';
  return 'Product';
}

function normalizeNodeStatus(value: string): GraphNode['status'] {
  if (isNodeStatus(value)) return value;
  const normalized = value.toLowerCase();
  if (normalized.includes('defunct') || normalized.includes('inactive')) return 'Defunct';
  if (normalized.includes('acquired')) return 'Acquired';
  if (normalized.includes('merged')) return 'Merged';
  return 'Active';
}

function normalizeRelationType(value: string): RelationType {
  const exact = [...RELATION_TYPES].find((type) => type.toLowerCase() === value.toLowerCase());
  return exact ?? 'related_to';
}

function buildAiDraftWarnings(draft: { provider: string; source: string; node: { sourceList: string[] }; edges: unknown[] }, node: GraphNode, edges: GraphEdge[]) {
  const warnings = [
    'ai_generated_pending_human_review',
    ...(draft.provider === 'fallback' ? [`ai_provider_fallback:${draft.source}`] : []),
    ...(!(node.sourceList ?? []).length ? [`node_missing_source:${node.id}`] : []),
    ...(edges.length === 0 ? ['ai_draft_has_no_edges'] : []),
  ];
  return [...new Set(warnings)];
}

function recordOverrides(
  overrideStore: OverrideStore,
  entityType: OverrideEntityType,
  entityId: string,
  before: unknown,
  after: unknown,
  requestBody: unknown,
  forcedFields?: string[],
) {
  const changedFields = forcedFields ?? diffTopLevelFields(before, after);
  if (!changedFields.length) return [];

  const body = isRecord(requestBody) ? requestBody : {};
  const sourceTags = asStringArray(body.sourceTags).length
    ? asStringArray(body.sourceTags)
    : inferOverrideSourceTags(before, after);
  const records = changedFields.map((field) => ({
    entityType,
    entityId,
    field,
    before: readField(before, field),
    after: readField(after, field),
    updatedBy: asCleanString(body.updatedBy) || asCleanString(body.reviewedBy) || 'api',
    reason: asCleanString(body.reason) || asCleanString(body.overrideReason),
    sourceTags,
    metadata: {
      route: 'graph',
      aiRelated: isAiRelatedField(field),
    },
  }));

  return overrideStore.addOverrides(records);
}

function diffTopLevelFields(before: unknown, after: unknown) {
  if (!isRecord(before) || !isRecord(after)) return [];
  const ignoredFields = new Set(['x', 'y', 'vx', 'vy', 'fx', 'fy', 'source', 'target']);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => !ignoredFields.has(key) && stableJson(before[key]) !== stableJson(after[key]));
}

function readField(value: unknown, field: string) {
  return isRecord(value) ? value[field] : value;
}

function stableJson(value: unknown) {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortJson(value[key]);
      return acc;
    }, {});
}

function inferOverrideSourceTags(before: unknown, after: unknown) {
  const tags = new Set<string>(['human-override']);
  [before, after].forEach((value) => {
    if (!isRecord(value)) return;
    if (typeof value.aiSummary === 'string' || typeof value.aiConfidence === 'number') tags.add('ai-generated-field');
    if (Array.isArray(value.sourceList)) tags.add('source-backed');
    if (isRecord(value.metadata) && Array.isArray(value.metadata.source_tags)) {
      value.metadata.source_tags.forEach((tag) => {
        if (typeof tag === 'string' && tag.trim()) tags.add(tag.trim());
      });
    }
  });
  return [...tags];
}

function isAiRelatedField(field: string) {
  return field === 'aiSummary' || field === 'aiConfidence' || field === 'description' || field === 'events';
}

function parseOverrideInput(value: unknown): { ok: true; record: Omit<OverrideRecord, 'id' | 'createdAt'> } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: 'invalid_override' };
  const entityType = parseOverrideEntityType(value.entityType);
  const entityId = asCleanString(value.entityId);
  const field = asCleanString(value.field);
  const updatedBy = asCleanString(value.updatedBy) || 'api';
  if (!entityType || !entityId || !field) return { ok: false, error: 'invalid_override_required_fields' };

  return {
    ok: true,
    record: {
      entityType,
      entityId,
      field,
      before: value.before,
      after: value.after,
      updatedBy,
      reason: asCleanString(value.reason),
      sourceTags: asStringArray(value.sourceTags).length ? asStringArray(value.sourceTags) : ['manual'],
      ...(isRecord(value.metadata) ? { metadata: value.metadata } : {}),
    },
  };
}

function parseOverrideEntityType(value: unknown): OverrideEntityType | undefined {
  return value === 'node' || value === 'edge' || value === 'event' || value === 'source' ? value : undefined;
}

function isNodeStatus(value: string): value is GraphNode['status'] {
  return value === 'Active' || value === 'Defunct' || value === 'Acquired' || value === 'Merged';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
