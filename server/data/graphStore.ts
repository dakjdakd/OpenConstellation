import { join } from 'node:path';
import type { GraphData, GraphEdge, GraphNode } from '../../src/types.ts';
import { createJsonFileStore, type JsonFileMeta } from './jsonFileStore.ts';

export interface GraphStore {
  getGraph(): GraphData;
  saveGraph(graph: GraphData): GraphData;
  upsertNode(node: GraphNode): GraphData;
  removeNode(nodeId: string): GraphData;
  upsertEdge(edge: GraphEdge): GraphData;
  removeEdge(edgeId: string): GraphData;
  getMeta(): JsonFileMeta;
}

const DEFAULT_GRAPH: GraphData = {
  nodes: [],
  edges: [],
};

export function createGraphStore(filePath = join(process.cwd(), 'server', 'data', 'graph-data.json')): GraphStore {
  const store = createJsonFileStore({
    filePath,
    defaultValue: DEFAULT_GRAPH,
    normalize: normalizeGraph,
  });

  return {
    getGraph: store.read,
    saveGraph: store.write,
    upsertNode(node) {
      return store.update((graph) => {
        const exists = graph.nodes.some((item) => item.id === node.id);
        return {
        nodes: exists ? graph.nodes.map((item) => (item.id === node.id ? node : item)) : [...graph.nodes, node],
        edges: graph.edges,
        };
      });
    },
    removeNode(nodeId) {
      return store.update((graph) => ({
        nodes: graph.nodes.filter((node) => node.id !== nodeId),
        edges: graph.edges.filter((edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId),
      }));
    },
    upsertEdge(edge) {
      return store.update((graph) => {
        const exists = graph.edges.some((item) => item.id === edge.id);
        return {
        nodes: graph.nodes,
        edges: exists ? graph.edges.map((item) => (item.id === edge.id ? edge : item)) : [...graph.edges, edge],
        };
      });
    },
    removeEdge(edgeId) {
      return store.update((graph) => ({
        nodes: graph.nodes,
        edges: graph.edges.filter((edge) => edge.id !== edgeId),
      }));
    },
    getMeta: store.getMeta,
  };
}

function normalizeGraph(value: Partial<GraphData>): GraphData {
  const nodes = Array.isArray(value.nodes) ? value.nodes.filter(isRecord) : [];
  const nodeIds = new Set(nodes.map((node) => (typeof node.id === 'string' ? node.id : '')).filter(Boolean));
  const edges = Array.isArray(value.edges)
    ? value.edges.filter(
        (edge) =>
          isRecord(edge) &&
          typeof edge.sourceId === 'string' &&
          typeof edge.targetId === 'string' &&
          nodeIds.has(edge.sourceId) &&
          nodeIds.has(edge.targetId),
      )
    : [];

  return {
    nodes: nodes as GraphData['nodes'],
    edges: edges as GraphData['edges'],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
