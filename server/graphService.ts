import type { GraphData, GraphEdge, GraphNode } from '../src/types.ts';
import type { AiResult } from './services/deepseek.ts';

export interface NodeDetail {
  node: GraphNode;
  incomingEdges: GraphEdge[];
  outgoingEdges: GraphEdge[];
  relatedNodes: GraphNode[];
  events: Array<{ date: string; title?: string; description: string }>;
  aiInsight?: AiResult;
}

export interface TimelineEvent {
  date: string;
  title?: string;
  description: string;
  node: Pick<GraphNode, 'id' | 'name' | 'type' | 'tags'>;
}

export interface PathResult {
  from: string;
  to: string;
  found: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
  explanation: string;
}

export interface TechTreeTier {
  id: string;
  name: string;
  nodes: Array<Pick<GraphNode, 'id' | 'name' | 'type' | 'subtitle' | 'description' | 'tags'>>;
}

export type SearchSort = 'relevance' | 'popularity' | 'name' | 'recent';

export interface SearchOptions {
  query: string;
  type?: string;
  tag?: string;
  status?: string;
  sort?: SearchSort;
  limit?: number;
}

export interface SearchFacet {
  value: string;
  count: number;
}

export interface SearchPayload {
  query: string;
  items: GraphNode[];
  total: number;
  facets: {
    types: SearchFacet[];
    tags: SearchFacet[];
    statuses: SearchFacet[];
  };
  suggestions: Array<Pick<GraphNode, 'id' | 'name' | 'type' | 'subtitle' | 'tags'>>;
  filters: {
    type?: string;
    tag?: string;
    status?: string;
    sort: SearchSort;
    limit?: number;
  };
}

export interface RelationshipExplorerOptions {
  nodeId: string;
  hops?: number;
  relationType?: string;
}

export interface RelationshipExplorerResult {
  nodeId: string;
  found: boolean;
  center?: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layers: Array<{ depth: number; nodes: GraphNode[] }>;
  relationCounts: SearchFacet[];
  explanation: string;
}

export function filterGraph(
  graph: GraphData,
  filters: {
    type?: string;
    relationType?: string;
    tag?: string;
    yearStart?: number;
    yearEnd?: number;
  },
): GraphData {
  let nodes = [...graph.nodes];
  let edges = [...graph.edges];

  if (filters.type) {
    nodes = nodes.filter((node) => node.type === filters.type);
  }

  if (filters.tag) {
    const tag = filters.tag.toLowerCase();
    nodes = nodes.filter((node) => node.tags.some((item) => item.toLowerCase() === tag));
  }

  if (typeof filters.yearStart === 'number' || typeof filters.yearEnd === 'number') {
    const start = filters.yearStart ?? Number.NEGATIVE_INFINITY;
    const end = filters.yearEnd ?? Number.POSITIVE_INFINITY;
    nodes = nodes.filter((node) => {
      if (!node.foundedAt) return false;
      const year = new Date(node.foundedAt).getFullYear();
      return Number.isFinite(year) && year >= start && year <= end;
    });
  }

  if (filters.relationType) {
    edges = edges.filter((edge) => edge.relationType === filters.relationType);
    const connected = new Set<string>();
    edges.forEach((edge) => {
      connected.add(edge.sourceId);
      connected.add(edge.targetId);
    });
    nodes = nodes.filter((node) => connected.has(node.id));
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  edges = edges.filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId));

  return { nodes, edges };
}

export function getNodeDetail(graph: GraphData, nodeId: string, aiInsight?: AiResult): NodeDetail | null {
  const node = graph.nodes.find((item) => item.id === nodeId);
  if (!node) return null;

  const incomingEdges = graph.edges.filter((edge) => edge.targetId === node.id);
  const outgoingEdges = graph.edges.filter((edge) => edge.sourceId === node.id);
  const relatedIds = new Set<string>();

  incomingEdges.forEach((edge) => relatedIds.add(edge.sourceId));
  outgoingEdges.forEach((edge) => relatedIds.add(edge.targetId));

  return {
    node,
    incomingEdges,
    outgoingEdges,
    relatedNodes: graph.nodes.filter((item) => relatedIds.has(item.id)),
    events: node.events ?? [],
    ...(aiInsight ? { aiInsight } : {}),
  };
}

export function searchNodes(graph: GraphData, query: string) {
  return searchGraph(graph, { query }).items;
}

