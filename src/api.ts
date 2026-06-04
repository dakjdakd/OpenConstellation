import { mockData } from './data';
import type { GraphData } from './types';

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
  return getJson<GraphData>('/api/graph', mockData);
}

export async function fetchConstellation(): Promise<UserConstellation> {
  return getJson<UserConstellation>('/api/me/constellation', DEFAULT_CONSTELLATION);
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
