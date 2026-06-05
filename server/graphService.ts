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
