import { mockData } from '../../src/data.ts';
import type { GraphData } from '../../src/types.ts';

export interface GraphStore {
  getGraph(): GraphData;
}

export function createGraphStore(): GraphStore {
  return {
    getGraph() {
      return mockData;
    },
  };
}
