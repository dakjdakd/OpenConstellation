import type { GraphData } from '../../src/types.ts';
import type { JsonFileMeta } from './jsonFileStore.ts';
import type { OverrideStore } from './overrideStore.ts';
import type { SourceStore } from './sourceStore.ts';
import type { UserStore } from './userStore.ts';

export interface StoreMetaProvider {
  getMeta(): JsonFileMeta;
}

export interface DataHealthStoreSet {
  graphStore: { getGraph(): GraphData } & StoreMetaProvider;
  sourceStore: SourceStore & StoreMetaProvider;
  userStore: UserStore & StoreMetaProvider;
  overrideStore: OverrideStore & StoreMetaProvider;
}

export function buildDataHealthReport(stores: DataHealthStoreSet) {
  const graph = stores.graphStore.getGraph();
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const edgeIds = new Set<string>();
  const duplicateEdgeIds = new Set<string>();
  const duplicateNodeIds = findDuplicates(graph.nodes.map((node) => node.id));
  const missingEdgeNodes = graph.edges
    .filter((edge) => !nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId))
    .map((edge) => edge.id);

  graph.edges.forEach((edge) => {
    if (edgeIds.has(edge.id)) duplicateEdgeIds.add(edge.id);
    edgeIds.add(edge.id);
  });

  const sourceRecords = stores.sourceStore.getSources(graph);
  const sourceIds = new Set(sourceRecords.map((source) => source.id));
  const duplicateSourceIds = findDuplicates(sourceRecords.map((source) => source.id));
  const graphSourceUrls = new Set([...graph.nodes, ...graph.edges].flatMap((item) => item.sourceList ?? []));
  const trackedSourceUrls = new Set(sourceRecords.map((source) => source.url));
  const untrackedGraphSources = [...graphSourceUrls].filter((url) => !trackedSourceUrls.has(url));
  const staleSourceRecords = sourceRecords.filter((source) => source.id && !sourceIds.has(source.id)).map((source) => source.id);
  const constellation = stores.userStore.getConstellation();
  const missingFavoriteNodes = constellation.favorites.filter((nodeId) => !nodeIds.has(nodeId));
  const missingRecentNodes = constellation.recentViews.filter((nodeId) => !nodeIds.has(nodeId));
  const missingCollectionNodes = constellation.collections.flatMap((collection) =>
    collection.nodes
      .filter((nodeId) => !nodeIds.has(nodeId))
      .map((nodeId) => ({ collectionId: collection.id, nodeId })),
  );
  const overrides = stores.overrideStore.getOverrides();
  const overrideEntityProblems = overrides
    .filter((record) => {
      if (record.entityType === 'node') return !nodeIds.has(record.entityId);
      if (record.entityType === 'edge') return !edgeIds.has(record.entityId);
      if (record.entityType === 'source') return !sourceIds.has(record.entityId);
      return false;
    })
    .map((record) => record.id);

  const errors = [
    ...duplicateNodeIds.map((id) => ({ code: 'duplicate_node_id', id })),
    ...[...duplicateEdgeIds].map((id) => ({ code: 'duplicate_edge_id', id })),
    ...missingEdgeNodes.map((id) => ({ code: 'edge_nodes_not_found', id })),
    ...duplicateSourceIds.map((id) => ({ code: 'duplicate_source_id', id })),
    ...staleSourceRecords.map((id) => ({ code: 'stale_source_record', id })),
    ...overrideEntityProblems.map((id) => ({ code: 'override_entity_not_found', id })),
  ];
  const warnings = [
    ...missingFavoriteNodes.map((id) => ({ code: 'favorite_node_not_found', id })),
    ...missingRecentNodes.map((id) => ({ code: 'recent_node_not_found', id })),
    ...missingCollectionNodes.map((item) => ({ code: 'collection_node_not_found', id: `${item.collectionId}:${item.nodeId}` })),
  ];

  return {
    ok: errors.length === 0,
    generatedAt: new Date().toISOString(),
    stores: {
      graph: stores.graphStore.getMeta(),
      source: stores.sourceStore.getMeta(),
      user: stores.userStore.getMeta(),
      override: stores.overrideStore.getMeta(),
    },
    counts: {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      sources: sourceRecords.length,
      graphSourceUrls: graphSourceUrls.size,
      untrackedGraphSources: untrackedGraphSources.length,
      favorites: constellation.favorites.length,
      collections: constellation.collections.length,
      recentViews: constellation.recentViews.length,
      searchHistory: constellation.searchHistory.length,
      overrides: overrides.length,
    },
    errors,
    warnings,
    issues: [...errors, ...warnings],
  };
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}
