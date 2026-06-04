import type { GraphData, GraphEdge, GraphNode } from './types';

export interface AiResult {
  task: 'insight' | 'complete-node' | 'learning-path' | 'recommendations';
  provider: 'deepseek' | 'fallback';
  model: string;
  confidence: number;
  source: string;
  editable: boolean;
  content: string;
  suggestions: string[];
  metadata: Record<string, unknown>;
}

export interface NodeDetailResponse {
  node: GraphNode;
  incomingEdges: GraphEdge[];
  outgoingEdges: GraphEdge[];
  relatedNodes: GraphNode[];
  events: Array<{ date: string; title?: string; description: string }>;
  aiInsight?: AiResult;
}

export interface SearchResponse {
  query: string;
  items: GraphNode[];
  total: number;
  aiInterpretation?: AiResult;
}

export interface TimelineResponse {
  items: Array<{
    date: string;
    title?: string;
    description: string;
    node: Pick<GraphNode, 'id' | 'name' | 'type' | 'tags'>;
  }>;
  total: number;
}

export interface TechTreeResponse {
  tiers: Array<{
    id: string;
    name: string;
    nodes: Array<Pick<GraphNode, 'id' | 'name' | 'type' | 'subtitle' | 'description' | 'tags'>>;
  }>;
}

export interface CollectionRecord {
  id: string;
  name: string;
  nodes: string[];
  color?: string;
}

export interface UserConstellation {
  favorites: string[];
  collections: CollectionRecord[];
  recentViews: string[];
  searchHistory: string[];
}

const DEFAULT_CONSTELLATION: UserConstellation = {
  favorites: [],
  collections: [
    { id: '1', name: 'Agents', nodes: [] },
    { id: '2', name: 'Foundational Models', nodes: [] },
  ],
  recentViews: [],
  searchHistory: [],
};

export async function fetchGraphData(): Promise<GraphData> {
  return requestJson<GraphData>('/api/graph');
}

export async function fetchConstellation(): Promise<UserConstellation> {
  return getJson<UserConstellation>('/api/me/constellation', DEFAULT_CONSTELLATION);
}

export async function fetchNodeDetail(nodeId: string): Promise<NodeDetailResponse | null> {
  try {
    return await requestJson<NodeDetailResponse>(`/api/nodes/${encodeURIComponent(nodeId)}`);
  } catch (error) {
    const fallback = await getMockGraphFallback();
    if (!fallback) throw error;
    const node = fallback.nodes.find((item) => item.id === nodeId);
    if (!node) return null;
    const incomingEdges = fallback.edges.filter((edge) => edge.targetId === node.id);
    const outgoingEdges = fallback.edges.filter((edge) => edge.sourceId === node.id);
    const relatedIds = new Set<string>([
      ...incomingEdges.map((edge) => edge.sourceId),
      ...outgoingEdges.map((edge) => edge.targetId),
    ]);

    return {
      node,
      incomingEdges,
      outgoingEdges,
      relatedNodes: fallback.nodes.filter((item) => relatedIds.has(item.id)),
      events: node.events ?? [],
    };
  }
}

export async function fetchSearchResults(query: string): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { query: '', items: [], total: 0 };

  try {
    return await requestJson<SearchResponse>(`/api/search?q=${encodeURIComponent(trimmed)}`);
  } catch (error) {
    const fallback = await getMockGraphFallback();
    if (!fallback) throw error;
    const normalized = trimmed.toLowerCase();
    const items = fallback.nodes.filter(
      (node) =>
        node.name.toLowerCase().includes(normalized) ||
        node.type.toLowerCase().includes(normalized) ||
        node.subtitle.toLowerCase().includes(normalized) ||
        node.description.toLowerCase().includes(normalized) ||
        node.tags.some((tag) => tag.toLowerCase().includes(normalized)),
    );
    return { query: trimmed, items, total: items.length };
  }
}

export async function fetchTimeline(): Promise<TimelineResponse> {
  const fallback = await getMockGraphFallback();
  if (!fallback) return requestJson<TimelineResponse>('/api/timeline');
  return getJson<TimelineResponse>('/api/timeline', {
    items: fallback.nodes
      .flatMap((node) => (node.events ?? []).map((event) => ({ ...event, node })))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    total: fallback.nodes.reduce((sum, node) => sum + (node.events?.length ?? 0), 0),
  });
}

export async function fetchTechTree(): Promise<TechTreeResponse> {
  const fallback = await getMockGraphFallback();
  if (!fallback) return requestJson<TechTreeResponse>('/api/tech-tree');
  return getJson<TechTreeResponse>('/api/tech-tree', {
    tiers: [
      {
        id: 'foundations',
        name: 'Foundations',
        nodes: fallback.nodes.filter((node) => node.type === 'Technology' || node.type === 'Research'),
      },
      {
        id: 'models',
        name: 'Models & Open Weights',
        nodes: fallback.nodes.filter((node) => node.type === 'Model' || node.type === 'Open Source'),
      },
      {
        id: 'applications',
        name: 'Applications',
        nodes: fallback.nodes.filter((node) => node.type === 'Product'),
      },
    ],
  });
}

export async function fetchAiLearningPath(nodeId: string) {
  return requestJson<AiResult>(`/api/ai/learning-path/${encodeURIComponent(nodeId)}`);
}

export async function fetchAiRecommendations(nodeId: string) {
  return requestJson<AiResult>(`/api/ai/recommendations/${encodeURIComponent(nodeId)}`);
}

export async function fetchAiNodeCompletion(nodeId: string) {
  return requestJson<AiResult>(`/api/ai/complete-node/${encodeURIComponent(nodeId)}`);
}

export async function saveFavorite(nodeId: string) {
  return postJson<UserConstellation>('/api/me/favorites', { nodeId });
}

export async function deleteFavorite(nodeId: string) {
  return requestJson<UserConstellation>(`/api/me/favorites/${encodeURIComponent(nodeId)}`, {
    method: 'DELETE',
  });
}

export async function saveCollection(name: string, color?: string) {
  return postJson<UserConstellation>('/api/me/collections', { name, color });
}

export async function saveNodeToCollection(collectionId: string, nodeId: string) {
  return postJson<UserConstellation>(`/api/me/collections/${encodeURIComponent(collectionId)}/nodes`, { nodeId });
}

export async function deleteCollection(collectionId: string) {
  return requestJson<UserConstellation>(`/api/me/collections/${encodeURIComponent(collectionId)}`, {
    method: 'DELETE',
  });
}

export async function deleteNodeFromCollection(collectionId: string, nodeId: string) {
  return requestJson<UserConstellation>(
    `/api/me/collections/${encodeURIComponent(collectionId)}/nodes/${encodeURIComponent(nodeId)}`,
    { method: 'DELETE' },
  );
}

export async function saveRecentView(nodeId: string) {
  return postJson<UserConstellation>('/api/me/recent-views', { nodeId });
}

export async function clearRecentViewsRemote() {
  return requestJson<UserConstellation>('/api/me/recent-views', {
    method: 'DELETE',
  });
}

export async function saveSearchHistory(query: string) {
  return postJson<UserConstellation>('/api/me/search-history', { query });
}

export async function clearSearchHistoryRemote() {
  return requestJson<UserConstellation>('/api/me/search-history', {
    method: 'DELETE',
  });
}

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    return await requestJson<T>(url);
  } catch {
    return fallback;
  }
}

async function getMockGraphFallback(): Promise<GraphData | null> {
  if (import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'true') return null;
  const mod = await import('./data');
  return mod.mockData;
}

async function postJson<T>(url: string, body: unknown) {
  return requestJson<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}
