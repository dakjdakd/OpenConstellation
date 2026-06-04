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
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return graph.nodes
    .map((node) => ({
      node,
      score: scoreNode(node, normalized),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.node.popularity - a.node.popularity)
    .map((item) => item.node);
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
