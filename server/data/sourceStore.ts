import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { GraphData, GraphEdge, GraphNode } from '../../src/types.ts';
import { createJsonFileStore, type JsonFileMeta } from './jsonFileStore.ts';

export type SourceKind = 'official' | 'github' | 'paper' | 'wiki' | 'news' | 'manual' | 'api';
export type TrustLevel = 'primary' | 'secondary' | 'community' | 'unverified';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface SourceRecord {
  id: string;
  url: string;
  kind: SourceKind;
  title: string;
  publisher?: string;
  fetchedAt: string;
  trustLevel: TrustLevel;
  reviewStatus: ReviewStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ImportBatch {
  id: string;
  provider: 'json' | 'github' | 'manual';
  status: ReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  query?: string;
  mode: 'merge' | 'replace';
  nodes: GraphNode[];
  edges: GraphEdge[];
  sources: SourceRecord[];
  summary: {
    importedNodes: number;
    importedEdges: number;
    importedSources: number;
    warnings: string[];
  };
  notes?: string;
}

interface SourceState {
  sources: SourceRecord[];
  importBatches: ImportBatch[];
}

export interface SourceStore {
  getSources(graph?: GraphData): SourceRecord[];
  upsertSource(source: SourceRecord): SourceRecord;
  removeSource(sourceId: string): { removed: true };
  createImportBatch(input: Omit<ImportBatch, 'id' | 'createdAt' | 'summary'> & { summary?: Partial<ImportBatch['summary']> }): ImportBatch;
  getImportBatches(status?: ReviewStatus): ImportBatch[];
  getImportBatch(batchId: string): ImportBatch | undefined;
  updateImportBatch(batchId: string, patch: Partial<Pick<ImportBatch, 'status' | 'reviewedAt' | 'reviewedBy' | 'notes'>>): ImportBatch | undefined;
  approveImportBatch(batchId: string, graph: GraphData): { batch: ImportBatch; graph: GraphData } | { error: string };
  getMeta(): JsonFileMeta;
}

const DEFAULT_STATE: SourceState = {
  sources: [],
  importBatches: [],
};

export function createSourceStore(filePath = join(process.cwd(), 'server', 'data', 'source-store.json')): SourceStore {
  const store = createJsonFileStore({
    filePath,
    defaultValue: DEFAULT_STATE,
    normalize: normalizeSourceState,
  });

  function upsertSources(sources: SourceRecord[]) {
    return store.update((state) => {
      const byId = new Map(state.sources.map((source) => [source.id, source]));
      sources.forEach((source) => byId.set(source.id, source));
      return { ...state, sources: [...byId.values()].sort((a, b) => a.title.localeCompare(b.title)) };
    });
  }

  return {
    getSources(graph) {
      const state = store.read();
      const inferred = graph ? inferSourcesFromGraph(graph, state.sources) : [];
      if (!inferred.length) return state.sources;
      return upsertSources(inferred).sources;
    },
    upsertSource(source) {
      return upsertSources([source]).sources.find((item) => item.id === source.id) ?? source;
    },
    removeSource(sourceId) {
      store.update((state) => ({ ...state, sources: state.sources.filter((source) => source.id !== sourceId) }));
      return { removed: true };
    },
    createImportBatch(input) {
      const batch: ImportBatch = {
        ...input,
        id: `import_${Date.now()}_${randomUUID().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        summary: {
          importedNodes: input.nodes.length,
          importedEdges: input.edges.length,
          importedSources: input.sources.length,
          warnings: input.summary?.warnings ?? [],
        },
      };
      store.update((state) => ({ ...state, importBatches: [batch, ...state.importBatches].slice(0, 100) }));
      upsertSources(input.sources);
      return batch;
    },
    getImportBatches(status) {
      const batches = store.read().importBatches;
      return status ? batches.filter((batch) => batch.status === status) : batches;
    },
    getImportBatch(batchId) {
      return store.read().importBatches.find((batch) => batch.id === batchId);
    },
    updateImportBatch(batchId, patch) {
      const state = store.read();
      const batch = state.importBatches.find((item) => item.id === batchId);
      if (!batch) return undefined;
      const nextBatch = { ...batch, ...patch };
      store.write({
        ...state,
        importBatches: state.importBatches.map((item) => (item.id === batchId ? nextBatch : item)),
      });
      return nextBatch;
    },
    approveImportBatch(batchId, graph) {
      const state = store.read();
      const batch = state.importBatches.find((item) => item.id === batchId);
      if (!batch) return { error: 'import_batch_not_found' };
      if (batch.status === 'rejected') return { error: 'import_batch_rejected' };

      const nextGraph = batch.mode === 'replace' ? { nodes: batch.nodes, edges: batch.edges } : mergeGraph(graph, batch);
      const reviewedAt = new Date().toISOString();
      const approvedBatch = { ...batch, status: 'approved' as const, reviewedAt };
      const sources = batch.sources.map((source) => ({ ...source, reviewStatus: 'approved' as const }));

      store.write({
        sources: mergeSources(state.sources, sources),
        importBatches: state.importBatches.map((item) => (item.id === batchId ? approvedBatch : item)),
      });

      return { batch: approvedBatch, graph: nextGraph };
    },
    getMeta: store.getMeta,
  };
}

export function makeSourceRecord(input: {
  url: string;
  kind?: SourceKind;
  title?: string;
  publisher?: string;
  trustLevel?: TrustLevel;
  reviewStatus?: ReviewStatus;
  fetchedAt?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}): SourceRecord {
  const url = input.url.trim();
  const host = safeHost(url);
  return {
    id: sourceIdFromUrl(url),
    url,
    kind: input.kind ?? inferSourceKind(url),
    title: input.title?.trim() || host || url,
    ...(input.publisher ? { publisher: input.publisher.trim() } : host ? { publisher: host } : {}),
    fetchedAt: input.fetchedAt ?? new Date().toISOString(),
    trustLevel: input.trustLevel ?? inferTrustLevel(url),
    reviewStatus: input.reviewStatus ?? 'pending',
    ...(input.notes ? { notes: input.notes.trim() } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };
}

function normalizeSourceState(value: unknown): SourceState {
  if (!isRecord(value)) return structuredClone(DEFAULT_STATE);
  return {
    sources: Array.isArray(value.sources) ? value.sources.map(parseSourceRecord).filter((item) => item !== null) : [],
    importBatches: Array.isArray(value.importBatches) ? value.importBatches.map(parseImportBatch).filter((item) => item !== null) : [],
  };
}

function parseSourceRecord(value: unknown): SourceRecord | null {
  if (!isRecord(value)) return null;
  const url = asCleanString(value.url);
  const id = asCleanString(value.id) || sourceIdFromUrl(url);
  const title = asCleanString(value.title) || safeHost(url) || url;
  if (!id || !url || !title) return null;
  return {
    id,
    url,
    title,
    kind: isSourceKind(value.kind) ? value.kind : inferSourceKind(url),
    fetchedAt: asCleanString(value.fetchedAt) || new Date().toISOString(),
    trustLevel: isTrustLevel(value.trustLevel) ? value.trustLevel : inferTrustLevel(url),
    reviewStatus: isReviewStatus(value.reviewStatus) ? value.reviewStatus : 'pending',
    ...(typeof value.publisher === 'string' ? { publisher: value.publisher.trim() } : {}),
    ...(typeof value.notes === 'string' ? { notes: value.notes.trim() } : {}),
    ...(isRecord(value.metadata) ? { metadata: value.metadata } : {}),
  };
}

function parseImportBatch(value: unknown): ImportBatch | null {
  if (!isRecord(value)) return null;
  const id = asCleanString(value.id);
  if (!id) return null;
  const nodes = Array.isArray(value.nodes) ? (value.nodes.filter(isRecord) as unknown as GraphNode[]) : [];
  const edges = Array.isArray(value.edges) ? (value.edges.filter(isRecord) as unknown as GraphEdge[]) : [];
  const sources = Array.isArray(value.sources) ? value.sources.map(parseSourceRecord).filter((item) => item !== null) : [];
  return {
    id,
    provider: value.provider === 'github' || value.provider === 'manual' ? value.provider : 'json',
    status: isReviewStatus(value.status) ? value.status : 'pending',
    createdAt: asCleanString(value.createdAt) || new Date().toISOString(),
    ...(typeof value.reviewedAt === 'string' ? { reviewedAt: value.reviewedAt } : {}),
    ...(typeof value.reviewedBy === 'string' ? { reviewedBy: value.reviewedBy } : {}),
    ...(typeof value.query === 'string' ? { query: value.query } : {}),
    mode: value.mode === 'replace' ? 'replace' : 'merge',
    nodes,
    edges,
    sources,
    summary: {
      importedNodes: nodes.length,
      importedEdges: edges.length,
      importedSources: sources.length,
      warnings: isRecord(value.summary) && Array.isArray(value.summary.warnings)
        ? value.summary.warnings.filter((item): item is string => typeof item === 'string')
        : [],
    },
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
  };
}

function inferSourcesFromGraph(graph: GraphData, existing: SourceRecord[]) {
  const existingIds = new Set(existing.map((source) => source.id));
  const urls = [...new Set([...graph.nodes, ...graph.edges].flatMap((item) => item.sourceList ?? []))];
  return urls
    .map((url) => makeSourceRecord({ url, reviewStatus: 'approved' }))
    .filter((source) => !existingIds.has(source.id));
}

function mergeGraph(current: GraphData, incoming: Pick<ImportBatch, 'nodes' | 'edges'>): GraphData {
  const nodes = new Map(current.nodes.map((node) => [node.id, node]));
  incoming.nodes.forEach((node) => nodes.set(node.id, node));
  const nodeIds = new Set(nodes.keys());
  const edges = new Map(current.edges.map((edge) => [edge.id, edge]));
  incoming.edges.filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId)).forEach((edge) => edges.set(edge.id, edge));
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

function mergeSources(current: SourceRecord[], incoming: SourceRecord[]) {
  const byId = new Map(current.map((source) => [source.id, source]));
  incoming.forEach((source) => byId.set(source.id, source));
  return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
}

function sourceIdFromUrl(url: string) {
  return `src_${Buffer.from(url).toString('base64url').slice(0, 32)}`;
}

function inferSourceKind(url: string): SourceKind {
  const host = safeHost(url);
  if (host.includes('github.com')) return 'github';
  if (host.includes('arxiv.org')) return 'paper';
  if (host.includes('wikipedia.org') || host.includes('wikidata.org')) return 'wiki';
  if (host.includes('blog.') || host.includes('news')) return 'news';
  return 'official';
}

function inferTrustLevel(url: string): TrustLevel {
  const kind = inferSourceKind(url);
  if (kind === 'official' || kind === 'paper' || kind === 'github') return 'primary';
  if (kind === 'wiki') return 'secondary';
  return 'unverified';
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function asCleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isSourceKind(value: unknown): value is SourceKind {
  return value === 'official' || value === 'github' || value === 'paper' || value === 'wiki' || value === 'news' || value === 'manual' || value === 'api';
}

function isTrustLevel(value: unknown): value is TrustLevel {
  return value === 'primary' || value === 'secondary' || value === 'community' || value === 'unverified';
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
