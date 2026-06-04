import { create } from 'zustand';
import { GraphNode, GraphEdge } from './types';
import { mockData } from './data';
import {
  clearSearchHistoryRemote,
  deleteFavorite,
  fetchConstellation,
  fetchGraphData,
  saveCollection,
  saveFavorite,
  saveNodeToCollection,
  saveRecentView,
  saveSearchHistory,
  type CollectionRecord,
} from './api';

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
  isApiBacked: boolean;
  apiStatus: 'idle' | 'loading' | 'ready' | 'fallback';
  loadGraphFromApi: () => Promise<void>;
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
  collections: CollectionRecord[];
  recentViews: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  createCollection: (name: string, color?: string) => void;
  addNodeToCollection: (collectionId: string, nodeId: string) => void;
  addRecentView: (id: string) => void;
}

function applyGraphFilters(state: AppState) {
  const { nodes, edges, activeFilterType, activeRelationFilter, activePopularityFilter, activeCategoryFilter, activeTimeRange, isolatedNodeId } = state;
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

  if (activePopularityFilter) {
    if (activePopularityFilter === 'hot') fn = fn.filter(n => n.popularity >= 9);
    else if (activePopularityFilter === 'rising') fn = fn.filter(n => n.popularity >= 7 && n.popularity < 9);
    else fn = fn.filter(n => n.popularity < 7);
  }

  if (activeCategoryFilter) {
    fn = fn.filter(n => n.tags.some(tag => tag.toLowerCase() === activeCategoryFilter.toLowerCase()));
  }

  if (activeTimeRange) {
    const [start, end] = activeTimeRange;
    fn = fn.filter(n => {
      if (!n.foundedAt) return false;
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

  return { filteredNodes: fn, filteredEdges: fe };
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
  isApiBacked: false,
  apiStatus: 'idle',
  loadGraphFromApi: async () => {
    set({ apiStatus: 'loading' });
    const [graph, constellation] = await Promise.all([fetchGraphData(), fetchConstellation()]);
    set((state) => ({
      nodes: graph.nodes,
      edges: graph.edges,
      favorites: constellation.favorites,
      collections: constellation.collections,
      recentViews: constellation.recentViews,
      searchHistory: constellation.searchHistory,
      isApiBacked: graph !== mockData,
      apiStatus: graph === mockData ? 'fallback' : 'ready',
      ...applyGraphFilters({
        ...state,
        nodes: graph.nodes,
        edges: graph.edges,
        favorites: constellation.favorites,
        collections: constellation.collections,
        recentViews: constellation.recentViews,
        searchHistory: constellation.searchHistory,
      }),
    }));
  },
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
  addFavorite: (id) => {
    set(s => ({ favorites: [...s.favorites.filter(x => x !== id), id] }));
    void saveFavorite(id).then(next => set({ favorites: next.favorites, collections: next.collections, recentViews: next.recentViews, searchHistory: next.searchHistory })).catch(() => undefined);
  },
  removeFavorite: (id) => {
    set(s => ({ favorites: s.favorites.filter(x => x !== id) }));
    void deleteFavorite(id).then(next => set({ favorites: next.favorites, collections: next.collections, recentViews: next.recentViews, searchHistory: next.searchHistory })).catch(() => undefined);
  },
  createCollection: (name, color) => {
    const fallback = { id: Math.random().toString(), name, nodes: [], color };
    set(s => ({ collections: [...s.collections, fallback] }));
    void saveCollection(name, color).then(next => set({ favorites: next.favorites, collections: next.collections, recentViews: next.recentViews, searchHistory: next.searchHistory })).catch(() => undefined);
  },
  addNodeToCollection: (collectionId, nodeId) => {
    set(s => ({
      collections: s.collections.map(c => c.id === collectionId ? { ...c, nodes: [...new Set([...c.nodes, nodeId])] } : c)
    }));
    void saveNodeToCollection(collectionId, nodeId).then(next => set({ favorites: next.favorites, collections: next.collections, recentViews: next.recentViews, searchHistory: next.searchHistory })).catch(() => undefined);
  },
  addRecentView: (id) => {
    set(s => ({ recentViews: [id, ...s.recentViews.filter(x => x !== id)].slice(0, 15) }));
    void saveRecentView(id).then(next => set({ favorites: next.favorites, collections: next.collections, recentViews: next.recentViews, searchHistory: next.searchHistory })).catch(() => undefined);
  },

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
    void saveSearchHistory(query).then(next => set({ favorites: next.favorites, collections: next.collections, recentViews: next.recentViews, searchHistory: next.searchHistory })).catch(() => undefined);
    return { searchHistory: nh };
  }),
  clearSearchHistory: () => {
    set({ searchHistory: [] });
    void clearSearchHistoryRemote()
      .then((next) =>
        set({
          favorites: next.favorites,
          collections: next.collections,
          recentViews: next.recentViews,
          searchHistory: next.searchHistory,
        }),
      )
      .catch(() => undefined);
  },
  applyFilters: () => {
    set(applyGraphFilters(get()));
  }
}));
