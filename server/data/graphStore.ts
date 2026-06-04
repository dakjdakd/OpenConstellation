import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GraphData, GraphEdge, GraphNode } from '../../src/types.ts';

export interface GraphStore {
  getGraph(): GraphData;
  saveGraph(graph: GraphData): GraphData;
  upsertNode(node: GraphNode): GraphData;
  removeNode(nodeId: string): GraphData;
  upsertEdge(edge: GraphEdge): GraphData;
  removeEdge(edgeId: string): GraphData;
}

const DEFAULT_GRAPH: GraphData = {
  nodes: [],
  edges: [],
};

export function createGraphStore(filePath = join(process.cwd(), 'server', 'data', 'graph-data.json')): GraphStore {
  ensureGraphFile(filePath);

  function readGraph() {
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<GraphData>;
      return normalizeGraph(parsed);
    } catch {
      writeGraph(DEFAULT_GRAPH);
      return structuredClone(DEFAULT_GRAPH);
    }
  }

  function writeGraph(graph: GraphData) {
    const normalized = normalizeGraph(graph);
    mkdirSync(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
    renameSync(tempPath, filePath);
    return normalized;
  }

  return {
    getGraph: readGraph,
    saveGraph: writeGraph,
    upsertNode(node) {
      const graph = readGraph();
      const exists = graph.nodes.some((item) => item.id === node.id);
      return writeGraph({
        nodes: exists ? graph.nodes.map((item) => (item.id === node.id ? node : item)) : [...graph.nodes, node],
        edges: graph.edges,
      });
    },
    removeNode(nodeId) {
      const graph = readGraph();
      return writeGraph({
        nodes: graph.nodes.filter((node) => node.id !== nodeId),
        edges: graph.edges.filter((edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId),
      });
    },
    upsertEdge(edge) {
      const graph = readGraph();
      const exists = graph.edges.some((item) => item.id === edge.id);
      return writeGraph({
        nodes: graph.nodes,
        edges: exists ? graph.edges.map((item) => (item.id === edge.id ? edge : item)) : [...graph.edges, edge],
      });
    },
    removeEdge(edgeId) {
      const graph = readGraph();
      return writeGraph({
        nodes: graph.nodes,
        edges: graph.edges.filter((edge) => edge.id !== edgeId),
      });
    },
  };
}

function ensureGraphFile(filePath: string) {
  if (existsSync(filePath)) return;
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(DEFAULT_GRAPH, null, 2)}\n`, 'utf8');
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