export function searchGraph(graph: GraphData, options: SearchOptions): SearchPayload {
  const query = options.query.trim();
  const normalized = query.toLowerCase();
  const sort = normalizeSearchSort(options.sort);
  const scoredNodes = graph.nodes
    .map((node) => ({
      node,
      score: normalized ? scoreNode(node, normalized) : 1,
    }))
    .filter((item) => !normalized || item.score > 0);

  const filtered = scoredNodes.filter(({ node }) => {
    if (options.type && node.type !== options.type) return false;
    if (options.status && node.status !== options.status) return false;
    if (options.tag) {
      const tag = options.tag.toLowerCase();
      if (!node.tags.some((item) => item.toLowerCase() === tag)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => compareSearchResults(a, b, sort));
  const limited = typeof options.limit === 'number' ? sorted.slice(0, Math.max(0, options.limit)) : sorted;

  return {
    query,
    items: limited.map((item) => item.node),
    total: filtered.length,
    facets: buildSearchFacets(scoredNodes.map((item) => item.node)),
    suggestions: buildSearchSuggestions(graph, query, filtered.map((item) => item.node)),
    filters: {
      ...(options.type ? { type: options.type } : {}),
      ...(options.tag ? { tag: options.tag } : {}),
      ...(options.status ? { status: options.status } : {}),
      sort,
      ...(typeof options.limit === 'number' ? { limit: options.limit } : {}),
    },
  };
}

export function buildTimeline(
  graph: GraphData,
  filters: { nodeId?: string; yearStart?: number; yearEnd?: number },
): TimelineEvent[] {
  const start = filters.yearStart ?? Number.NEGATIVE_INFINITY;
  const end = filters.yearEnd ?? Number.POSITIVE_INFINITY;

  return graph.nodes
    .filter((node) => !filters.nodeId || node.id === filters.nodeId)
    .flatMap((node) =>
      (node.events ?? []).map((event) => ({
        ...event,
        node: {
          id: node.id,
          name: node.name,
          type: node.type,
          tags: node.tags,
        },
      })),
    )
    .filter((event) => {
      const year = new Date(event.date).getFullYear();
      return Number.isFinite(year) && year >= start && year <= end;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function buildTechTree(graph: GraphData): { tiers: TechTreeTier[] } {
  const technologies = graph.nodes.filter((node) => node.type === 'Technology' || node.type === 'Research');
  const models = graph.nodes.filter((node) => node.type === 'Model' || node.type === 'Open Source');
  const products = graph.nodes.filter((node) => node.type === 'Product');

  return {
    tiers: [
      { id: 'foundations', name: 'Foundations', nodes: toTechNodes(technologies) },
      { id: 'models', name: 'Models & Open Weights', nodes: toTechNodes(models) },
      { id: 'applications', name: 'Applications', nodes: toTechNodes(products) },
    ],
  };
}

export function findShortestPath(graph: GraphData, from: string, to: string): PathResult {
  if (!from || !to) {
    return emptyPath(from, to, 'Both from and to node ids are required.');
  }

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  if (!nodeById.has(from) || !nodeById.has(to)) {
    return emptyPath(from, to, 'One or both nodes do not exist in the constellation graph.');
  }

  if (from === to) {
    return {
      from,
      to,
      found: true,
      nodes: [nodeById.get(from)!],
      edges: [],
      explanation: `${nodeById.get(from)!.name} is already the selected target node.`,
    };
  }

  const adjacency = new Map<string, string[]>();
  graph.edges.forEach((edge) => {
    adjacency.set(edge.sourceId, [...(adjacency.get(edge.sourceId) ?? []), edge.targetId]);
    adjacency.set(edge.targetId, [...(adjacency.get(edge.targetId) ?? []), edge.sourceId]);
  });

  const queue = [from];
  const visited = new Set([from]);
  const previous = new Map<string, string>();

  while (queue.length) {
    const current = queue.shift()!;
    if (current === to) break;

    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      previous.set(neighbor, current);
      queue.push(neighbor);
    }
  }

  if (!visited.has(to)) {
    return emptyPath(from, to, 'No visible relationship path was found in the current MVP graph.');
  }

  const pathIds = [to];
  while (pathIds[0] !== from) {
    pathIds.unshift(previous.get(pathIds[0])!);
  }

  const pathNodes = pathIds.map((id) => nodeById.get(id)!);
  const pathEdges = pathIds.slice(1).map((id, index) => {
    const sourceId = pathIds[index];
    return graph.edges.find(
      (edge) =>
        (edge.sourceId === sourceId && edge.targetId === id) ||
        (edge.sourceId === id && edge.targetId === sourceId),
    )!;
  });

  return {
    from,
    to,
    found: true,
    nodes: pathNodes,
    edges: pathEdges,
    explanation: pathNodes.map((node) => node.name).join(' -> '),
  };
}

export function exploreRelationships(graph: GraphData, options: RelationshipExplorerOptions): RelationshipExplorerResult {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const center = nodeById.get(options.nodeId);
  const hops = Math.max(1, Math.min(3, Math.floor(options.hops ?? 2)));

  if (!center) {
    return {
      nodeId: options.nodeId,
      found: false,
      nodes: [],
      edges: [],
      layers: [],
      relationCounts: [],
      explanation: 'The requested center node does not exist in the current graph.',
    };
  }

  const allowedEdges = options.relationType
    ? graph.edges.filter((edge) => edge.relationType === options.relationType)
    : graph.edges;
  const adjacency = new Map<string, GraphEdge[]>();
  allowedEdges.forEach((edge) => {
    adjacency.set(edge.sourceId, [...(adjacency.get(edge.sourceId) ?? []), edge]);
    adjacency.set(edge.targetId, [...(adjacency.get(edge.targetId) ?? []), edge]);
  });

  const depths = new Map<string, number>([[center.id, 0]]);
  const edgeIds = new Set<string>();
  const queue = [center.id];

  while (queue.length) {
    const currentId = queue.shift()!;
    const currentDepth = depths.get(currentId) ?? 0;
    if (currentDepth >= hops) continue;

    for (const edge of adjacency.get(currentId) ?? []) {
      const neighborId = edge.sourceId === currentId ? edge.targetId : edge.sourceId;
      if (!nodeById.has(neighborId)) continue;
      edgeIds.add(edge.id);
      if (depths.has(neighborId)) continue;
      depths.set(neighborId, currentDepth + 1);
      queue.push(neighborId);
    }
  }

  const nodeIds = new Set(depths.keys());
  const nodes = graph.nodes.filter((node) => nodeIds.has(node.id));
  const edges = allowedEdges.filter((edge) => edgeIds.has(edge.id) && nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId));
  const layers = Array.from({ length: hops + 1 }, (_item, depth) => ({
    depth,
    nodes: nodes.filter((node) => depths.get(node.id) === depth).sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name)),
  })).filter((layer) => layer.nodes.length > 0);

  return {
    nodeId: center.id,
    found: true,
    center,
    nodes,
    edges,
    layers,
    relationCounts: countFacet(edges.map((edge) => edge.relationType)),
    explanation: `${center.name} relationship explorer returned ${nodes.length} nodes and ${edges.length} edges within ${hops} hop${hops > 1 ? 's' : ''}.`,
  };
}

function scoreNode(node: GraphNode, query: string) {
  let score = 0;
  const name = node.name.toLowerCase();
  if (name === query) score += 100;
  if (name.includes(query)) score += 50;
  if (node.type.toLowerCase().includes(query)) score += 20;
  if (node.subtitle.toLowerCase().includes(query)) score += 18;
  if (node.description.toLowerCase().includes(query)) score += 12;
  score += node.tags.filter((tag) => tag.toLowerCase().includes(query)).length * 16;
  return score;
}

function normalizeSearchSort(sort: SearchOptions['sort']): SearchSort {
  return sort === 'popularity' || sort === 'name' || sort === 'recent' ? sort : 'relevance';
}

function compareSearchResults(
  a: { node: GraphNode; score: number },
  b: { node: GraphNode; score: number },
  sort: SearchSort,
) {
  if (sort === 'popularity') return b.node.popularity - a.node.popularity || a.node.name.localeCompare(b.node.name);
  if (sort === 'name') return a.node.name.localeCompare(b.node.name);
  if (sort === 'recent') return latestNodeYear(b.node) - latestNodeYear(a.node) || b.node.popularity - a.node.popularity;
  return b.score - a.score || b.node.popularity - a.node.popularity || a.node.name.localeCompare(b.node.name);
}

function latestNodeYear(node: GraphNode) {
  const years = [
    node.foundedAt ? new Date(node.foundedAt).getFullYear() : Number.NEGATIVE_INFINITY,
    ...(node.events ?? []).map((event) => new Date(event.date).getFullYear()),
  ].filter(Number.isFinite);
  return years.length ? Math.max(...years) : Number.NEGATIVE_INFINITY;
}

function buildSearchFacets(nodes: GraphNode[]): SearchPayload['facets'] {
  return {
    types: countFacet(nodes.map((node) => node.type)),
    tags: countFacet(nodes.flatMap((node) => node.tags)).slice(0, 24),
    statuses: countFacet(nodes.map((node) => node.status)),
  };
}

function countFacet(values: string[]): SearchFacet[] {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function buildSearchSuggestions(
  graph: GraphData,
  query: string,
  filteredItems: GraphNode[],
): SearchPayload['suggestions'] {
  const normalized = query.toLowerCase();
  const base = normalized
    ? graph.nodes
        .filter((node) => !filteredItems.some((item) => item.id === node.id))
        .map((node) => ({ node, score: scoreSuggestion(node, normalized) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || b.node.popularity - a.node.popularity)
        .map((item) => item.node)
    : [...graph.nodes].sort((a, b) => b.popularity - a.popularity);

  return base.slice(0, 8).map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    subtitle: node.subtitle,
    tags: node.tags,
  }));
}

function scoreSuggestion(node: GraphNode, query: string) {
  const haystack = [node.name, node.type, node.subtitle, node.description, ...node.tags, ...(node.relatedTechnology ?? [])]
    .join(' ')
    .toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 10 : 0), 0) + (node.name.toLowerCase().startsWith(query[0] ?? '') ? 2 : 0);
}

function toTechNodes(nodes: GraphNode[]) {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    subtitle: node.subtitle,
    description: node.description,
    tags: node.tags,
  }));
}

function emptyPath(from: string, to: string, explanation: string): PathResult {
  return {
    from,
    to,
    found: false,
    nodes: [],
    edges: [],
    explanation,
  };
}
