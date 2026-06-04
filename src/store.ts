import { create } from 'zustand';
import { GraphNode, GraphEdge } from './types';
import { mockData } from './data';

interface AppState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  nodes: GraphNode[];
  edges: GraphEdge[];
  filteredNodes: GraphNode[];
  filteredEdges: GraphEdge[];
  activeFilterType: string | null;
  setActiveFilterType: (type: string | null) => void;
  activeRelationFilter: string | null;
  setActiveRelationFilter: (rel: string | null) => void;
  activePopularityFilter: string | null;
  setActivePopularityFilter: (pop: string | null) => void;
  activeCategoryFilter: string | null;
  setActiveCategoryFilter: (cat: string | null) => void;
  activeTimeRange: [number, number] | null;
  setActiveTimeRange: (range: [number, number] | null) => void;
  resetAllFilters: () => void;
  isolatedNodeId: string | null;
  setIsolatedNodeId: (id: string | null) => void;
  appState: 'landing' | 'generating' | 'exploring';
  setAppState: (state: 'landing' | 'generating' | 'exploring') => void;
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  applyFilters: () => void;
  zoomTransform: { k: number; x: number; y: number };
  setZoomTransform: (transform: { k: number; x: number; y: number }) => void;
  pathStartNodeId: string | null;
  setPathStartNodeId: (id: string | null) => void;
  pathEndNodeId: string | null;
  setPathEndNodeId: (id: string | null) => void;
  exploreMode: boolean;
  setExploreMode: (explore: boolean) => void;

  favorites: string[];
  collections: { id: string; name: string; nodes: string[]; color?: string }[];
  recentViews: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  createCollection: (name: string, color?: string) => void;
  addNodeToCollection: (collectionId: string, nodeId: string) => void;
  addRecentView: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedNodeId: null,
  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });
    if (id) get().addRecentView(id);
  },
  hoveredNodeId: null,
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  showFilters: false,
  setShowFilters: (show) => set({ showFilters: show }),
  nodes: mockData.nodes,
  edges: mockData.edges,
  filteredNodes: mockData.nodes,
  filteredEdges: mockData.edges,
  activeFilterType: null,
  activeRelationFilter: null,
  activePopularityFilter: null,
  activeCategoryFilter: null,
  activeTimeRange: null,
  isolatedNodeId: null,
  appState: 'landing',
  setAppState: (state) => set({ appState: state }),
  zoomTransform: { k: 1, x: 0, y: 0 },
  setZoomTransform: (transform) => set({ zoomTransform: transform }),
  pathStartNodeId: null,
  setPathStartNodeId: (id) => set({ pathStartNodeId: id }),
  pathEndNodeId: null,
  setPathEndNodeId: (id) => set({ pathEndNodeId: id }),
  exploreMode: false,
  setExploreMode: (explore) => set({ exploreMode: explore }),
  favorites: [],
  collections: [{id: '1', name: 'Agents', nodes: []}, {id: '2', name: 'Foundational Models', nodes: []}],
  recentViews: [],
  addFavorite: (id) => set(s => ({ favorites: [...s.favorites.filter(x => x !== id), id] })),
  removeFavorite: (id) => set(s => ({ favorites: s.favorites.filter(x => x !== id) })),
  createCollection: (name, color) => set(s => ({ collections: [...s.collections, { id: Math.random().toString(), name, nodes: [], color }] })),
  addNodeToCollection: (collectionId, nodeId) => set(s => ({
    collections: s.collections.map(c => c.id === collectionId ? { ...c, nodes: [...new Set([...c.nodes, nodeId])] } : c)
  })),
  addRecentView: (id) => set(s => ({ recentViews: [id, ...s.recentViews.filter(x => x !== id)].slice(0, 15) })),

  setIsolatedNodeId: (id) => {
    set({ isolatedNodeId: id });
    get().applyFilters();
  },
  setActiveFilterType: (type) => {
    set({ activeFilterType: type });
    get().applyFilters();
  },
  setActiveRelationFilter: (rel) => {
    set({ activeRelationFilter: rel });
    get().applyFilters();
  },
  setActivePopularityFilter: (pop) => {
    set({ activePopularityFilter: pop });
    get().applyFilters();
  },
  setActiveCategoryFilter: (cat) => {
    set({ activeCategoryFilter: cat });
    get().applyFilters();
  },
  setActiveTimeRange: (range) => {
    set({ activeTimeRange: range });
    get().applyFilters();
  },
  resetAllFilters: () => {
    set({
      activeFilterType: null,
      activeRelationFilter: null,
      activePopularityFilter: null,
      activeCategoryFilter: null,
      activeTimeRange: null,
      isolatedNodeId: null
    });
    get().applyFilters();
  },
  searchHistory: [],
  addSearchHistory: (query) => set((state) => {
    const nh = [query, ...state.searchHistory.filter(q => q !== query)].slice(0, 10);
    return { searchHistory: nh };
  }),
  clearSearchHistory: () => set({ searchHistory: [] }),
  applyFilters: () => {
    const { nodes, edges, activeFilterType, activeRelationFilter, activePopularityFilter, activeCategoryFilter, activeTimeRange, isolatedNodeId } = get();
    let fn = nodes;
    let fe = edges;

    if (isolatedNodeId) {
      const connected = new Set<string>([isolatedNodeId]);
      edges.forEach(e => {
        if (e.sourceId === isolatedNodeId) connected.add(e.targetId);
        if (e.targetId === isolatedNodeId) connected.add(e.sourceId);
      });
      fn = fn.filter(n => connected.has(n.id));
      fe = fe.filter(e => connected.has(e.sourceId) && connected.has(e.targetId));
    }

    if (activeFilterType) {
      fn = fn.filter(n => n.type === activeFilterType);
    }
    
    // We assume data has these fields, or we use defaults if missing
    if (activePopularityFilter) {
      // Hot, Rising, Classic. Since our MockData doesn't fully support this, let's fake it based on some logic or ignore if missing.
      // Usually, n.popularity is a number or string. Let's assume popularity > 80 is Hot etc for now.
      if (activePopularityFilter === 'hot') fn = fn.filter(n => (n as any).popularity > 85);
      else if (activePopularityFilter === 'rising') fn = fn.filter(n => (n as any).popularity > 70 && (n as any).popularity <= 85);
      else fn = fn.filter(n => (n as any).popularity <= 70);
    }

    if (activeCategoryFilter) {
      fn = fn.filter(n => n.tags.includes(activeCategoryFilter));
    }

    if (activeTimeRange) {
      const [start, end] = activeTimeRange;
      fn = fn.filter(n => {
        const y = new Date(n.foundedAt).getFullYear();
        return y >= start && y <= end;
      });
    }
    
    if (activeRelationFilter) {
      fe = fe.filter(e => e.relationType === activeRelationFilter);
      const connected = new Set<string>();
      fe.forEach(e => { connected.add(e.sourceId); connected.add(e.targetId); });
      fn = fn.filter(n => connected.has(n.id));
    }

    if (!activeRelationFilter) {
      const fnIds = new Set(fn.map(n => n.id));
      fe = edges.filter(e => fnIds.has(e.sourceId) && fnIds.has(e.targetId));
    }
    
    set({ filteredNodes: fn, filteredEdges: fe });
  }
}));
