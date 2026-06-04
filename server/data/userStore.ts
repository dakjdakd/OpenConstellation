import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AiResult } from '../services/deepseek.ts';

export interface CollectionRecord {
  id: string;
  name: string;
  nodes: string[];
  color?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserConstellation {
  favorites: string[];
  collections: CollectionRecord[];
  recentViews: string[];
  searchHistory: string[];
  aiInsights: Record<string, AiResult>;
}

export interface UserStore {
  getConstellation(): UserConstellation;
  addFavorite(nodeId: string): UserConstellation;
  removeFavorite(nodeId: string): UserConstellation;
  createCollection(input: { name: string; color?: string }): UserConstellation;
  removeCollection(collectionId: string): UserConstellation;
  addNodeToCollection(collectionId: string, nodeId: string): UserConstellation | null;
  removeNodeFromCollection(collectionId: string, nodeId: string): UserConstellation | null;
  addRecentView(nodeId: string): UserConstellation;
  clearRecentViews(): UserConstellation;
  addSearchHistory(query: string): UserConstellation;
  clearSearchHistory(): UserConstellation;
  cacheAiInsight(key: string, insight: AiResult): UserConstellation;
  getAiInsight(key: string): AiResult | undefined;
}

const DEFAULT_STATE: UserConstellation = {
  favorites: [],
  collections: [
    createCollectionRecord('Agents', '1'),
    createCollectionRecord('Foundational Models', '2'),
  ],
  recentViews: [],
  searchHistory: [],
  aiInsights: {},
};

export function createUserStore(filePath = join(process.cwd(), 'server', 'data', 'user-state.json')): UserStore {
  ensureStateFile(filePath);

  function readState() {
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<UserConstellation>;
      return normalizeState(parsed);
    } catch {
      writeState(DEFAULT_STATE);
      return structuredClone(DEFAULT_STATE);
    }
  }

  function writeState(state: UserConstellation) {
    mkdirSync(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tempPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    renameSync(tempPath, filePath);
  }

  function update(mutator: (state: UserConstellation) => UserConstellation) {
    const next = mutator(readState());
    writeState(next);
    return next;
  }

  return {
    getConstellation: readState,
    addFavorite(nodeId) {
      return update((state) => ({
        ...state,
        favorites: unique([nodeId, ...state.favorites]).slice(0, 100),
      }));
    },
    removeFavorite(nodeId) {
      return update((state) => ({
        ...state,
        favorites: state.favorites.filter((item) => item !== nodeId),
      }));
    },
    createCollection(input) {
      return update((state) => ({
        ...state,
        collections: [...state.collections, createCollectionRecord(input.name, undefined, input.color)],
      }));
    },
    removeCollection(collectionId) {
      return update((state) => ({
        ...state,
        collections: state.collections.filter((collection) => collection.id !== collectionId),
      }));
    },
    addNodeToCollection(collectionId, nodeId) {
      const state = readState();
      if (!state.collections.some((collection) => collection.id === collectionId)) return null;
      const next = {
        ...state,
        collections: state.collections.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                nodes: unique([...collection.nodes, nodeId]),
                updatedAt: new Date().toISOString(),
              }
            : collection,
        ),
      };
      writeState(next);
      return next;
    },
    removeNodeFromCollection(collectionId, nodeId) {
      const state = readState();
      if (!state.collections.some((collection) => collection.id === collectionId)) return null;
      const next = {
        ...state,
        collections: state.collections.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                nodes: collection.nodes.filter((item) => item !== nodeId),
                updatedAt: new Date().toISOString(),
              }
            : collection,
        ),
      };
      writeState(next);
      return next;
    },
    addRecentView(nodeId) {
      return update((state) => ({
        ...state,
        recentViews: unique([nodeId, ...state.recentViews]).slice(0, 15),
      }));
    },
    clearRecentViews() {
      return update((state) => ({
        ...state,
        recentViews: [],
      }));
    },
    addSearchHistory(query) {
      const cleaned = query.trim();
      if (!cleaned) return readState();
      return update((state) => ({
        ...state,
        searchHistory: unique([cleaned, ...state.searchHistory]).slice(0, 10),
      }));
    },
    clearSearchHistory() {
      return update((state) => ({
        ...state,
        searchHistory: [],
      }));
    },
    cacheAiInsight(key, insight) {
      return update((state) => ({
        ...state,
        aiInsights: {
          ...state.aiInsights,
          [key]: insight,
        },
      }));
    },
    getAiInsight(key) {
      return readState().aiInsights[key];
    },
  };
}

function ensureStateFile(filePath: string) {
  if (existsSync(filePath)) return;
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(DEFAULT_STATE, null, 2)}\n`, 'utf8');
}

function normalizeState(value: Partial<UserConstellation>): UserConstellation {
  return {
    favorites: Array.isArray(value.favorites) ? value.favorites.filter(isString) : [],
    collections: Array.isArray(value.collections)
      ? value.collections.filter(isCollectionRecord).map(normalizeCollection)
      : DEFAULT_STATE.collections,
    recentViews: Array.isArray(value.recentViews) ? value.recentViews.filter(isString).slice(0, 15) : [],
    searchHistory: Array.isArray(value.searchHistory) ? value.searchHistory.filter(isString).slice(0, 10) : [],
    aiInsights: isRecord(value.aiInsights) ? (value.aiInsights as Record<string, AiResult>) : {},
  };
}

function createCollectionRecord(name: string, id: string = randomUUID(), color?: string): CollectionRecord {
  const now = new Date().toISOString();
  return {
    id,
    name,
    nodes: [],
    ...(color ? { color } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeCollection(collection: CollectionRecord): CollectionRecord {
  return {
    ...collection,
    nodes: Array.isArray(collection.nodes) ? collection.nodes.filter(isString) : [],
    createdAt: collection.createdAt || new Date().toISOString(),
    updatedAt: collection.updatedAt || new Date().toISOString(),
  };
}

function unique(items: string[]) {
  return [...new Set(items.filter(isString))];
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCollectionRecord(value: unknown): value is CollectionRecord {
  return isRecord(value) && isString(value.id) && isString(value.name) && Array.isArray(value.nodes);
}
