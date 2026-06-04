export type NodeType = 'Company' | 'Product' | 'Model' | 'Person' | 'Technology' | 'Open Source' | 'Research' | 'Investor';
export type RelationType = 'founded_by' | 'competes_with' | 'uses' | 'inspired_by' | 'invested_in' | 'built_on' | 'acquired' | 'powered_by' | 'related_to';

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  subtitle: string;
  description: string;
  logo?: string;
  website?: string;
  github?: string;
  foundedAt?: string;
  founders?: string[];
  country?: string;
  tags: string[];
  popularity: number; // 1 to 10
  status: 'Active' | 'Defunct' | 'Acquired' | 'Merged';
  relatedTechnology?: string[];
  sourceList?: string[];
  aiSummary?: string;
  aiConfidence?: number;
  events?: { date: string, title?: string, description: string }[];
  // Visual positions, populated by d3 simulation
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: RelationType;
  weight: number;
  description?: string;
  sourceList?: string[];
  confidence?: number;
  // D3 maps sourceId/targetId to object references during simulation
  source?: GraphNode | string;
  target?: GraphNode | string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
